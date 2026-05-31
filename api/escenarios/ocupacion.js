// api/escenarios/ocupacion.js
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
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

  try {
    // Obtener ocupación real por escenario
    const result = await pool.query(`
      SELECT 
        e.nombre as escenario,
        COUNT(DISTINCT i.usuario_id) as inscritos
      FROM escenarios e
      LEFT JOIN sesiones s ON s.escenario = e.nombre
      LEFT JOIN inscripciones i ON i.sesion_id = s.id
      WHERE e.activo = true
      GROUP BY e.nombre
      ORDER BY e.nombre
    `);
    
    // También obtener datos de los escenarios
    const escenariosResult = await pool.query(`
      SELECT nombre, capacidad, ubicacion
      FROM escenarios
      WHERE activo = true
    `);
    
    res.status(200).json({
      success: true,
      ocupacion: result.rows,
      escenarios: escenariosResult.rows
    });
  } catch (error) {
    console.error('Error:', error);
    // Si no hay tabla de inscripciones, devolver datos básicos
    const escenariosResult = await pool.query(`
      SELECT nombre, capacidad, ubicacion
      FROM escenarios
      WHERE activo = true
    `);
    
    res.status(200).json({
      success: true,
      ocupacion: [],
      escenarios: escenariosResult.rows
    });
  }
}