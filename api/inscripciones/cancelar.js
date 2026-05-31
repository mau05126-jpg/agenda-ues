// api/inscripciones/cancelar.js
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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

  const token = req.headers.authorization?.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });

  const { sesion_id } = req.body;
  if (!sesion_id) return res.status(400).json({ error: 'sesion_id requerido' });

  try {
    const result = await pool.query(
      'DELETE FROM inscripciones WHERE usuario_id = $1 AND sesion_id = $2 RETURNING id',
      [usuario.id, sesion_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No estabas inscrito en esta sesión' });
    }

    await pool.query(
      `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
      ['inscripcion_cancelada', 'person_remove', 'Inscripción cancelada',
        `Sesión ID ${sesion_id} — cancelada por usuario ID ${usuario.id}`,
        usuario.nombre || 'Estudiante']
    ).catch(() => {});

    res.status(200).json({ success: true, message: 'Inscripción cancelada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
