import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Quitar sslmode de la URL para evitar el warning de pg-connection-string.
// El SSL lo maneja el objeto ssl de abajo.
const getConnectionString = () => {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch {
    return process.env.DATABASE_URL;
  }
};

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a Neon PostgreSQL');
    release();
  }
});

export default pool;