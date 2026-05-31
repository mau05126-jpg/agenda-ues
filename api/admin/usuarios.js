// api/admin/usuarios.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  const usuario = verificarToken(token);

  if (!usuario) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  const esAdmin = usuario.rol === 'admin';
  const esSubadmin = usuario.rol === 'subadmin';

  if (!esAdmin && !esSubadmin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  // GET - Obtener todos los usuarios
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT id, nombre_completo, matricula, email, carrera, semestre, rol, activo, fecha_registro
         FROM usuarios 
         ORDER BY fecha_registro DESC`
      );

      res.status(200).json({
        success: true,
        usuarios: result.rows
      });
    } catch (error) {
      console.error('Error GET usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // POST - Crear nuevo usuario (con password_hash usando bcrypt)
  else if (req.method === 'POST') {
    const { 
      nombre_completo, 
      email, 
      password,
      rol, 
      activo = true,
      matricula,
      carrera,
      semestre
    } = req.body;

    if (!nombre_completo || !email || !password || !rol) {
      return res.status(400).json({ 
        success: false,
        message: 'Faltan campos obligatorios' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Email no válido' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Subadmin solo estudiantes
    if (esSubadmin && rol !== 'estudiante') {
      return res.status(403).json({ 
        success: false,
        message: 'Como subadmin, solo puedes crear estudiantes' 
      });
    }

    if (esAdmin && !['admin', 'subadmin', 'estudiante'].includes(rol)) {
      return res.status(400).json({ 
        success: false,
        message: 'Rol no válido' 
      });
    }

    if (rol === 'estudiante' && (!matricula || !carrera)) {
      return res.status(400).json({ 
        success: false,
        message: 'Matrícula y carrera obligatorias para estudiantes' 
      });
    }

    try {
      const emailExiste = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email.toLowerCase()]
      );

      if (emailExiste.rows.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: 'Email ya registrado' 
        });
      }

      if (rol === 'estudiante' && matricula) {
        const matriculaExiste = await pool.query(
          'SELECT id FROM usuarios WHERE matricula = $1',
          [matricula]
        );
        if (matriculaExiste.rows.length > 0) {
          return res.status(409).json({ 
            success: false,
            message: 'Matrícula ya existe' 
          });
        }
      }

      // Hashear contraseña con bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const result = await pool.query(
        `INSERT INTO usuarios 
         (nombre_completo, email, password_hash, rol, activo, matricula, carrera, semestre, fecha_registro) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
         RETURNING id, nombre_completo, email, rol, activo, fecha_registro`,
        [
          nombre_completo.trim(),
          email.toLowerCase().trim(),
          passwordHash,
          rol,
          activo,
          rol === 'estudiante' ? matricula : null,
          rol === 'estudiante' ? carrera : null,
          rol === 'estudiante' ? (semestre || '1') : null
        ]
      );

      res.status(201).json({
        success: true,
        message: `Usuario ${rol} creado exitosamente`,
        usuario: result.rows[0]
      });

    } catch (error) {
      console.error('Error POST usuario:', error);
      // Errores de restricción de BD
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'Email o matrícula ya registrado' });
      }
      if (error.code === '23502') {
        return res.status(400).json({ success: false, message: `Campo requerido faltante: ${error.column}` });
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // PUT - Actualizar
  else if (req.method === 'PUT') {
    const { id, activo, rol, nombre_completo, email, matricula, carrera, semestre } = req.body;

    if (!id) return res.status(400).json({ error: 'ID requerido' });

    try {
      const usuarioExiste = await pool.query(
        'SELECT rol, nombre_completo FROM usuarios WHERE id = $1', [id]
      );
      if (usuarioExiste.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      const rolObjetivo = usuarioExiste.rows[0].rol;
      if (esSubadmin && (rolObjetivo === 'admin' || rolObjetivo === 'subadmin'))
        return res.status(403).json({ error: 'No puedes modificar admins' });
      if (esSubadmin && rol !== undefined)
        return res.status(403).json({ error: 'No puedes cambiar roles' });

      const updates = [];
      const values = [];

      if (nombre_completo !== undefined) { updates.push(`nombre_completo = $${values.length+1}`); values.push(nombre_completo.trim()); }
      if (email !== undefined) { updates.push(`email = $${values.length+1}`); values.push(email.toLowerCase().trim()); }
      if (matricula !== undefined) { updates.push(`matricula = $${values.length+1}`); values.push(matricula || null); }
      if (carrera !== undefined) { updates.push(`carrera = $${values.length+1}`); values.push(carrera || null); }
      if (semestre !== undefined) { updates.push(`semestre = $${values.length+1}`); values.push(semestre || null); }
      if (activo !== undefined) { updates.push(`activo = $${values.length+1}`); values.push(activo); }
      if (rol !== undefined && esAdmin) { updates.push(`rol = $${values.length+1}`); values.push(rol); }

      if (updates.length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });

      values.push(id);
      await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${values.length}`, values);

      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['usuario_editado', 'manage_accounts', 'Usuario editado',
          `${nombre_completo || usuarioExiste.rows[0].nombre_completo}`,
          usuario.nombre || 'Administrador']
      ).catch(() => {});

      res.status(200).json({ success: true, message: 'Usuario actualizado' });
    } catch (error) {
      console.error('Error PUT:', error);
      if (error.code === '23505') return res.status(409).json({ error: 'Email o matrícula ya en uso' });
      res.status(500).json({ error: 'Error interno' });
    }
  }

  // DELETE
  else if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID requerido' });
    }

    if (esSubadmin) {
      return res.status(403).json({ error: 'Sin permiso para eliminar' });
    }

    try {
      const adminCount = await pool.query(
        "SELECT COUNT(*) as count FROM usuarios WHERE rol = 'admin'"
      );

      const usuarioAEliminar = await pool.query(
        'SELECT rol FROM usuarios WHERE id = $1',
        [id]
      );

      if (usuarioAEliminar.rows.length === 0) {
        return res.status(404).json({ error: 'No encontrado' });
      }

      if (usuarioAEliminar.rows[0].rol === 'admin' && parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(403).json({ error: 'No eliminar último admin' });
      }

      const nombreUsuario = (await pool.query('SELECT nombre_completo FROM usuarios WHERE id = $1', [id])).rows[0]?.nombre_completo || 'Usuario';

      await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['usuario_eliminado', 'person_remove', 'Usuario eliminado',
          `${nombreUsuario} eliminado del sistema`,
          usuario.nombre || 'Administrador']
      ).catch(() => {});

      res.status(200).json({ success: true, message: 'Eliminado' });
    } catch (error) {
      console.error('Error DELETE:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}