// src/pages/LoginPage.jsx
import { useState, useEffect, useRef } from 'react';
import { loginUser, getCurrentUser } from '../services/authService';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import Navbar from '../components/Navbar'; // ✅ Importar Navbar

const LoginPage = ({ setCurrentPage }) => {
  const [loginData, setLoginData] = useState({ identificador: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const savedIdentificador = localStorage.getItem('saved_identificador');
    if (savedIdentificador) {
      setLoginData(prev => ({ ...prev, identificador: savedIdentificador }));
    }
  }, []);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginData.identificador || !loginData.password) {
      setLoginError('Por favor ingresa tu identificación y contraseña');
      return;
    }
    
    setLoggingIn(true);
    const result = await loginUser(loginData.identificador, loginData.password);
    
    if (result.success) {
      localStorage.setItem('saved_identificador', loginData.identificador);
      const user = getCurrentUser();
      
      if (user.rol === 'admin') {
        localStorage.removeItem('admin_dashboard_stats');
        localStorage.removeItem('admin_sesiones_cache');
        localStorage.removeItem('admin_usuarios_cache');
        setCurrentPage('admin');
      } else if (user.rol === 'estudiante') {
        setCurrentPage('miAgenda');
      } else {
        setCurrentPage('home');
      }
    } else {
      setLoginError(result.data.error || 'Credenciales inválidas');
    }
    setLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 transition-colors duration-300">
      <Navbar 
        toggleTheme={toggleTheme} 
        theme={theme} 
        currentPage="loginPage" 
        setCurrentPage={setCurrentPage} 
      />

      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT: Branding */}
          <div className="hidden lg:block space-y-8">
            <div>
              <p className="text-green-700 dark:text-green-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">Bienvenido de vuelta</p>
              <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">Accede a tu</h1>
              <h1 className="text-5xl font-extrabold text-green-700 dark:text-green-400 leading-tight">experiencia.</h1>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-md">
              Cultura que Inspira, Conocimiento que Transforma. Inicia sesión para acceder a tu agenda personalizada y gestionar tus inscripciones.
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm max-w-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">calendar_today</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Agenda Personal</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">Organiza tus asistencias de forma inteligente.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/hero-bg.png" alt="Edificio UES" className="w-full h-56 object-cover" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 lg:p-10 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Iniciar sesión</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa tus credenciales para acceder a tu cuenta.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {loginError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">{loginError}</div>}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email o Matrícula</label>
                <input type="text" name="identificador" value={loginData.identificador || ''} onChange={handleLoginChange} placeholder="usuario@ues.edu.mx, usuario@gmail.com o 13220014"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
                <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} placeholder="••••••••" 
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required />
              </div>

              <div className="text-right">
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-bold text-green-700 dark:text-green-400 hover:underline transition"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" disabled={loggingIn} className="w-full bg-green-800 hover:bg-green-900 text-white py-3.5 rounded-lg font-bold text-sm transition shadow-lg shadow-green-800/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loggingIn ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Ingresando...</> : 'Iniciar sesión'}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={() => setCurrentPage('register')} className="text-green-700 dark:text-green-400 font-bold underline underline-offset-4 hover:text-green-800 transition">
                  Regístrate
                </button>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Modal y Footer */}
      <ForgotPasswordModal 
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

      <div className="text-center py-10 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap justify-center gap-8 lg:gap-12 mb-6">
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">COMECyT</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">TESVB</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">UAQ</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">UIEM</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">TECNM</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">CCPVT</span>
        </div>
        <p className="text-green-700 dark:text-green-400 italic text-base">"Cultura que Inspira, Conocimiento que Transforma"</p>
      </div>
    </div>
  );
};

export default LoginPage;