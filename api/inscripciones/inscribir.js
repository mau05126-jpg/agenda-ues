// api/inscripciones/inscribir.js
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const token = req.headers.authorization?.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });

  const { sesion_id } = req.body;
  if (!sesion_id) return res.status(400).json({ error: 'sesion_id requerido' });

  try {
    // Verificar que la sesión existe
    const sesionRes = await pool.query('SELECT id, titulo, escenario FROM sesiones WHERE id = $1 AND activo = true', [sesion_id]);
    if (sesionRes.rows.length === 0) return res.status(404).json({ error: 'Sesión no encontrada' });

    // Insertar inscripción (UNIQUE constraint evita duplicados)
    await pool.query(
      'INSERT INTO inscripciones (usuario_id, sesion_id) VALUES ($1, $2)',
      [usuario.id, sesion_id]
    );

    // Devolver conteo actualizado del escenario
    const conteoRes = await pool.query(`
      SELECT COUNT(DISTINCT i.usuario_id) as inscritos
      FROM inscripciones i
      JOIN sesiones s ON s.id = i.sesion_id
      WHERE s.escenario = $1
    `, [sesionRes.rows[0].escenario]);

    await pool.query(
      `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
      ['inscripcion', 'how_to_reg', 'Inscripción registrada',
        `${usuario.nombre || 'Estudiante'} → ${sesionRes.rows[0].titulo} (${sesionRes.rows[0].escenario})`,
        usuario.nombre || 'Estudiante']
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Inscripción exitosa',
      sesion: sesionRes.rows[0],
      inscritos_escenario: parseInt(conteoRes.rows[0].inscritos),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya estás inscrito en esta sesión' });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
