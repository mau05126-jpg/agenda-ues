import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
  sesion_creada:          { color: '#2E7D32', bg: '#E8F5E9' },
  sesion_editada:         { color: '#1565C0', bg: '#E3F2FD' },
  sesion_eliminada:       { color: '#C62828', bg: '#FFEBEE' },
  inscripcion:            { color: '#6A1B9A', bg: '#F3E5F5' },
  inscripcion_cancelada:  { color: '#E65100', bg: '#FFF3E0' },
  usuario_registrado:     { color: '#00695C', bg: '#E0F2F1' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // CONFIG — GET público (logos), PUT solo admin
  if (action === 'config') {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(100) PRIMARY KEY,
        valor TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `).catch(() => {});

    if (req.method === 'GET') {
      try {
        const result = await pool.query('SELECT clave, valor FROM configuracion');
        const config = {};
        result.rows.forEach(r => { config[r.clave] = r.valor; });
        return res.status(200).json({ success: true, config });
      } catch {
        return res.status(200).json({ success: true, config: {} });
      }
    }

    if (req.method === 'PUT') {
      const token = req.headers.authorization?.split(' ')[1];
      const usuario = verificarToken(token);
      if (!usuario || usuario.rol !== 'admin') return res.status(403).json({ error: 'No autorizado' });

      const { clave, valor } = req.body;
      if (!clave) return res.status(400).json({ error: 'Falta clave' });
      try {
        if (!valor) {
          await pool.query('DELETE FROM configuracion WHERE clave = $1', [clave]);
        } else {
          await pool.query(
            `INSERT INTO configuracion (clave, valor, updated_at) VALUES ($1, $2, NOW())
             ON CONFLICT (clave) DO UPDATE SET valor = $2, updated_at = NOW()`,
            [clave, valor]
          );
        }
        return res.status(200).json({ success: true });
      } catch {
        return res.status(500).json({ error: 'Error al guardar' });
      }
    }
  }

  const token = req.headers.authorization?.split(' ')[1];
  const usuario = verificarToken(token);
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });

  const esAdmin = usuario.rol === 'admin';
  const esSubadmin = usuario.rol === 'subadmin';
  if (!esAdmin && !esSubadmin) return res.status(403).json({ error: 'Acceso denegado' });

  // STATS
  if (action === 'stats') {
    if (!esAdmin) return res.status(403).json({ error: 'Acceso denegado - Se requiere admin' });
    try {
      const [estudiantes, sesiones, ponentes, escenarios] = await Promise.all([
        pool.query("SELECT COUNT(*) as total FROM usuarios WHERE rol='estudiante' AND activo=true"),
        pool.query("SELECT COUNT(*) as total FROM sesiones WHERE activo=true"),
        pool.query("SELECT COUNT(DISTINCT ponente) as total FROM sesiones WHERE ponente IS NOT NULL"),
        pool.query("SELECT COUNT(DISTINCT escenario) as total FROM sesiones WHERE escenario IS NOT NULL"),
      ]);
      return res.status(200).json({
        success: true,
        stats: {
          estudiantes: parseInt(estudiantes.rows[0].total),
          sesiones: parseInt(sesiones.rows[0].total),
          ponentes: parseInt(ponentes.rows[0].total),
          escenarios: parseInt(escenarios.rows[0].total),
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno: ' + error.message });
    }
  }

  // ACTIVIDAD
  if (action === 'actividad') {
    try {
      const result = await pool.query(
        `SELECT id, tipo, icono, titulo, detalle, usuario_nombre, created_at
         FROM actividad_log ORDER BY created_at DESC LIMIT 10`
      );
      const actividades = result.rows.map(row => ({
        tipo: row.tipo, icono: row.icono, titulo: row.titulo, detalle: row.detalle,
        usuario_nombre: row.usuario_nombre, fecha: row.created_at,
        color: colorMap[row.tipo]?.color || '#2E7D32',
        bg: colorMap[row.tipo]?.bg || '#E8F5E9',
      }));
      return res.status(200).json({ success: true, actividades });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // USUARIOS (GET / POST / PUT / DELETE)
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT id, nombre_completo, matricula, email, carrera, semestre, rol, activo, fecha_registro
         FROM usuarios ORDER BY fecha_registro DESC`
      );
      return res.status(200).json({ success: true, usuarios: result.rows });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  if (req.method === 'POST') {
    const { nombre_completo, email, password, rol, activo = true, matricula, carrera, semestre } = req.body;
    if (!nombre_completo || !email || !password || !rol) return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Email no válido' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    if (esSubadmin && rol !== 'estudiante') return res.status(403).json({ success: false, message: 'Como subadmin, solo puedes crear estudiantes' });
    if (esAdmin && !['admin', 'subadmin', 'estudiante'].includes(rol)) return res.status(400).json({ success: false, message: 'Rol no válido' });
    if (rol === 'estudiante' && (!matricula || !carrera)) return res.status(400).json({ success: false, message: 'Matrícula y carrera obligatorias para estudiantes' });

    try {
      const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
      if (emailExiste.rows.length > 0) return res.status(409).json({ success: false, message: 'Email ya registrado' });
      if (rol === 'estudiante' && matricula) {
        const matExiste = await pool.query('SELECT id FROM usuarios WHERE matricula = $1', [matricula]);
        if (matExiste.rows.length > 0) return res.status(409).json({ success: false, message: 'Matrícula ya existe' });
      }
      const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
      const result = await pool.query(
        `INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo, matricula, carrera, semestre, fecha_registro)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING id, nombre_completo, email, rol, activo, fecha_registro`,
        [nombre_completo.trim(), email.toLowerCase().trim(), passwordHash, rol, activo,
         rol === 'estudiante' ? matricula : null, rol === 'estudiante' ? carrera : null, rol === 'estudiante' ? (semestre || '1') : null]
      );
      return res.status(201).json({ success: true, message: `Usuario ${rol} creado exitosamente`, usuario: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ success: false, message: 'Email o matrícula ya registrado' });
      if (error.code === '23502') return res.status(400).json({ success: false, message: `Campo requerido faltante: ${error.column}` });
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  if (req.method === 'PUT') {
    const { id, activo, rol, nombre_completo, email, matricula, carrera, semestre } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    try {
      const u = await pool.query('SELECT rol, nombre_completo FROM usuarios WHERE id = $1', [id]);
      if (u.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (esSubadmin && ['admin', 'subadmin'].includes(u.rows[0].rol)) return res.status(403).json({ error: 'No puedes modificar admins' });
      if (esSubadmin && rol !== undefined) return res.status(403).json({ error: 'No puedes cambiar roles' });

      const updates = [], values = [];
      if (nombre_completo !== undefined) { updates.push(`nombre_completo=$${values.length+1}`); values.push(nombre_completo.trim()); }
      if (email !== undefined) { updates.push(`email=$${values.length+1}`); values.push(email.toLowerCase().trim()); }
      if (matricula !== undefined) { updates.push(`matricula=$${values.length+1}`); values.push(matricula || null); }
      if (carrera !== undefined) { updates.push(`carrera=$${values.length+1}`); values.push(carrera || null); }
      if (semestre !== undefined) { updates.push(`semestre=$${values.length+1}`); values.push(semestre || null); }
      if (activo !== undefined) { updates.push(`activo=$${values.length+1}`); values.push(activo); }
      if (rol !== undefined && esAdmin) { updates.push(`rol=$${values.length+1}`); values.push(rol); }
      if (updates.length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });

      values.push(id);
      await pool.query(`UPDATE usuarios SET ${updates.join(',')} WHERE id=$${values.length}`, values);
      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['usuario_editado', 'manage_accounts', 'Usuario editado', `${nombre_completo || u.rows[0].nombre_completo}`, usuario.nombre || 'Administrador']
      ).catch(() => {});
      return res.status(200).json({ success: true, message: 'Usuario actualizado' });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email o matrícula ya en uso' });
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  if (req.method === 'DELETE') {
    if (esSubadmin) return res.status(403).json({ error: 'Sin permiso para eliminar' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    try {
      const adminCount = await pool.query("SELECT COUNT(*) as count FROM usuarios WHERE rol='admin'");
      const uToDelete = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [id]);
      if (uToDelete.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
      if (uToDelete.rows[0].rol === 'admin' && parseInt(adminCount.rows[0].count) <= 1)
        return res.status(403).json({ error: 'No eliminar último admin' });
      const nombre = (await pool.query('SELECT nombre_completo FROM usuarios WHERE id=$1', [id])).rows[0]?.nombre_completo || 'Usuario';
      await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['usuario_eliminado', 'person_remove', 'Usuario eliminado', `${nombre} eliminado del sistema`, usuario.nombre || 'Administrador']
      ).catch(() => {});
      return res.status(200).json({ success: true, message: 'Eliminado' });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
