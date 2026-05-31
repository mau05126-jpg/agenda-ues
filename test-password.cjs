const pkg = require('pg');
const bcrypt = require('bcryptjs');
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eCVoTW1PcJF3@ep-curly-sun-anscmqjm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function testPassword() {
  const testEmail = 'admin@agendaues.edu.mx';
  const testPassword = 'Admin2025!';
  
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [testEmail]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Usuario encontrado:', user.email);
    console.log('Hash almacenado:', user.password_hash);
    
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log('\n🔐 Verificando contraseña:', testPassword);
    console.log('¿Contraseña válida?', isValid ? '✅ SÍ' : '❌ NO');
    
    if (!isValid) {
      console.log('\n⚠️  La contraseña no coincide.');
      console.log('Generando un nuevo hash para "Admin2025!"...');
      
      const newHash = await bcrypt.hash('Admin2025!', 10);
      console.log('\n📝 Copia y ejecuta este SQL en Neon:');
      console.log('='.repeat(60));
      console.log(`UPDATE usuarios SET password_hash = '${newHash}' WHERE email = '${testEmail}';`);
      console.log('='.repeat(60));
    } else {
      console.log('\n🎉 La contraseña es correcta! El login debería funcionar.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

testPassword();