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

  const raw = (req.query.uid || '').trim();

  if (!raw || raw === 'undefined' || raw === 'null') {
    return res.status(200).json({ success: false, error: 'uid_invalido' });
  }

  try {
    let usuario = null;

    // 1) Intentar por ID numérico (valor pequeño = clave primaria de la BD)
    const esIdNumerico = /^\d+$/.test(raw) && Number(raw) < 1_000_000;
    if (esIdNumerico) {
      const r = await pool.query(
        'SELECT id, nombre_completo AS nombre, matricula FROM usuarios WHERE id = $1', [Number(raw)]
      );
      if (r.rows.length > 0) usuario = r.rows[0];
    }

    // 2) Si no encontró, buscar por matrícula
    if (!usuario) {
      const r = await pool.query(
        'SELECT id, nombre_completo AS nombre, matricula FROM usuarios WHERE matricula = $1', [raw]
      );
      if (r.rows.length > 0) usuario = r.rows[0];
    }

    if (!usuario) {
      return res.status(200).json({ success: false, error: 'no_encontrado' });
    }

    // 3) Asistencias — fallo gracioso si la query falla
    let asistencias = [];
    try {
      const ar = await pool.query(`
        SELECT s.titulo, s.fecha, s.hora, s.escenario, s.ponente, s.categoria
        FROM asistencias a
        JOIN sesiones s ON s.id = a.sesion_id
        WHERE a.usuario_id = $1
        ORDER BY s.fecha, s.hora
      `, [usuario.id]);
      asistencias = ar.rows;
    } catch (e) {
      console.error('asistencias query error:', e.message);
    }

    return res.status(200).json({
      success: true,
      estudiante: { nombre: usuario.nombre, matricula: usuario.matricula },
      asistencias,
    });

  } catch (e) {
    console.error('verificar error:', e.message);
    return res.status(200).json({ success: false, error: 'error_interno' });
  }
}
