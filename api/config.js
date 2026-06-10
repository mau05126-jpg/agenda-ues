import dotenv from 'dotenv';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
});

const verificarToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

const crearTabla = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave VARCHAR(100) PRIMARY KEY,
      valor TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await crearTabla();

  // GET — público, devuelve logos actuales
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

  // PUT — solo admin, guarda o borra una clave
  if (req.method === 'PUT') {
    const token = req.headers.authorization?.split(' ')[1];
    const usuario = verificarToken(token);
    if (!usuario || usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { clave, valor } = req.body;
    if (!clave) return res.status(400).json({ error: 'Falta clave' });

    try {
      if (!valor) {
        await pool.query('DELETE FROM configuracion WHERE clave = $1', [clave]);
      } else {
        await pool.query(
          `INSERT INTO configuracion (clave, valor, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (clave) DO UPDATE SET valor = $2, updated_at = NOW()`,
          [clave, valor]
        );
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Error al guardar' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
