// api/sesiones/eliminar.js
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
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID de sesión requerido' });
  }

  try {
    // Primero eliminar inscripciones relacionadas (si la tabla existe)
    try {
      await pool.query('DELETE FROM inscripciones WHERE sesion_id = $1', [id]);
    } catch (err) {
      // Si la tabla no existe, continuar
      console.log('Tabla inscripciones no existe, continuando...');
    }
    
    // Luego eliminar la sesión
    const result = await pool.query(
      'DELETE FROM sesiones WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    await pool.query(
      `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
      ['sesion_eliminada', 'delete', 'Sesión eliminada',
        `ID ${id} eliminada del programa`,
        usuario.nombre || 'Administrador']
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Sesión eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}