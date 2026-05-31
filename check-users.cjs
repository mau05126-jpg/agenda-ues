const pkg = require('pg');
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eCVoTW1PcJF3@ep-curly-sun-anscmqjm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    const result = await pool.query(`
      SELECT id, nombre_completo, email, matricula, rol, 
             left(password_hash, 20) as hash_prefix
      FROM usuarios
    `);
    
    console.log('\n📋 USUARIOS EN LA BASE DE DATOS:');
    console.log('='.repeat(80));
    
    if (result.rows.length === 0) {
      console.log('❌ No hay usuarios en la base de datos!');
    } else {
      result.rows.forEach(user => {
        console.log(`\nID: ${user.id}`);
        console.log(`  Nombre: ${user.nombre_completo}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Matrícula: ${user.matricula}`);
        console.log(`  Rol: ${user.rol}`);
        console.log(`  Hash: ${user.hash_prefix}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

checkUsers();