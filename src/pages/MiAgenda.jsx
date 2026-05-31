// src/pages/MiAgenda.jsx
import { useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';

const MiAgenda = ({ setCurrentPage }) => {
  const [user, setUser] = useState(null);
  
  const [misSesiones, setMisSesiones] = useState(() => {
    const currentUser = getCurrentUser();
    if (currentUser?.id) {
      const stored = localStorage.getItem(`inscripciones_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false); // ✅ Empezar en false, no true
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // ✅ NUEVO: menú móvil
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  const TOTAL_SESIONES_EVENTO = 10;

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.rol === 'estudiante') {
      setUser(currentUser);
      cargarMisSesionesSilencioso();
    } else {
      setCurrentPage('loginPage');
    }
  }, [setCurrentPage]);

  // Aplicar tema al DOM
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

  const cargarMisSesionesSilencioso = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/inscripciones/mis-inscripciones', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const formateadas = data.inscripciones.map(s => ({
          id: s.id,
          titulo: s.titulo,
          hora: s.hora ? s.hora.substring(0, 5) : 'N/A',
          duracion: s.duracion || 90,
          tipo: s.categoria || 'Conferencia',
          categoria: s.categoria || 'Conferencia',
          participante: s.ponente,
          ponente: s.ponente,
          escenario: s.escenario,
          descripcion: s.descripcion,
          fecha: s.fecha,
        }));

        if (formateadas.length > 0) {
          // La API tiene datos — es la fuente de verdad
          setMisSesiones(formateadas);
          localStorage.setItem(`inscripciones_${currentUser.id}`, JSON.stringify(formateadas));
        } else {
          // La API devuelve vacío — usar localStorage si tiene datos
          // (puede ser que las sesiones se guardaron antes de esta versión)
          const stored = localStorage.getItem(`inscripciones_${currentUser.id}`);
          if (stored) {
            const local = JSON.parse(stored);
            if (local.length > 0) {
              setMisSesiones(local);
              // Sincronizar esas sesiones locales con la BD en segundo plano
              sincronizarLocalConBD(local, token, currentUser.id);
            }
          }
        }
      }
    } catch (_) {
      // Si falla la API, usar localStorage
      const currentUser = getCurrentUser();
      if (currentUser?.id) {
        const stored = localStorage.getItem(`inscripciones_${currentUser.id}`);
        if (stored) setMisSesiones(JSON.parse(stored));
      }
    }
  };

  // Sube al servidor las inscripciones que solo existen en localStorage
  const sincronizarLocalConBD = async (sesionesLocales, token, userId) => {
    for (const s of sesionesLocales) {
      try {
        await fetch('/api/inscripciones/inscribir', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sesion_id: s.id }),
        });
      } catch (_) {}
    }
    // Recargar desde la BD una vez sincronizado
    const res = await fetch('/api/inscripciones/mis-inscripciones', {
      headers: { 'Authorization': `Bearer ${token}` },
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      if (data.success && data.inscripciones.length > 0) {
        const formateadas = data.inscripciones.map(s => ({
          id: s.id, titulo: s.titulo,
          hora: s.hora ? s.hora.substring(0, 5) : 'N/A',
          duracion: s.duracion || 90,
          tipo: s.categoria || 'Conferencia',
          categoria: s.categoria || 'Conferencia',
          participante: s.ponente, ponente: s.ponente,
          escenario: s.escenario,
          descripcion: s.descripcion, fecha: s.fecha,
        }));
        setMisSesiones(formateadas);
        localStorage.setItem(`inscripciones_${userId}`, JSON.stringify(formateadas));
      }
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === `inscripciones_${user?.id}`) {
        cargarMisSesionesSilencioso();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleInscripcionChange = () => {
      if (user?.id) {
        cargarMisSesionesSilencioso();
      }
    };
    
    window.addEventListener('inscripciones-updated', handleInscripcionChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inscripciones-updated', handleInscripcionChange);
    };
  }, [user?.id]);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);
  
  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  const handleQuitarSesion = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sesión de tu agenda?')) return;

    // Actualización optimista
    const nuevasSesiones = misSesiones.filter(s => s.id !== id);
    setMisSesiones(nuevasSesiones);
    if (user?.id) {
      localStorage.setItem(`inscripciones_${user.id}`, JSON.stringify(nuevasSesiones));
    }
    window.dispatchEvent(new Event('inscripciones-updated'));

    // Cancelar también en la BD
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/inscripciones/cancelar', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sesion_id: id }),
        });
      } catch (_) {}
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr || typeof fechaStr !== 'string') {
      return { diaSemana: '', diaNumero: '', mes: '', key: '' };
    }
    
    const partes = fechaStr.split('-');
    if (partes.length !== 3) {
      return { diaSemana: '', diaNumero: '', mes: '', key: '' };
    }
    
    const year = parseInt(partes[0], 10);
    const month = parseInt(partes[1], 10);
    const day = parseInt(partes[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return { diaSemana: '', diaNumero: '', mes: '', key: '' };
    }
    
    const fecha = new Date(year, month - 1, day);
    
    const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const diaSemana = diasSemana[fecha.getDay()];
    const mesNombre = meses[month - 1];
    
    return {
      diaSemana,
      diaNumero: day,
      mes: mesNombre,
      key: `${diaSemana} ${day}`
    };
  };

  const sesionesPorDia = misSesiones.reduce((grupo, sesion) => {
    if (sesion.fecha) {
      const fechaFormateada = formatearFecha(sesion.fecha);
      if (fechaFormateada.key) {
        if (!grupo[fechaFormateada.key]) grupo[fechaFormateada.key] = [];
        grupo[fechaFormateada.key].push({ ...sesion, ...fechaFormateada });
      }
    }
    return grupo;
  }, {});

  const formatHora = (hora) => {
    if (!hora) return 'N/A';
    return hora.substring(0, 5);
  };

  const calcularHoraFin = (horaInicio, duracion) => {
    if (!horaInicio || !duracion) return 'N/A';
    
    const duracionMinutos = parseInt(duracion, 10);
    if (isNaN(duracionMinutos) || duracionMinutos <= 0) return 'N/A';
    
    const [h, m] = horaInicio.substring(0, 5).split(':').map(Number);
    const inicioMinutos = h * 60 + m;
    const finMinutos = inicioMinutos + duracionMinutos;
    
    const hFin = Math.floor(finMinutos / 60);
    const mFin = finMinutos % 60;
    
    return `${hFin.toString().padStart(2, '0')}:${mFin.toString().padStart(2, '0')}`;
  };

  const formatearHoraAMPM = (horaStr) => {
    if (!horaStr || horaStr === 'N/A') return 'N/A';
    const [h, m] = horaStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getCategoriaInfo = (categoria) => {
    const mapa = {
      'Conferencia Magistral': { label: 'KEYNOTE', color: 'bg-[#C8E6C9] text-[#1B5E20] dark:bg-[#1B5E20] dark:text-[#C8E6C9]' },
      'Conferencia': { label: 'KEYNOTE', color: 'bg-[#C8E6C9] text-[#1B5E20] dark:bg-[#1B5E20] dark:text-[#C8E6C9]' },
      'Taller Práctico': { label: 'TALLER', color: 'bg-[#E0E0E0] text-[#424242] dark:bg-gray-700 dark:text-gray-300' },
      'Taller': { label: 'TALLER', color: 'bg-[#E0E0E0] text-[#424242] dark:bg-gray-700 dark:text-gray-300' },
      'Ponencia': { label: 'PONENCIA', color: 'bg-[#BBDEFB] text-[#0D47A1] dark:bg-blue-900 dark:text-blue-300' },
    };
    return mapa[categoria] || { label: (categoria || 'SESIÓN').toUpperCase(), color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  };


  const getIniciales = (nombre) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const porcentajeProgreso = misSesiones.length > 0 
    ? Math.min((misSesiones.length / TOTAL_SESIONES_EVENTO) * 100, 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Navbar - RESPONSIVE */}
      <nav className="fixed top-0 w-full z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-10 h-16 max-w-[1440px] mx-auto">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentPage('home')}
          >
            <span className="text-xl sm:text-2xl font-extrabold tracking-tighter text-green-800 dark:text-green-400">AgendaUES</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          
            <button 
              className="text-green-800 dark:text-green-400 border-b-2 border-green-600 pb-0.5"
            >
              Mi Agenda
            </button>

            <button 
              onClick={() => setCurrentPage('cronogramaEstudiante')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition pb-0.5"
            >
              Cronograma
            </button>

          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Cambiar tema"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg sm:text-xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-xs">
              {getIniciales(user?.nombre)}
            </div>

            <button 
              onClick={handleLogoutClick}
              className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium transition-colors"
            >
              Salir
            </button>

            {/* ✅ BOTÓN MENÚ MÓVIL */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="material-symbols-outlined text-gray-800 dark:text-white text-xl">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* ✅ MENÚ MÓVIL DESPLEGABLE */}
        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-4 shadow-lg">
            <nav className="flex flex-col gap-2">

              <button 
                className="text-left py-2.5 px-3 rounded-lg transition bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold"
              >
                Mi Agenda
              </button>
              <button 
                onClick={() => { setCurrentPage('cronogramaEstudiante'); setMenuOpen(false); }}
                className="text-left py-2.5 px-3 rounded-lg transition text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cronograma
              </button>

              <button 
                onClick={() => { handleLogoutClick(); setMenuOpen(false); }}
                className="mt-2 text-left py-2.5 px-3 rounded-lg transition text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
              >
                Cerrar sesión
              </button>
            </nav>
          </div>
        )}
      </nav>

      <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto min-h-screen">
        {/* Hero Header - RESPONSIVE */}
        <header className="mb-8 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold tracking-wider uppercase text-[10px] sm:text-[11px]">
              <span className="material-symbols-outlined text-sm">star</span>
              Panel del Estudiante
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-white leading-none">
              ⭐ Mi Agenda · <span className="text-green-700 dark:text-green-400 block sm:inline">{user?.nombre || 'Estudiante'}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm sm:text-base leading-relaxed mt-2">
              Gestiona tus participaciones académicas y sigue de cerca las ponencias más relevantes de la semana.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('agendaPdf')}
            className="flex items-center justify-center gap-2 sm:gap-3 bg-green-800 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-lg w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">picture_as_pdf</span>
            <span className="whitespace-nowrap">Descargar mi agenda en PDF</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Agenda Timeline - RESPONSIVE */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-12">
            {Object.keys(sesionesPorDia).length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="material-symbols-outlined text-4xl sm:text-6xl text-gray-300 dark:text-gray-500">event_busy</span>
                <p className="text-gray-500 dark:text-gray-400 mt-4 font-medium text-sm sm:text-base">No tienes sesiones inscritas</p>
                <button 
                  onClick={() => setCurrentPage('cronogramaEstudiante')}
                  className="mt-4 sm:mt-6 bg-green-800 hover:bg-green-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all"
                >
                  Explorar cronograma
                </button>
              </div>
            ) : (
              Object.entries(sesionesPorDia).map(([dia, sesiones]) => (
                <section key={dia}>
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gray-200 dark:bg-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-green-800 dark:text-green-400 text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">
                      {dia}
                    </div>
                    <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {sesiones.map((sesion) => {
                      const horaInicio = formatHora(sesion.hora);
                      const horaFin = calcularHoraFin(sesion.hora, sesion.duracion);
                      const categoriaInfo = getCategoriaInfo(sesion.categoria);
                      
                      return (
                        <div key={sesion.id} className="group bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border-l-4 border-green-600 shadow-sm hover:shadow-md transition-all">
                          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                            <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <span className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-md tracking-widest uppercase ${categoriaInfo.color}`}>
                                  {categoriaInfo.label}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">schedule</span>
                                  {formatearHoraAMPM(horaInicio)} — {formatearHoraAMPM(horaFin)}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                                {sesion.titulo}
                              </h3>
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                {sesion.imagenPonente ? (
                                  <img 
                                    src={sesion.imagenPonente} 
                                    alt={sesion.ponente}
                                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {sesion.ponente?.charAt(0) || 'P'}
                                  </div>
                                )}
                                <span className="text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm truncate">{sesion.ponente}</span>
                                <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">• {sesion.escenario}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleQuitarSesion(sesion.id)}
                              className="self-start sm:self-center flex items-center gap-1.5 sm:gap-2 text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                            >
                              <span className="material-symbols-outlined text-base sm:text-lg">delete</span>
                              <span className="hidden sm:inline">Quitar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>

          {/* Sidebar - RESPONSIVE */}
          <aside className="lg:col-span-4 space-y-4 sm:space-y-6">
            <section className="bg-green-800 dark:bg-green-900 text-white rounded-xl sm:rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-base sm:text-xl mb-2">Progreso de Agenda</h3>
                <p className="text-green-200 text-xs sm:text-sm mb-4 sm:mb-6">
                  Has completado el {Math.round(porcentajeProgreso)}% de tu registro para sesiones presenciales.
                </p>
                <div className="w-full bg-green-900/30 rounded-full h-2 mb-4">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeProgreso}%` }}
                  ></div>
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-300">
                  {misSesiones.length} DE {TOTAL_SESIONES_EVENTO} SESIONES CONFIRMADAS
                </p>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <span className="material-symbols-outlined text-[80px] sm:text-[120px]">calendar_month</span>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Información de tu cuenta</h4>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Nombre:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{user?.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-right break-all">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Matrícula:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{user?.matricula}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Rol:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-right capitalize">{user?.rol}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="text-center py-6 sm:py-8 border-t border-gray-200 dark:border-gray-800 px-4">
        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-[0.15em]">AgendaUES © 2025 - Cultura que Inspira, Conocimiento que Transforma</p>
      </footer>

      {/* Modal Logout - RESPONSIVE */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] px-4" onClick={handleCancelLogout}>
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-[420px] w-full mx-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-green-700"></div>
            <div className="p-6 sm:p-10 text-center">
              <div className="mb-4 sm:mb-6 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl sm:text-3xl">logout</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white mb-2 sm:mb-3">¿Cerrar sesión?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">¿Estás seguro de que quieres salir?</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button onClick={handleCancelLogout} className="py-2.5 sm:py-3 rounded-lg font-semibold text-green-700 dark:text-green-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs sm:text-sm">Cancelar</button>
                <button onClick={handleConfirmLogout} className="py-2.5 sm:py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 text-xs sm:text-sm">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiAgenda;