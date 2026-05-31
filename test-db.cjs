const { Pool } = require('pg');
require('dotenv').config();

console.log('🚀 Probando conexión a Neon PostgreSQL...');
console.log('📝 Archivo .env cargado:', process.env.DATABASE_URL ? '✅ Sí' : '❌ No');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as hora, version() as version');
    console.log('✅ ¡Conexión exitosa a Neon!');
    console.log('🕐 Hora del servidor:', result.rows[0].hora);
    console.log('🐘 Versión PostgreSQL:', result.rows[0].version);
    
    // Verificar si las tablas existen
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tablas en la base de datos:');
    tables.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    pool.end();
  }
}

testConnection();