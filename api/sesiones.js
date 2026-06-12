import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import formidable from 'formidable';
import fs from 'fs';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
});

const verificarToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET → listar
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=59');
    try {
      const { escenario } = req.query;
      let result;
      if (escenario) {
        result = await pool.query(
          `SELECT id, titulo, descripcion, ponente, escenario, fecha, hora, duracion, categoria, imagen_ponente, publico_objetivo, ponente_especialidad, ponente_bio, ponente_institucion, logo_institucion
           FROM sesiones WHERE activo = true AND escenario = $1 ORDER BY fecha, hora LIMIT 100`,
          [escenario]
        );
      } else {
        result = await pool.query(
          `SELECT id, titulo, descripcion, ponente, escenario, fecha, hora, duracion, categoria, imagen_ponente, publico_objetivo, ponente_especialidad, ponente_bio, ponente_institucion, logo_institucion
           FROM sesiones WHERE activo = true ORDER BY fecha, hora LIMIT 100`
        );
      }
      return res.status(200).json({ success: true, sesiones: result.rows });
    } catch {
      return res.status(200).json({ success: true, sesiones: [] });
    }
  }

  // PUT / POST → actualizar
  if (req.method === 'PUT' || req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const usuario = verificarToken(token);
    if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID de sesión requerido' });

    try {
      let titulo, categoria, ponente, fecha, hora, escenario, descripcion, imagenPonenteUrl = null;

      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        const form = formidable({ keepExtensions: true });
        const [fields, files] = await form.parse(req);
        titulo = fields.titulo?.[0];
        categoria = fields.categoria?.[0];
        ponente = fields.ponente?.[0];
        fecha = fields.fecha?.[0];
        hora = fields.hora?.[0];
        escenario = fields.escenario?.[0];
        descripcion = fields.descripcion?.[0];
        if (files.imagenPonente?.[0]) {
          const uploaded = await cloudinary.uploader.upload(files.imagenPonente[0].filepath, { folder: 'agenda-ues/ponentes' });
          imagenPonenteUrl = uploaded.secure_url;
          fs.unlinkSync(files.imagenPonente[0].filepath);
        }
      } else {
        ({ titulo, categoria, ponente, fecha, hora, escenario, descripcion } = req.body);
      }

      let query, values;
      if (imagenPonenteUrl) {
        query = `UPDATE sesiones SET titulo=$1, categoria=$2, ponente=$3, fecha=$4, hora=$5, escenario=$6, descripcion=$7, imagen_ponente=$8 WHERE id=$9 RETURNING id`;
        values = [titulo, categoria, ponente, fecha, hora, escenario, descripcion, imagenPonenteUrl, id];
      } else {
        query = `UPDATE sesiones SET titulo=$1, categoria=$2, ponente=$3, fecha=$4, hora=$5, escenario=$6, descripcion=$7 WHERE id=$8 RETURNING id`;
        values = [titulo, categoria, ponente, fecha, hora, escenario, descripcion, id];
      }

      const result = await pool.query(query, values);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Sesión no encontrada' });
      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['sesion_editada', 'edit_note', 'Sesión editada', `${titulo || ''} — ${escenario || ''}`, usuario.nombre || 'Administrador']
      ).catch(() => {});
      return res.status(200).json({ success: true, message: 'Sesión actualizada exitosamente', id: result.rows[0].id, imagen_ponente: imagenPonenteUrl });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // DELETE → eliminar
  if (req.method === 'DELETE') {
    const token = req.headers.authorization?.split(' ')[1];
    const usuario = verificarToken(token);
    if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID de sesión requerido' });

    try {
      try { await pool.query('DELETE FROM inscripciones WHERE sesion_id = $1', [id]); } catch {}
      const result = await pool.query('DELETE FROM sesiones WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Sesión no encontrada' });
      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['sesion_eliminada', 'delete', 'Sesión eliminada', `ID ${id} eliminada del programa`, usuario.nombre || 'Administrador']
      ).catch(() => {});
      return res.status(200).json({ success: true, message: 'Sesión eliminada exitosamente' });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
