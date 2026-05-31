// api/auth/register.js
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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

  const { nombre, matricula, carrera, semestre, email, password } = req.body;

  if (!nombre || !matricula || !carrera || !semestre || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const userExists = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 OR matricula = $2',
      [email, matricula]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El correo o matrícula ya están registrados' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre_completo, matricula, carrera, semestre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre_completo, email, rol`,
      [nombre, matricula, carrera, semestre, email, passwordHash, 'estudiante']
    );

    const user = result.rows[0];

    await pool.query(
      `INSERT INTO actividad_log (tipo, icono, titulo, detalle, usuario_nombre) VALUES ($1,$2,$3,$4,$5)`,
      ['usuario_registrado', 'person_add', 'Nuevo usuario registrado',
        `${nombre}${carrera ? ' — ' + carrera : ''}`,
        nombre]
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        nombre: user.nombre_completo,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}