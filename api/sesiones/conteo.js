// api/sesiones/conteo.js — Conteo de inscritos por sesión
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const result = await pool.query(
      `SELECT sesion_id, COUNT(DISTINCT usuario_id)::int AS total
       FROM inscripciones GROUP BY sesion_id`
    );
    const conteos = {};
    result.rows.forEach(r => { conteos[r.sesion_id] = r.total; });
    return res.status(200).json({ success: true, conteos });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
