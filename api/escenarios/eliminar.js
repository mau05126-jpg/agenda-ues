// api/escenarios/eliminar.js
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
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre del escenario requerido' });

  try {
    await pool.query(
      `DELETE FROM escenarios WHERE nombre = $1`,
      [nombre]
    );

    await pool.query(
      `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre)
       VALUES ($1,$2,$3,$4,$5)`,
      ['escenario_eliminado', 'meeting_room', 'Escenario eliminado',
        nombre, usuario.nombre || 'Administrador']
    ).catch(() => {});

    res.status(200).json({ success: true, message: 'Escenario eliminado' });
  } catch (error) {
    console.error('Error eliminando escenario:', error);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
}
