// api/admin/actividad.js
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

const colorMap = {
  sesion_creada:       { color: '#2E7D32', bg: '#E8F5E9' },
  sesion_editada:      { color: '#1565C0', bg: '#E3F2FD' },
  sesion_eliminada:    { color: '#C62828', bg: '#FFEBEE' },
  inscripcion:         { color: '#6A1B9A', bg: '#F3E5F5' },
  inscripcion_cancelada: { color: '#E65100', bg: '#FFF3E0' },
  usuario_registrado:  { color: '#00695C', bg: '#E0F2F1' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const token = req.headers.authorization?.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const result = await pool.query(`
      SELECT id, tipo, icono, titulo, detalle, usuario_nombre, created_at
      FROM actividad_log
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const actividades = result.rows.map(row => ({
      tipo: row.tipo,
      icono: row.icono,
      titulo: row.titulo,
      detalle: row.detalle,
      usuario_nombre: row.usuario_nombre,
      fecha: row.created_at,
      color: colorMap[row.tipo]?.color || '#2E7D32',
      bg:    colorMap[row.tipo]?.bg    || '#E8F5E9',
    }));

    res.status(200).json({ success: true, actividades });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
