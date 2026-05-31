import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const verificarToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET → ocupacion
  if (req.method === 'GET') {
    const token = req.headers.authorization?.split(' ')[1];
    const usuario = verificarToken(token);
    if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    try {
      const ocupacion = await pool.query(
        `SELECT e.nombre as escenario, COUNT(DISTINCT i.usuario_id) as inscritos
         FROM escenarios e
         LEFT JOIN sesiones s ON s.escenario = e.nombre
         LEFT JOIN inscripciones i ON i.sesion_id = s.id
         WHERE e.activo = true GROUP BY e.nombre ORDER BY e.nombre`
      );
      const escenarios = await pool.query('SELECT nombre, capacidad, ubicacion FROM escenarios WHERE activo = true');
      return res.status(200).json({ success: true, ocupacion: ocupacion.rows, escenarios: escenarios.rows });
    } catch {
      try {
        const escenarios = await pool.query('SELECT nombre, capacidad, ubicacion FROM escenarios WHERE activo = true');
        return res.status(200).json({ success: true, ocupacion: [], escenarios: escenarios.rows });
      } catch (error) {
        return res.status(500).json({ error: 'Error interno' });
      }
    }
  }

  // POST → crear
  if (req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    const usuario = verificarToken(token);
    if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    const { nombre, ubicacion, descripcion, capacidad } = req.body;
    if (!nombre || !capacidad) return res.status(400).json({ error: 'Nombre y capacidad son obligatorios' });

    try {
      const result = await pool.query(
        `INSERT INTO escenarios (nombre, ubicacion, descripcion, capacidad, activo)
         VALUES ($1,$2,$3,$4,true) RETURNING id, nombre, ubicacion, capacidad`,
        [nombre.trim(), ubicacion?.trim() || '', descripcion?.trim() || '', parseInt(capacidad)]
      );
      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['escenario_creado', 'meeting_room', 'Escenario creado', `${nombre.trim()} — Capacidad: ${capacidad}`, usuario.nombre || 'Administrador']
      ).catch(() => {});
      return res.status(201).json({ success: true, message: 'Escenario creado exitosamente', escenario: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno: ' + error.message });
    }
  }

  // DELETE → eliminar
  if (req.method === 'DELETE') {
    const token = req.headers.authorization?.split(' ')[1];
    const usuario = verificarToken(token);
    if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre del escenario requerido' });

    try {
      await pool.query('DELETE FROM escenarios WHERE nombre = $1', [nombre]);
      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['escenario_eliminado', 'meeting_room', 'Escenario eliminado', nombre, usuario.nombre || 'Administrador']
      ).catch(() => {});
      return res.status(200).json({ success: true, message: 'Escenario eliminado' });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
