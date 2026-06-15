// src/pages/RegisterPage.jsx - Registro de estudiantes con Navbar
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar'; // ✅ Importar Navbar

const RegisterPage = ({ setCurrentPage }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

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

  const [formData, setFormData] = useState({
    nombre: '',
    matricula: '',
    carrera: '',
    semestre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordStrength.level < 3) {
      setError('Por favor usa una contraseña más segura (mínimo 8 caracteres, mayúsculas, números)');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          matricula: formData.matricula,
          carrera: formData.carrera,
          semestre: formData.semestre,
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const carreraOptions = ['Ingeniería en Sistemas Computacionales', 'Licenciatura en Contaduría', 'Ingeniería en Innovación Agricola Sustentable'];
  const semestreOptions = ['1er Semestre', '2do Semestre', '3er Semestre', '4to Semestre', '5to Semestre', '6to Semestre', '7mo Semestre', '8vo Semestre', '9no Semestre'];

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 transition-colors duration-300">
      <Navbar 
        toggleTheme={toggleTheme} 
        theme={theme} 
        currentPage="register" 
        setCurrentPage={setCurrentPage} 
      />

      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="hidden lg:block space-y-8">
            <div>
              <p className="text-green-700 dark:text-green-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">Registro Académico</p>
              <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">Únete a la red del</h1>
              <h1 className="text-5xl font-extrabold text-green-700 dark:text-green-400 leading-tight">conocimiento.</h1>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-md">
              Cultura que Inspira, Conocimiento que Transforma. Regístrate para acceder a conferencias, talleres y eventos institucionales.
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
            {success ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-green-700 dark:text-green-400 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div className="w-full h-1 bg-green-700 dark:bg-green-500 rounded-full mb-6 max-w-[80px]"></div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">¡Cuenta creada!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Tu cuenta de estudiante ha sido registrada exitosamente.</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Ya puedes iniciar sesión con tus credenciales.</p>
                <button
                  onClick={() => setCurrentPage('loginPage')}
                  className="w-full bg-green-800 hover:bg-green-900 text-white py-3.5 rounded-lg font-bold text-sm transition shadow-lg shadow-green-800/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  Ir a Iniciar Sesión
                </button>
              </div>
            ) : (
            <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Crear cuenta de estudiante</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa tus datos institucionales para comenzar.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Juan Pérez" required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Matrícula</label>
                  <input type="text" name="matricula" value={formData.matricula} onChange={handleChange} placeholder="Ej. 13220014" required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Carrera</label>
                  <div className="relative">
                    <select name="carrera" value={formData.carrera} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30 transition">
                      <option value="">Selecciona una carrera</option>
                      {carreraOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Semestre</label>
                  <div className="relative">
                    <select name="semestre" value={formData.semestre} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30 transition">
                      <option value="">Selecciona un semestre</option>
                      {semestreOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Correo</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={window.innerWidth < 640 ? "Email o Gmail" : "usuario@ues.edu.mx o usuario@gmail.com"} required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Confirmar</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fortaleza</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${passwordStrength.level >= 4 ? 'text-green-600' : passwordStrength.level === 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {formData.password ? passwordStrength.text : 'Sin definir'}
                  </span>
                </div>
                <div className="flex gap-1.5 h-1">
                  <div className={`flex-1 rounded-full ${formData.password && passwordStrength.level >= 1 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                  <div className={`flex-1 rounded-full ${formData.password && passwordStrength.level >= 2 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                  <div className={`flex-1 rounded-full ${formData.password && passwordStrength.level >= 3 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                  <div className={`flex-1 rounded-full ${formData.password && passwordStrength.level >= 4 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-green-800 hover:bg-green-900 text-white py-3.5 rounded-lg font-bold text-sm transition shadow-lg shadow-green-800/20 disabled:opacity-50">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => setCurrentPage('loginPage')} className="text-green-700 dark:text-green-400 font-bold underline underline-offset-4 hover:text-green-800 transition">
                  Inicia sesión
                </button>
              </p>
            </form>
            </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="text-center py-10 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap justify-center gap-8 lg:gap-12 mb-6">
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">COMECyT</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">TESVB</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">UAQ</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">UIEM</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">TECNM</span>
          <span className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase">CCPVT</span>
        </div>
        <p className="text-green-700 dark:text-green-400 italic text-base">"Cultura que inspira, conocimiento que transforma"</p>
      </div>
    </div>
  );
};

export default RegisterPage;