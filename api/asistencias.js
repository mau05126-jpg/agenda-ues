import jwt from 'jsonwebtoken';
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

let tableCreated = false;
const initTable = async () => {
  if (tableCreated) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS asistencias (
      id         SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL,
      sesion_id  INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (usuario_id, sesion_id)
    )
  `);
  tableCreated = true;
};

const verificarToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initTable();

  const token = req.headers.authorization?.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });

  // ── POST: registrar asistencia ─────────────────────────────────
  if (req.method === 'POST') {
    const { sesion_id } = req.body;
    if (!sesion_id) return res.status(400).json({ error: 'sesion_id requerido' });

    try {
      const sesion = await pool.query(
        'SELECT id, titulo, fecha, hora, escenario, ponente FROM sesiones WHERE id = $1 AND activo = true',
        [sesion_id]
      );
      if (sesion.rows.length === 0)
        return res.status(404).json({ error: 'Sesión no encontrada' });

      await pool.query(
        'INSERT INTO asistencias (usuario_id, sesion_id) VALUES ($1, $2) ON CONFLICT (usuario_id, sesion_id) DO NOTHING',
        [usuario.id, sesion_id]
      );

      // Contar total de asistencias del estudiante
      const totalRes = await pool.query(
        'SELECT COUNT(*) as total FROM asistencias WHERE usuario_id = $1',
        [usuario.id]
      );
      const total = parseInt(totalRes.rows[0].total, 10);

      return res.status(200).json({ success: true, sesion: sesion.rows[0], totalAsistencias: total });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Error registrando asistencia' });
    }
  }

  // ── GET: consultar asistencias ─────────────────────────────────
  if (req.method === 'GET') {
    const { sesion_id, mis } = req.query;

    try {
      // Estudiante ve sus propias asistencias
      if (mis === 'true') {
        const result = await pool.query(`
          SELECT a.id, a.created_at, a.sesion_id,
                 s.titulo, s.fecha, s.hora, s.escenario, s.categoria, s.ponente, s.duracion
          FROM asistencias a
          JOIN sesiones s ON s.id = a.sesion_id
          WHERE a.usuario_id = $1
          ORDER BY s.fecha, s.hora
        `, [usuario.id]);
        return res.status(200).json({ success: true, asistencias: result.rows });
      }

      // Admin ve quién asistió a una sesión específica
      if (sesion_id && usuario.rol === 'admin') {
        const result = await pool.query(`
          SELECT a.id, a.created_at,
                 u.nombre, u.email, u.matricula
          FROM asistencias a
          JOIN usuarios u ON u.id = a.usuario_id
          WHERE a.sesion_id = $1
          ORDER BY a.created_at
        `, [sesion_id]);
        return res.status(200).json({ success: true, asistencias: result.rows });
      }

      // Admin ve resumen de todas las sesiones con conteo de asistentes
      if (usuario.rol === 'admin') {
        const result = await pool.query(`
          SELECT s.id, s.titulo, s.fecha, s.hora, s.escenario, s.categoria,
                 COUNT(a.id)::int AS total_asistentes
          FROM sesiones s
          LEFT JOIN asistencias a ON a.sesion_id = s.id
          WHERE s.activo = true
          GROUP BY s.id
          ORDER BY s.fecha, s.hora
        `);
        return res.status(200).json({ success: true, sesiones: result.rows });
      }

      return res.status(403).json({ error: 'Acceso denegado' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Error consultando asistencias' });
    }
  }
}
