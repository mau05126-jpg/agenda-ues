// src/services/authService.js
const API_URL = '/api';

export const loginUser = async (identificador, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identificador, password })
    });

    const data = await response.json();
    console.log('Respuesta del servidor:', data);

    if (response.ok && data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('Token guardado:', localStorage.getItem('token'));
      console.log('Usuario guardado:', localStorage.getItem('user'));
    } else {
      console.error('Error en login:', data.error);
    }

    return { success: response.ok, data };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, data: { error: 'Error de conexión' } };
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.rol === 'admin';
};

// NUEVO: Verificar si es admin o subadmin
export const isAdminOrSubadmin = () => {
  const user = getCurrentUser();
  return user && (user.rol === 'admin' || user.rol === 'subadmin');
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('saved_identificador');
};