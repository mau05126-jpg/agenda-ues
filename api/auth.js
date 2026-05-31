import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { action } = req.query;

  // LOGIN
  if (action === 'login') {
    const { identificador, password } = req.body;
    if (!identificador || !password) return res.status(400).json({ error: 'Identificador y contraseña requeridos' });

    try {
      const result = await pool.query(
        `SELECT id, nombre_completo, matricula, email, password_hash, rol
         FROM usuarios WHERE (email = $1 OR matricula = $1) AND activo = true LIMIT 1`,
        [identificador]
      );
      if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

      const user = result.rows[0];
      if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Credenciales inválidas' });

      const token = jwt.sign(
        { id: user.id, email: user.email, matricula: user.matricula, rol: user.rol, nombre: user.nombre_completo },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({ success: true, token, user: { id: user.id, nombre: user.nombre_completo, email: user.email, matricula: user.matricula, rol: user.rol } });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // REGISTER
  if (action === 'register') {
    const { nombre, matricula, carrera, semestre, email, password } = req.body;
    if (!nombre || !matricula || !carrera || !semestre || !email || !password)
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    try {
      const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1 OR matricula = $2', [email, matricula]);
      if (exists.rows.length > 0) return res.status(400).json({ error: 'El correo o matrícula ya están registrados' });

      const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
      const result = await pool.query(
        `INSERT INTO usuarios (nombre_completo, matricula, carrera, semestre, email, password_hash, rol)
         VALUES ($1,$2,$3,$4,$5,$6,'estudiante') RETURNING id, nombre_completo, email, rol`,
        [nombre, matricula, carrera, semestre, email, passwordHash]
      );
      await pool.query(
        `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
        ['usuario_registrado', 'person_add', 'Nuevo usuario registrado', `${nombre}${carrera ? ' — ' + carrera : ''}`, nombre]
      ).catch(() => {});
      const user = result.rows[0];
      return res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', user: { id: user.id, nombre: user.nombre_completo, email: user.email, rol: user.rol } });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // FORGOT PASSWORD
  if (action === 'forgot-password') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email es requerido' });

    try {
      const userResult = await pool.query('SELECT id, email, nombre_completo FROM usuarios WHERE email = $1', [email]);
      if (userResult.rows.length === 0) return res.status(200).json({ message: 'Si el email existe, recibirás las instrucciones.' });

      const user = userResult.rows[0];
      const resetToken = uuidv4();
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await pool.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
      await pool.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)', [user.id, resetToken, tokenExpiry]);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const params = new URLSearchParams({
        auth_user: process.env.GAS_USER || 'agenda_ues_backend',
        auth_pass: process.env.GAS_PASS || '',
        to: user.email,
        subject: 'Recuperación de contraseña - AgendaUES',
        body: `Hola ${user.nombre_completo},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nEnlace: ${resetLink}\n\nExpira en 1 hora.\n\nSaludos, AgendaUES`
      });

      const response = await fetch(`${process.env.GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
      const result = await response.json();
      if (result.status === 'success') return res.status(200).json({ message: '¡Correo enviado! Revisa tu bandeja.' });
      return res.status(500).json({ error: result.message });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // RESET PASSWORD
  if (action === 'reset-password') {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    try {
      const nowResult = await pool.query('SELECT NOW() as now');
      const nowUTC = nowResult.rows[0].now;
      const tokenCheck = await pool.query('SELECT user_id, expires_at FROM password_resets WHERE token = $1', [token]);
      if (tokenCheck.rows.length === 0) return res.status(400).json({ error: 'El enlace es inválido.' });

      if (new Date(tokenCheck.rows[0].expires_at) < new Date(nowUTC))
        return res.status(400).json({ error: 'El enlace ha expirado.' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashedPassword, tokenCheck.rows[0].user_id]);
      await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
      return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
  }

  return res.status(400).json({ error: 'Acción no válida' });
}
