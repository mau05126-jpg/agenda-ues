// api/auth/forgot-password.js - Versión con GET
import { v4 as uuidv4 } from 'uuid';
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

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, email, nombre_completo FROM usuarios WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(200).json({ 
        message: 'Si el email existe, recibirás las instrucciones.' 
      });
    }

    const user = userResult.rows[0];
    const resetToken = uuidv4();
    // Usar NOW() de PostgreSQL para la expiración
    const tokenExpiry = new Date();
    tokenExpiry.setTime(tokenExpiry.getTime() + (60 * 60 * 1000)); // +1 hora

    console.log('Token creado:', resetToken);
    console.log('Expira en (local):', tokenExpiry.toLocaleString());
    console.log('Expira en (UTC):', tokenExpiry.toISOString());

    // Guardar token
    await pool.query(`DELETE FROM password_resets WHERE user_id = $1`, [user.id]);
    await pool.query(`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [user.id, resetToken, tokenExpiry]);

    // Verificar que se guardó
    const verify = await pool.query('SELECT expires_at FROM password_resets WHERE token = $1', [resetToken]);
    console.log('Token guardado, expira en BD:', verify.rows[0]?.expires_at);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
    
    // Construir URL con parámetros
    const params = new URLSearchParams({
      auth_user: process.env.GAS_USER || 'agenda_ues_backend',
      auth_pass: process.env.GAS_PASS || 'AgendaUES2025RecPass!',
      to: user.email,
      subject: 'Recuperación de contraseña - AgendaUES',
      body: `Hola ${user.nombre_completo},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nEnlace: ${resetLink}\n\nExpira en 1 hora.\n\nSaludos, AgendaUES`
    });
    
    console.log('📧 Enviando a GAS con GET');
    
    const response = await fetch(`${GAS_URL}?${params.toString()}`, {
      method: 'GET'
    });

    const result = await response.json();
    console.log('Respuesta GAS:', result);
    
    if (result.status === 'success') {
      return res.status(200).json({ message: '¡Correo enviado! Revisa tu bandeja.' });
    } else {
      return res.status(500).json({ error: result.message });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}