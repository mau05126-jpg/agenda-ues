// src/pages/Login.jsx
import { useState } from 'react';
import { loginUser, getCurrentUser, isAdmin } from '../services/authService';

const Login = ({ setCurrentPage }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true); // true = registro, false = login
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Datos de registro
  const [registerData, setRegisterData] = useState({
    nombre: '',
    matricula: '',
    carrera: '',
    semestre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Datos de login
  const [loginData, setLoginData] = useState({
    identificador: '',
    password: ''
  });

  // Calcular fortaleza de contraseña
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (!password) return { level: 0, text: 'Muy débil', color: 'bg-red-500' };
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 1) return { level: 1, text: 'Muy débil', color: 'bg-red-500' };
    if (strength === 2) return { level: 2, text: 'Débil', color: 'bg-orange-500' };
    if (strength === 3) return { level: 3, text: 'Media', color: 'bg-yellow-500' };
    return { level: 4, text: 'Segura', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(registerData.password);

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (passwordStrength.level < 3) {
      alert('Por favor usa una contraseña más segura (mínimo 8 caracteres, mayúsculas, números)');
      return;
    }
    
    // Aquí iría la llamada a la API de registro
    console.log('Registro:', registerData);
    alert('¡Cuenta creada exitosamente! Por favor inicia sesión.');
    setIsRegisterMode(false);
    setRegisterData({
      nombre: '', matricula: '', carrera: '', semestre: '', email: '', password: '', confirmPassword: ''
    });
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
      const user = getCurrentUser();
      if (isAdmin()) {
        setCurrentPage('admin');
      } else {
        setCurrentPage('home');
      }
      setLoginData({ identificador: '', password: '' });
    } else {
      setLoginError(result.data.error || 'Credenciales inválidas');
    }
    setLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 transition-colors duration-300">
      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="hidden lg:block space-y-8">
            <div>
              <p className="text-green-700 dark:text-green-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                {isRegisterMode ? 'Registro Académico' : 'Bienvenido de vuelta'}
              </p>
              <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
                {isRegisterMode ? 'Únete a la red del' : 'Accede a tu'}
              </h1>
              <h1 className="text-5xl font-extrabold text-green-700 dark:text-green-400 leading-tight">
                {isRegisterMode ? 'conocimiento.' : 'experiencia.'}
              </h1>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-md">
              Cultura que Inspira, Conocimiento que Transforma. 
              {isRegisterMode 
                ? ' Regístrate para acceder a conferencias, talleres y eventos institucionales.'
                : ' Inicia sesión para acceder a tu agenda personalizada y gestionar tus inscripciones.'}
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

            {/* Image */}
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/hero-bg.png" alt="Edificio UES" className="w-full h-56 object-cover" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 lg:p-10 border border-gray-100 dark:border-gray-700 shadow-sm">
            {isRegisterMode ? (
              // FORMULARIO DE REGISTRO
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Crear cuenta de estudiante</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa tus datos institucionales para comenzar.</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                      <input type="text" name="nombre" value={registerData.nombre} onChange={handleRegisterChange} placeholder="Ej. Juan Pérez" 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Matrícula</label>
                      <input type="text" name="matricula" value={registerData.matricula} onChange={handleRegisterChange} placeholder="Ej. 13220014"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Carrera</label>
                      <div className="relative">
                        <select name="carrera" value={registerData.carrera} onChange={handleRegisterChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required>
                          <option value="">Selecciona una carrera</option>
                          <option>Ingeniería en Sistemas</option>
                          <option>Licenciatura en Administración</option>
                          <option>Arquitectura</option>
                          <option>Psicología</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Semestre</label>
                      <div className="relative">
                        <select name="semestre" value={registerData.semestre} onChange={handleRegisterChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required>
                          <option value="">Selecciona un semestre</option>
                          <option>1er Semestre</option>
                          <option>2do Semestre</option>
                          <option>3er Semestre</option>
                          <option>4to Semestre</option>
                          <option>5to Semestre</option>
                          <option>6to Semestre+</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Correo</label>
                    <input type="email" name="email" value={registerData.email} onChange={handleRegisterChange} placeholder="usuario@ues.edu.mx o usuario@gmail.com"
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required />
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
                      <input type="password" name="password" value={registerData.password} onChange={handleRegisterChange} placeholder="••••••••" 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Confirmar</label>
                      <input type="password" name="confirmPassword" value={registerData.confirmPassword} onChange={handleRegisterChange} placeholder="••••••••" 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" required />
                    </div>
                  </div>

                  {/* Password Strength */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fortaleza</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${passwordStrength.level >= 4 ? 'text-green-600' : passwordStrength.level === 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {registerData.password ? passwordStrength.text : 'Sin definir'}
                      </span>
                    </div>
                    <div className="flex gap-1.5 h-1">
                      <div className={`flex-1 rounded-full ${registerData.password && passwordStrength.level >= 1 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                      <div className={`flex-1 rounded-full ${registerData.password && passwordStrength.level >= 2 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                      <div className={`flex-1 rounded-full ${registerData.password && passwordStrength.level >= 3 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                      <div className={`flex-1 rounded-full ${registerData.password && passwordStrength.level >= 4 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-green-800 hover:bg-green-900 text-white py-3.5 rounded-lg font-bold text-sm transition shadow-lg shadow-green-800/20">
                    Crear cuenta
                  </button>

                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={() => setIsRegisterMode(false)} className="text-green-700 dark:text-green-400 font-bold underline underline-offset-4 hover:text-green-800 transition">
                      Inicia sesión
                    </button>
                  </p>
                </form>
              </>
            ) : (
              // FORMULARIO DE LOGIN
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Iniciar sesión</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa tus credenciales para acceder a tu cuenta.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  {loginError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
                      {loginError}
                    </div>
                  )}

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
                    <button type="button" className="text-[10px] font-bold text-green-700 dark:text-green-400 hover:underline transition">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button type="submit" disabled={loggingIn} className="w-full bg-green-800 hover:bg-green-900 text-white py-3.5 rounded-lg font-bold text-sm transition shadow-lg shadow-green-800/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loggingIn ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Ingresando...
                      </>
                    ) : (
                      'Iniciar sesión'
                    )}
                  </button>

                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    ¿No tienes cuenta?{' '}
                    <button type="button" onClick={() => setIsRegisterMode(true)} className="text-green-700 dark:text-green-400 font-bold underline underline-offset-4 hover:text-green-800 transition">
                      Regístrate
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER SECTION */}
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

export default Login;