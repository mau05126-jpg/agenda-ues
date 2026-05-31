// api/sesiones/crear.js
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
  ssl: { rejectUnauthorized: false }
});

const verificarToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const form = formidable({ keepExtensions: true, maxFileSize: 10 * 1024 * 1024 });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Extraer valores (formidable devuelve arrays)
    const getField = (field) => {
      const val = fields[field];
      return Array.isArray(val) ? val[0] : val;
    };

    // Calcular duracion desde horaInicio y horaFin si no viene directamente
    let duracion = parseInt(getField('duracion')) || null;
    const horaInicio = getField('hora') || getField('horaInicio');
    const horaFin = getField('horaFin');

    if (!duracion && horaInicio && horaFin) {
      const [h1, m1] = horaInicio.split(':').map(Number);
      const [h2, m2] = horaFin.split(':').map(Number);
      duracion = (h2 * 60 + m2) - (h1 * 60 + m1);
    }

    // Default si no se pudo calcular
    if (!duracion || duracion <= 0) duracion = 90;

    // Subir imagen del ponente
    let imagenPonenteUrl = null;
    if (files.imagenPonente?.[0]) {
      const result = await cloudinary.uploader.upload(files.imagenPonente[0].filepath, {
        folder: 'agenda-ues/ponentes',
      });
      imagenPonenteUrl = result.secure_url;
      fs.unlinkSync(files.imagenPonente[0].filepath);
    }

    // Subir logo de institución
    let logoInstitucionUrl = null;
    if (files.logoInstitucion?.[0]) {
      const result = await cloudinary.uploader.upload(files.logoInstitucion[0].filepath, {
        folder: 'agenda-ues/logos',
      });
      logoInstitucionUrl = result.secure_url;
      fs.unlinkSync(files.logoInstitucion[0].filepath);
    }

    // Guardar en BD CON duracion
    const result = await pool.query(
      `INSERT INTO sesiones (
        titulo, descripcion, ponente, ponente_especialidad,
        ponente_bio, ponente_institucion, imagen_ponente,
        logo_institucion, escenario, fecha, hora,
        duracion, categoria, publico_objetivo, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        getField('sesionNombre') || '',
        getField('sesionDescripcion') || '',
        getField('ponenteNombre') || '',
        getField('ponenteEspecialidad') || '',
        getField('ponenteBio') || '',
        getField('ponenteInstitucion') || '',
        imagenPonenteUrl,
        logoInstitucionUrl,
        getField('escenario') || '',
        getField('fecha') || '',
        horaInicio || '10:00:00',
        duracion,
        getField('sesionTipo') || 'Conferencia',
        [getField('publicoObjetivo') || 'General'],
        true
      ]
    );

    await pool.query(
      `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
      ['sesion_creada', 'event_note', 'Sesión creada',
        `${getField('sesionNombre') || 'Sin título'} — ${getField('escenario') || 'Sin escenario'}`,
        usuario.nombre || 'Administrador']
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Sesión creada exitosamente',
      id: result.rows[0].id,
      duracion
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
}