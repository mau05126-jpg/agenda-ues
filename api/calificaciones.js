// api/calificaciones.js — Calificaciones de sesiones (1-5 estrellas)
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
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

const crearTabla = () => pool.query(`
  CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    sesion_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sesion_id, usuario_id)
  )
`).catch(() => {});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await crearTabla();

  // GET — promedios de todas las sesiones + calificación propia si hay token
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT sesion_id,
                ROUND(AVG(calificacion)::numeric, 1) AS promedio,
                COUNT(*)::int AS total
         FROM calificaciones GROUP BY sesion_id`
      );
      const calificaciones = {};
      result.rows.forEach(r => {
        calificaciones[r.sesion_id] = { promedio: parseFloat(r.promedio), total: r.total };
      });

      const token = req.headers.authorization?.split(' ')[1];
      const usuario = token ? verificarToken(token) : null;
      if (usuario) {
        const misCal = await pool.query(
          `SELECT sesion_id, calificacion FROM calificaciones WHERE usuario_id = $1`,
          [usuario.id]
        );
        misCal.rows.forEach(r => {
          if (calificaciones[r.sesion_id]) {
            calificaciones[r.sesion_id].miCalificacion = r.calificacion;
          } else {
            calificaciones[r.sesion_id] = { promedio: r.calificacion, total: 1, miCalificacion: r.calificacion };
          }
        });
      }

      return res.status(200).json({ success: true, calificaciones });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST — calificar una sesión
  if (req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const usuario = verificarToken(token);
    if (!usuario) return res.status(401).json({ error: 'No autorizado' });

    const { sesion_id, calificacion } = req.body;
    if (!sesion_id || !calificacion || calificacion < 1 || calificacion > 5)
      return res.status(400).json({ error: 'sesion_id y calificacion (1-5) son requeridos' });

    try {
      await pool.query(
        `INSERT INTO calificaciones (sesion_id, usuario_id, calificacion)
         VALUES ($1, $2, $3)
         ON CONFLICT (sesion_id, usuario_id) DO UPDATE SET calificacion = $3, created_at = NOW()`,
        [sesion_id, usuario.id, calificacion]
      );
      const r = await pool.query(
        `SELECT ROUND(AVG(calificacion)::numeric, 1) AS promedio, COUNT(*)::int AS total
         FROM calificaciones WHERE sesion_id = $1`,
        [sesion_id]
      );
      return res.status(200).json({ success: true, promedio: parseFloat(r.rows[0].promedio), total: r.rows[0].total });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
