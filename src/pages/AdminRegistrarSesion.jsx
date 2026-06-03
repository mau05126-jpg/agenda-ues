// src/pages/AdminRegistrarSesion.jsx
import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';
import AdminToast, { useToast } from '../components/AdminToast';

const AdminRegistrarSesion = ({ setCurrentPage }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('agendaDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('02');
  const [selectedAudience, setSelectedAudience] = useState('Público general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [sesionesExistentes, setSesionesExistentes] = useState([]);
  
  // Estados para las imágenes
  const [imagenPonente, setImagenPonente] = useState(null);
  const [imagenPonentePreview, setImagenPonentePreview] = useState(null);
  const [logoInstitucion, setLogoInstitucion] = useState(null);
  const [logoInstitucionPreview, setLogoInstitucionPreview] = useState(null);
  
  // Datos del formulario - Formato original con horaInicio y horaFin
  const [formData, setFormData] = useState({
    ponenteNombre: '',
    ponenteEspecialidad: '',
    ponenteBio: '',
    ponenteInstitucion: '',
    noInstitucion: false,
    sesionNombre: '',
    sesionTipo: 'Conferencia',
    sesionDescripcion: '',
    horaInicio: '10:00',
    horaFin: '11:30',
    escenario: 'Aula Magna'
  });

  const user = getCurrentUser();
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    localStorage.setItem('agendaDarkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  useEffect(() => {
    if (!user || user.rol !== 'admin') {
      setCurrentPage('loginPage');
    }
  }, []);

  // Cargar sesiones existentes para detectar conflictos
  useEffect(() => {
    const cargarSesionesExistentes = async () => {
      try {
        const response = await fetch('/api/sesiones/listar');
        const data = await response.json();
        if (data.success && data.sesiones) {
          setSesionesExistentes(data.sesiones);
        }
      } catch (error) {
        console.error('Error cargando sesiones existentes:', error);
      }
    };
    cargarSesionesExistentes();
  }, []);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);
  
  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImagenPonenteChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenPonente(file);
      setImagenPonentePreview(URL.createObjectURL(file));
    }
  };

  const handleLogoInstitucionChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoInstitucion(file);
      setLogoInstitucionPreview(URL.createObjectURL(file));
    }
  };

  // Función para convertir hora "HH:MM" a minutos
  const horaAMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  // Función para convertir minutos a hora "HH:MM"
  const minutosAHora = (minutos) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Función para formatear hora en formato legible (10:00 a.m.)
  const formatearHora = (horaStr) => {
    if (!horaStr) return '??';
    const [h, m] = horaStr.split(':').map(Number);
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Calcular duración en minutos desde horaInicio y horaFin
  const calcularDuracion = (horaInicio, horaFin) => {
    const inicio = horaAMinutos(horaInicio);
    const fin = horaAMinutos(horaFin);
    return fin - inicio;
  };

  // Detectar conflicto de programación
  const conflicto = useMemo(() => {
    if (!sesionesExistentes.length) return null;

    const fechaSeleccionada = `2025-12-${selectedDate}`;
    const inicioNuevo = horaAMinutos(formData.horaInicio);
    const finNuevo = horaAMinutos(formData.horaFin);
    const escenarioSeleccionado = formData.escenario;

    for (const sesion of sesionesExistentes) {
      const fechaSesion = sesion.fechaOriginal || sesion.fecha;
      if (!fechaSesion) continue;

      const fechaSesionStr = new Date(fechaSesion).toISOString().split('T')[0];
      if (fechaSesionStr !== fechaSeleccionada) continue;

      if (sesion.escenario !== escenarioSeleccionado) continue;

      // La sesión existente tiene hora (inicio) y duracion (de la BD)
      const inicioExistente = horaAMinutos(sesion.hora?.substring(0, 5) || '00:00');
      const duracionExistente = sesion.duracion || 90;
      const finExistente = inicioExistente + duracionExistente;

      // Verificar solapamiento
      const haySolapamiento = inicioNuevo < finExistente && finNuevo > inicioExistente;

      if (haySolapamiento) {
        return {
          escenario: sesion.escenario,
          horaInicio: sesion.hora?.substring(0, 5) || '??',
          horaFin: minutosAHora(finExistente),
          duracion: duracionExistente,
          fecha: fechaSesionStr
        };
      }
    }

    return null;
  }, [sesionesExistentes, selectedDate, formData.horaInicio, formData.horaFin, formData.escenario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (conflicto) {
      showToast('Hay un conflicto de horario. Por favor cambia la fecha, hora o escenario.', 'error');
      return;
    }

    setIsSubmitting(true);

    if (!formData.ponenteNombre.trim()) {
      showToast('Por favor ingresa el nombre del ponente', 'error');
      setIsSubmitting(false);
      return;
    }

    if (!formData.sesionNombre.trim()) {
      showToast('Por favor ingresa el nombre de la sesión', 'error');
      setIsSubmitting(false);
      return;
    }
    
    // Calcular duración en minutos para enviar al backend
    const duracionMinutos = calcularDuracion(formData.horaInicio, formData.horaFin);
    
    const formDataToSend = new FormData();
    
    formDataToSend.append('ponenteNombre', formData.ponenteNombre);
    formDataToSend.append('ponenteEspecialidad', formData.ponenteEspecialidad);
    formDataToSend.append('ponenteBio', formData.ponenteBio);
    formDataToSend.append('ponenteInstitucion', formData.noInstitucion ? '' : formData.ponenteInstitucion);
    formDataToSend.append('sesionNombre', formData.sesionNombre);
    formDataToSend.append('sesionTipo', formData.sesionTipo);
    formDataToSend.append('sesionDescripcion', formData.sesionDescripcion);
    formDataToSend.append('fecha', `2025-12-${selectedDate}`);
    formDataToSend.append('hora', formData.horaInicio);
    formDataToSend.append('horaFin', formData.horaFin);
    formDataToSend.append('duracion', duracionMinutos.toString());
    formDataToSend.append('escenario', formData.escenario);
    formDataToSend.append('publicoObjetivo', selectedAudience);
    
    if (imagenPonente) {
      formDataToSend.append('imagenPonente', imagenPonente);
    }
    if (logoInstitucion) {
      formDataToSend.append('logoInstitucion', logoInstitucion);
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sesiones/crear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showToast('¡Sesión registrada exitosamente!');
        setCurrentPage('adminSesiones');
      } else {
        showToast(result.error || 'Error al registrar la sesión', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error de conexión. Intenta nuevamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const audienceOptions = ['Sistemas', 'Innovación Agrícola', 'Contaduría', 'Público general', 'Comunidad UES'];
  const dateOptions = ['01', '02', '03', '04', '05'];
  const tipoSesionOptions = ['Conferencia', 'Taller Práctico', 'Inauguración'];
  const escenarioOptions = ['Aula Magna', 'Laboratorio de Cómputo', 'Plazoleta Institucional'];

  if (!user || user.rol !== 'admin') {
    setCurrentPage('loginPage');
    return null;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f5f5f5] dark:bg-[#0f172a]">
      {/* Sidebar */}
      {/* Overlay móvil para sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        h-screen w-[260px] fixed left-0 top-0 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-[#1B5E20] dark:bg-[#0d2818]
      `}>
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">school</span>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-[15px] tracking-wide uppercase">AGENDA UES</h1>
              <p className="text-white/60 text-[10px] font-medium tracking-wider">Portal Administrativo</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <button onClick={() => { setCurrentPage('admin'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Panel de Administración</span>
          </button>
          <button onClick={() => { setCurrentPage('adminSesiones'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Sesiones</span>
          </button>
          <button className="nav-item flex items-center gap-3 py-3 px-4 bg-white/10 dark:bg-white/5 text-white font-semibold rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Registrar Sesión</span>
          </button>
          <button onClick={() => { setCurrentPage('adminEscenarios'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">meeting_room</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Escenarios</span>
          </button>
          <button onClick={() => { setCurrentPage('adminUsuarios'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">group</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Usuarios</span>
          </button>
          <button onClick={() => { setCurrentPage('adminReportes'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Reportes</span>
          </button>
        </nav>

        <div className="px-4 pb-8">
          <div className="border-t border-white/10 dark:border-white/5 pt-4">
            <button onClick={handleLogoutClick} className="w-full nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg text-left">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-sm tracking-wide whitespace-nowrap">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="mainContent" className={`lg:ml-[260px] min-h-screen pb-20 transition-all duration-300 ${showLogoutModal ? 'filter blur-sm pointer-events-none' : ''}`}>
        <header className={`w-full h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-b border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            {/* Botón hamburguesa móvil */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg lg:text-xl font-extrabold tracking-tight text-[#1B5E20] dark:text-[#81C784]">Registrar Sesión</h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Botón modo oscuro */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              <span className="material-symbols-outlined text-lg">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user?.nombre}</p>
                <p className={`text-[10px] uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Administrador</p>
              </div>
              <div className="w-9 h-9 bg-[#1B5E20] dark:bg-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold">
                {user?.nombre?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-5xl">
          <div className="mb-6 lg:mb-8">
            <nav className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-400 mb-2">
              <button onClick={() => setCurrentPage('adminSesiones')} className="hover:text-[#2E7D32] cursor-pointer transition-colors">Gestión</button>
              <span>/</span>
              <button onClick={() => setCurrentPage('adminSesiones')} className="hover:text-[#2E7D32] cursor-pointer transition-colors">Sesiones</button>
              <span>/</span>
              <span className="text-[#2E7D32] font-semibold">Registro</span>
            </nav>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-[#1a1c1c] dark:text-gray-100 tracking-tight">Registrar Sesión</h2>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Inscribe una nueva conferencia académica al programa 2025. Sube foto del ponente y logo de la institución.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* SECTION 1: Datos del Ponente */}
            <div className={`rounded-2xl p-6 lg:p-8 shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[#2E7D32]">person</span>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>1. Datos del Ponente</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3 flex flex-col items-center">
                  <label className="cursor-pointer">
                    <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${darkMode ? 'border-gray-600 bg-gray-800 hover:border-[#66BB6A]' : 'border-gray-300 bg-gray-50 hover:border-[#2E7D32]'}`}>
                      {imagenPonentePreview ? (
                        <img src={imagenPonentePreview} alt="Ponente" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <span className={`material-symbols-outlined text-3xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>add_a_photo</span>
                          <span className={`text-[10px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Subir foto</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImagenPonenteChange} />
                  </label>
                  <p className={`text-[10px] text-center mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Foto del ponente (JPG, PNG)</p>
                </div>

                <div className="md:col-span-9 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nombre Completo*</label>
                      <input type="text" name="ponenteNombre" value={formData.ponenteNombre} onChange={handleChange} placeholder="Dr. Juan Pérez" className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`}/>
                    </div>
                    <div>
                      <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Perfil / Especialidad*</label>
                      <input type="text" name="ponenteEspecialidad" value={formData.ponenteEspecialidad} onChange={handleChange} placeholder="Investigador en IA" className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`}/>
                    </div>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CV / Biografía Corta</label>
                    <textarea name="ponenteBio" value={formData.ponenteBio} onChange={handleChange} rows="3" placeholder="Breve reseña de la trayectoria académica..." className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] resize-none transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`}></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Institución</label>
                      <input type="text" name="ponenteInstitucion" value={formData.ponenteInstitucion} onChange={handleChange} placeholder="Universidad" className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`}/>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" name="noInstitucion" checked={formData.noInstitucion} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-[#2E7D32]"/>
                        <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No representa institución</label>
                      </div>
                    </div>
                    <div>
                      <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Logo Institución</label>
                      <label className={`upload-area w-full border border-dashed rounded-xl px-4 py-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${darkMode ? 'border-gray-600 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                        <span className={`material-symbols-outlined text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>upload</span>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{logoInstitucion ? logoInstitucion.name : 'Cargar Logo'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoInstitucionChange} />
                      </label>
                      {logoInstitucionPreview && (
                        <div className="mt-2 flex justify-center">
                          <img src={logoInstitucionPreview} alt="Logo" className="h-10 w-10 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Datos de la Conferencia */}
            <div className={`rounded-2xl p-6 lg:p-8 shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[#2E7D32]">school</span>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>2. Datos de la Conferencia</h3>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nombre de la Sesión*</label>
                    <input type="text" name="sesionNombre" value={formData.sesionNombre} onChange={handleChange} placeholder="Ej: Futuro de la Agricultura Digital" className={`w-full border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`}/>
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tipo de Sesión*</label>
                    <select name="sesionTipo" value={formData.sesionTipo} onChange={handleChange} className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'}`}>
                      {tipoSesionOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Descripción Breve</label>
                  <textarea name="sesionDescripcion" value={formData.sesionDescripcion} onChange={handleChange} rows="3" placeholder="Resumen para el catálogo..." className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] resize-none transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`}></textarea>
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider block mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Público Objetivo</label>
                  <div className="flex flex-wrap gap-3">
                    {audienceOptions.map(aud => (
                      <button key={aud} type="button" onClick={() => setSelectedAudience(aud)} className={`px-5 py-2.5 rounded-xl border text-xs transition-all ${selectedAudience === aud ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32] font-semibold' : darkMode ? 'border-gray-600 text-gray-400 bg-[#1e293b] hover:border-[#66BB6A] hover:text-[#66BB6A]' : 'border-gray-200 text-gray-600 bg-white hover:border-[#2E7D32] hover:text-[#2E7D32]'}`}>
                        {aud}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Fecha, Hora y Escenario */}
            <div className={`rounded-2xl p-6 lg:p-8 shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[#2E7D32]">location_on</span>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>3. Fecha, Hora y Escenario</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider block mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha del Evento</label>
                  <div className="flex gap-2">
                    {dateOptions.map(date => (
                      <button key={date} type="button" onClick={() => setSelectedDate(date)} className={`flex-1 aspect-square flex flex-col items-center justify-center rounded-lg border transition-all ${selectedDate === date ? 'bg-[#2E7D32] border-[#2E7D32] text-white' : darkMode ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-[#66BB6A]' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#2E7D32]'}`}>
                        <span className="text-[9px] uppercase">Dic</span>
                        <span className="text-sm font-bold">{date}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario: Inicio y Fin lado a lado (formato original) */}
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider block mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Horario</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={`text-[10px] uppercase block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Inicio</span>
                      <input 
                        type="time" 
                        name="horaInicio" 
                        value={formData.horaInicio} 
                        onChange={handleChange} 
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm text-center outline-none focus:ring-1 focus:ring-[#2E7D32] transition-colors ${conflicto ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500' : darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 focus:border-[#2E7D32]'}`}
                      />
                    </div>
                    <div>
                      <span className={`text-[10px] uppercase block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fin</span>
                      <input 
                        type="time" 
                        name="horaFin" 
                        value={formData.horaFin} 
                        onChange={handleChange} 
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm text-center outline-none focus:ring-1 focus:ring-[#2E7D32] transition-colors ${conflicto ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500' : darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 focus:border-[#2E7D32]'}`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider block mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Escenario</label>
                  <select 
                    name="escenario" 
                    value={formData.escenario} 
                    onChange={handleChange} 
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#2E7D32] transition-colors ${conflicto ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400' : darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 focus:border-[#2E7D32]'}`}
                  >
                    {escenarioOptions.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Alerta de conflicto de programación */}
              {conflicto && (
                <div className={`mt-6 border rounded-xl p-4 flex items-start gap-3 ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                    <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Conflicto de programación detectado</h4>
                    <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                      El <strong>{conflicto.escenario}</strong> ya tiene una sesión programada el 
                      <strong> {new Date(conflicto.fecha + 'T12:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'long' })}</strong> de
                      <strong> {formatearHora(conflicto.horaInicio)}</strong> a <strong>{formatearHora(conflicto.horaFin)}</strong>.
                    </p>
                    <p className={`text-xs mt-2 font-medium ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                      Por favor selecciona otro horario o escenario.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 lg:pt-8">
              <button 
                onClick={() => setCurrentPage('adminSesiones')} 
                className={`px-6 py-3 rounded-xl border font-semibold text-sm transition-all active:scale-95 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !!conflicto} 
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${
                  conflicto 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none dark:bg-gray-700 dark:text-gray-500' 
                    : 'bg-[#1B5E20] dark:bg-[#2E7D32] text-white hover:bg-[#2E7D32] dark:hover:bg-[#43A047] shadow-green-900/20'
                }`}
              >
                {isSubmitting ? 'Guardando...' : conflicto ? 'Horario no disponible' : 'Guardar Sesión'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal de Cierre de Sesión */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={handleCancelLogout}>
          <div className={`rounded-2xl max-w-[420px] mx-4 overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-6 lg:p-10 text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span>
              </div>
              <h3 className={`text-xl font-extrabold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Cerrar sesión?</h3>
              <p className={`text-sm mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estás a punto de salir del Panel de Administración. ¿Deseas continuar?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCancelLogout} className={`py-3 rounded-lg font-semibold transition-colors ${darkMode ? 'text-[#66BB6A] bg-gray-700 hover:bg-gray-600' : 'text-[#2E7D32] bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button onClick={handleConfirmLogout} className="py-3 rounded-lg font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C]">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminToast toasts={toasts} removeToast={removeToast} darkMode={darkMode} />
      <style>{`
        @keyframes modal-pop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-modal-pop { animation: modal-pop 0.3s ease-out; }
        .nav-item { transition: all 0.2s ease; }
        .nav-item:hover { background-color: rgba(255,255,255,0.08); }
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #1e293b; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
};

export default AdminRegistrarSesion;