// api/inscripciones/mis-inscripciones.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const verificarToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const token = req.headers.authorization?.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });

  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.titulo,
        s.descripcion,
        s.ponente,
        s.escenario,
        s.fecha,
        s.hora,
        s.duracion,
        s.categoria,
        i.fecha_inscripcion
      FROM inscripciones i
      JOIN sesiones s ON s.id = i.sesion_id
      WHERE i.usuario_id = $1
      ORDER BY s.fecha, s.hora
    `, [usuario.id]);

    res.status(200).json({
      success: true,
      inscripciones: result.rows,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
