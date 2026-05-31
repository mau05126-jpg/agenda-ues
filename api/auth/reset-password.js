// api/auth/reset-password.js
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token, newPassword } = req.body;

  console.log('=== RESET PASSWORD ===');
  console.log('Token recibido:', token);

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Obtener la hora actual en UTC desde PostgreSQL
    const nowResult = await pool.query('SELECT NOW() as now');
    const nowUTC = nowResult.rows[0].now;
    console.log('Hora actual en BD:', nowUTC);
    
    // Buscar token sin importar expiración primero
    const tokenCheck = await pool.query(`
      SELECT user_id, expires_at FROM password_resets WHERE token = $1
    `, [token]);
    
    console.log('Token encontrado:', tokenCheck.rows.length > 0);
    
    if (tokenCheck.rows.length === 0) {
      return res.status(400).json({ error: 'El enlace es inválido.' });
    }
    
    const expiresAt = tokenCheck.rows[0].expires_at;
    console.log('Token expira en:', expiresAt);
    console.log('Hora actual:', nowUTC);
    
    // Comparar fechas correctamente
    if (new Date(expiresAt) < new Date(nowUTC)) {
      console.log('❌ Token EXPIRADO');
      return res.status(400).json({ error: 'El enlace ha expirado.' });
    }
    
    console.log('✅ Token VÁLIDO');
    
    const userId = tokenCheck.rows[0].user_id;
    
    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    // Eliminar token usado
    await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
    
    console.log('✅ Contraseña actualizada para usuario:', userId);
    
    return res.status(200).json({ 
      success: true,
      message: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}