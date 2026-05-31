// src/pages/ResetPasswordPage.jsx
import { useState, useEffect } from 'react';

const ResetPasswordPage = ({ setCurrentPage }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // Obtener token de localStorage
    const savedToken = localStorage.getItem('resetToken');
    
    console.log('🔍 ResetPasswordPage - Token desde localStorage:', savedToken);
    
    if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
      setToken(savedToken);
      console.log('✅ Token cargado correctamente');
      setError(null);
    } else {
      console.log('❌ No se encontró token en localStorage');
      setError('Token no válido. El enlace de recuperación es incorrecto.');
    }
    
    setCheckingToken(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Obtener el token actual
    const currentToken = token || localStorage.getItem('resetToken');
    
    if (!currentToken) {
      setError('Token no encontrado. Solicita un nuevo enlace de recuperación.');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Enviando petición con token:', currentToken);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: currentToken, newPassword }),
      });

      const data = await response.json();
      console.log('📥 Respuesta:', data);

      if (response.ok && data.success) {
        // Limpiar el token solo después de éxito
        localStorage.removeItem('resetToken');
        setSuccess(true);
        setMessage('Contraseña actualizada exitosamente');
        setTimeout(() => {
          setCurrentPage('loginPage');
        }, 3000);
      } else {
        setError(data.error || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-green-700 dark:text-green-400">AgendaUES</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Restablecer contraseña</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">¡Contraseña actualizada!</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    NUEVA CONTRASEÑA
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    CONFIRMAR CONTRASEÑA
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Actualizando...
                    </>
                  ) : (
                    'Restablecer contraseña'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentPage('loginPage')}
                    className="text-sm text-green-600 dark:text-green-400 hover:underline transition"
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;