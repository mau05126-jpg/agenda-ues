import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).end();

  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'uid requerido' });

  try {
    // Datos del estudiante
    const usuRes = await pool.query(
      'SELECT nombre, matricula FROM usuarios WHERE id = $1',
      [uid]
    );
    if (usuRes.rows.length === 0)
      return res.status(404).json({ error: 'Estudiante no encontrado' });

    // Sus asistencias confirmadas
    const asistRes = await pool.query(`
      SELECT s.titulo, s.fecha, s.hora, s.escenario, s.ponente, s.categoria
      FROM asistencias a
      JOIN sesiones s ON s.id = a.sesion_id
      WHERE a.usuario_id = $1
      ORDER BY s.fecha, s.hora
    `, [uid]);

    return res.status(200).json({
      success: true,
      estudiante: usuRes.rows[0],
      asistencias: asistRes.rows,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error' });
  }
}
