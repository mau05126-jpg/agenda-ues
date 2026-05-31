// src/services/sesionService.js
const API_URL = '/api';

export const crearSesion = async (datosSesion) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/sesiones/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosSesion)
    });
    
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error al crear sesión:', error);
    return { success: false, data: { error: 'Error de conexión' } };
  }
};

export const listarSesiones = async () => {
  try {
    const response = await fetch(`${API_URL}/sesiones/listar`);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error al listar sesiones:', error);
    return { success: false, data: { error: 'Error de conexión' } };
  }
};

export const obtenerSesionesPublicas = async () => {
  try {
    const response = await fetch(`${API_URL}/sesiones/listar`);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    return { success: false, data: { error: 'Error de conexión' } };
  }
};