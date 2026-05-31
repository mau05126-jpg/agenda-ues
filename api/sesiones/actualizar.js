// api/sesiones/actualizar.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

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

export default async function handler(req, res) {
  console.log('=== API ACTUALIZAR SESION ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use PUT o POST' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  const usuario = verificarToken(token);
  
  if (!usuario || usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { id } = req.query;
  const { titulo, categoria, ponente, fecha, hora, escenario, descripcion } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID de sesión requerido' });
  }

  try {
    const result = await pool.query(
      `UPDATE sesiones 
       SET titulo = $1, categoria = $2, ponente = $3, 
           fecha = $4, hora = $5, escenario = $6, descripcion = $7
       WHERE id = $8
       RETURNING id`,
      [titulo, categoria, ponente, fecha, hora, escenario, descripcion, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    await pool.query(
      `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
      ['sesion_editada', 'edit_note', 'Sesión editada',
        `${titulo || 'Sin título'} — ${escenario || 'Sin escenario'}`,
        usuario.nombre || 'Administrador']
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Sesión actualizada exitosamente',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}