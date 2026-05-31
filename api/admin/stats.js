// api/admin/stats.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  console.log('=== STATS API LLAMADA ===');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader ? 'Presente' : 'Ausente');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado - Falta token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);
    
    if (decoded.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado - Se requiere admin' });
    }
    
    // Contar estudiantes
    const estudiantesResult = await pool.query(
      "SELECT COUNT(*) as total FROM usuarios WHERE rol = 'estudiante' AND activo = true"
    );
    
    // Contar sesiones
    const sesionesResult = await pool.query(
      "SELECT COUNT(*) as total FROM sesiones WHERE activo = true"
    );
    
    // Contar ponentes únicos
    const ponentesResult = await pool.query(
      "SELECT COUNT(DISTINCT ponente) as total FROM sesiones WHERE ponente IS NOT NULL"
    );
    
    // Contar escenarios únicos
    const escenariosResult = await pool.query(
      "SELECT COUNT(DISTINCT escenario) as total FROM sesiones WHERE escenario IS NOT NULL"
    );

    console.log('Resultados:', {
      estudiantes: estudiantesResult.rows[0].total,
      sesiones: sesionesResult.rows[0].total,
      ponentes: ponentesResult.rows[0].total,
      escenarios: escenariosResult.rows[0].total
    });

    res.status(200).json({
      success: true,
      stats: {
        estudiantes: parseInt(estudiantesResult.rows[0].total),
        sesiones: parseInt(sesionesResult.rows[0].total),
        ponentes: parseInt(ponentesResult.rows[0].total),
        escenarios: parseInt(escenariosResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
}