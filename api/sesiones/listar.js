// api/sesiones/listar.js - VERSIÓN ULTRARRÁPIDA
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
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=59');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { escenario } = req.query;

    let result;
    if (escenario) {
      result = await pool.query(`
        SELECT id, titulo, descripcion, ponente, escenario,
               fecha, hora, duracion, categoria, imagen_ponente
        FROM sesiones
        WHERE activo = true AND escenario = $1
        ORDER BY fecha, hora
        LIMIT 100
      `, [escenario]);
    } else {
      result = await pool.query(`
        SELECT id, titulo, descripcion, ponente, escenario,
               fecha, hora, duracion, categoria, imagen_ponente
        FROM sesiones
        WHERE activo = true
        ORDER BY fecha, hora
        LIMIT 100
      `);
    }

    res.status(200).json({
      success: true,
      sesiones: result.rows
    });
  } catch (error) {
    res.status(200).json({ success: true, sesiones: [] });
  }
}