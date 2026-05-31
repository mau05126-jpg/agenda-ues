const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('🔧 Aplicando migración: permitir NULL en matricula, carrera, semestre...');

    await pool.query(`
      ALTER TABLE usuarios
        ALTER COLUMN matricula DROP NOT NULL,
        ALTER COLUMN carrera   DROP NOT NULL,
        ALTER COLUMN semestre  DROP NOT NULL
    `);

    console.log('✅ Migración aplicada correctamente.');
    console.log('   - matricula: ahora permite NULL');
    console.log('   - carrera:   ahora permite NULL');
    console.log('   - semestre:  ahora permite NULL');
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
  } finally {
    pool.end();
  }
}

migrate();
