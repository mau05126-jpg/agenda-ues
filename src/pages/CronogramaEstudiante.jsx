// src/pages/CronogramaEstudiante.jsx
import { useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';

const CronogramaEstudiante = ({ setCurrentPage }) => {
  const [user, setUser] = useState(null);

  const [sesiones, setSesiones] = useState(() => {
    const guardado = localStorage.getItem('sesiones_cronograma_cache');
    return guardado ? JSON.parse(guardado) : [];
  });

  const [loading, setLoading] = useState(false); // ✅ Empezar en false, no true
  const [diaActivo, setDiaActivo] = useState(1);
  const [areaFiltro, setAreaFiltro] = useState('Todas');

  const [misInscripciones, setMisInscripciones] = useState(() => {
    const currentUser = getCurrentUser();
    if (currentUser?.id) {
      const stored = localStorage.getItem(`inscripciones_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  const AREAS = ['Todas', 'Conferencia Magistral', 'Taller Práctico', 'Ponencia'];
  const DIAS = [1, 2, 3, 4, 5];
  const TOTAL_SESIONES_EVENTO = 10;

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.rol === 'estudiante') {
      setUser(currentUser);
      cargarSesionesSilencioso();
    } else {
      setCurrentPage('loginPage');
    }
  }, [setCurrentPage]);

  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`inscripciones_${user.id}`);
      if (stored) {
        setMisInscripciones(JSON.parse(stored));
      }
    }
  }, [user?.id]);

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

  const cargarSesionesSilencioso = async () => {
    try {
      const response = await fetch('/api/sesiones/listar');
      const data = await response.json();
      if (data.success && data.sesiones) {
        const sesionesConDia = data.sesiones.map(s => {
          let dia = 1;
          if (s.fecha) {
            const fecha = new Date(s.fecha);
            const diaNum = fecha.getDate();
            if (diaNum === 1) dia = 1;
            else if (diaNum === 2) dia = 2;
            else if (diaNum === 3) dia = 3;
            else if (diaNum === 4) dia = 4;
            else if (diaNum === 5) dia = 5;
          }
          return { ...s, dia };
        });
        setSesiones(sesionesConDia);
        // ✅ Guardar en caché para la próxima vez
        localStorage.setItem('sesiones_cronograma_cache', JSON.stringify(sesionesConDia));
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error);
    }
  };

  const cargarMisInscripciones = async () => {
    try {
      if (!user?.id) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/inscripciones/mis-inscripciones', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.inscripciones) {
        const formateadas = data.inscripciones.map(s => ({
          id: s.id,
          titulo: s.titulo,
          ponente: s.ponente,
          fecha: s.fecha,
          hora: s.hora ? s.hora.substring(0, 5) : 'N/A',
          categoria: s.categoria,
          escenario: s.escenario,
          descripcion: s.descripcion,
          duracion: s.duracion || 60,
        }));
        setMisInscripciones(formateadas);
        localStorage.setItem(`inscripciones_${user.id}`, JSON.stringify(formateadas));
      }
    } catch (error) {
      // fallback: usar localStorage
      const stored = localStorage.getItem(`inscripciones_${user.id}`);
      if (stored) setMisInscripciones(JSON.parse(stored));
    }
  };

  const handleAgregarSesion = async (sesion) => {
    if (!user?.id) { mostrarToast('Error: Usuario no identificado'); return; }

    const yaInscrito = misInscripciones.some(ins => ins.id === sesion.id);
    if (yaInscrito) { mostrarToast('Ya tienes esta sesión en tu agenda'); return; }
    if (misInscripciones.length >= TOTAL_SESIONES_EVENTO) {
      mostrarToast(`Has alcanzado el límite de ${TOTAL_SESIONES_EVENTO} sesiones`);
      return;
    }

    const token = localStorage.getItem('token');

    // Actualización optimista — mostrar de inmediato en la UI
    const sesionParaGuardar = {
      id: sesion.id, titulo: sesion.titulo, ponente: sesion.ponente,
      fecha: sesion.fecha, hora: sesion.hora, categoria: sesion.categoria,
      escenario: sesion.escenario, descripcion: sesion.descripcion,
      imagenPonente: sesion.imagen_ponente || null, duracion: sesion.duracion || 60,
    };
    const nuevas = [...misInscripciones, sesionParaGuardar];
    setMisInscripciones(nuevas);
    localStorage.setItem(`inscripciones_${user.id}`, JSON.stringify(nuevas));
    window.dispatchEvent(new Event('inscripciones-updated'));
    mostrarToast('Sesión agregada con éxito');

    // Guardar también en la BD (en segundo plano)
    if (token) {
      try {
        await fetch('/api/inscripciones/inscribir', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sesion_id: sesion.id }),
        });
      } catch (_) { /* localStorage ya quedó guardado */ }
    }
  };

  const mostrarToast = (mensaje) => {
    setToast(mensaje);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  const sesionesFiltradas = sesiones.filter(s => {
    const matchDia = s.dia === diaActivo;
    const matchArea = areaFiltro === 'Todas' || s.categoria === areaFiltro;
    return matchDia && matchArea;
  });

  const sesionesPorHora = sesionesFiltradas.reduce((grupo, sesion) => {
    const hora = sesion.hora?.substring(0, 5) || '00:00';
    if (!grupo[hora]) grupo[hora] = [];
    grupo[hora].push(sesion);
    return grupo;
  }, {});

  const horasOrdenadas = Object.keys(sesionesPorHora).sort();

  const getCategoriaLabel = (categoria) => {
    const mapa = {
      'Conferencia Magistral': 'CONFERENCIA',
      'Conferencia': 'CONFERENCIA',
      'Taller Práctico': 'TALLER',
      'Taller': 'TALLER',
      'Ponencia': 'SESIÓN',
    };
    return mapa[categoria] || (categoria || 'SESIÓN').toUpperCase();
  };

  const formatearHoraAMPM = (horaStr) => {
    if (!horaStr) return 'N/A';
    const [h, m] = horaStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getIniciales = (nombre) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const yaInscrito = (id) => misInscripciones.some(ins => ins.id === id);
  const porcentajeProgreso = misInscripciones.length > 0
    ? Math.min((misInscripciones.length / TOTAL_SESIONES_EVENTO) * 100, 100)
    : 0;


  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Toast - RESPONSIVE */}
      {toast && (
        <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-50 bg-green-800 dark:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 animate-fade-in max-w-[90vw] sm:max-w-none">
          <span className="material-symbols-outlined text-base sm:text-lg flex-shrink-0">check_circle</span>
          <span className="font-medium text-xs sm:text-sm">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white flex-shrink-0">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

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
              onClick={() => setCurrentPage('miAgenda')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition pb-0.5"
            >
              Mi Agenda
            </button>
            <button
              onClick={() => setCurrentPage('cronogramaEstudiante')}
              className="text-green-800 dark:text-green-400 border-b-2 border-green-600 pb-0.5"
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

            <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition relative">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg sm:text-xl">bookmark</span>
              {misInscripciones.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[9px] sm:text-[10px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
                  {misInscripciones.length}
                </span>
              )}
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

            {/* BOTÓN MENÚ MÓVIL */}
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

        {/* MENÚ MÓVIL DESPLEGABLE */}
        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-4 shadow-lg">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => { setCurrentPage('miAgenda'); setMenuOpen(false); }}
                className="text-left py-2.5 px-3 rounded-lg transition text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Mi Agenda
              </button>
              <button
                className="text-left py-2.5 px-3 rounded-lg transition bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold"
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
        {/* Header - RESPONSIVE */}
        <header className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold tracking-wider uppercase text-[10px] sm:text-[11px]">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Panel del Estudiante
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-white leading-none">
              {user?.nombre || 'Estudiante'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm sm:text-base leading-relaxed">
              Explora las sesiones académicas, talleres y conferencias magistrales. Personaliza tu experiencia guardando tus sesiones favoritas.
            </p>
          </div>
        </header>

        {/* Tabs de Días - RESPONSIVE */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {DIAS.map(dia => (
            <button
              key={dia}
              onClick={() => setDiaActivo(dia)}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex-shrink-0 ${diaActivo === dia
                  ? 'bg-green-800 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              Día {dia}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Sidebar Izquierdo - RESPONSIVE */}
          <aside className="lg:col-span-3 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 text-xs uppercase tracking-wider">Filtrar por tipo</h4>
              <div className="flex flex-wrap gap-2">
                {AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => setAreaFiltro(area)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${areaFiltro === area
                        ? 'bg-green-800 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-green-800 dark:bg-green-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold text-base sm:text-lg mb-2">Tu Agenda</h4>
                <p className="text-green-200 text-xs sm:text-sm mb-3 sm:mb-4">
                  Tienes {misInscripciones.length} sesión{misInscripciones.length !== 1 ? 'es' : ''} programada{misInscripciones.length !== 1 ? 's' : ''} para este congreso.
                </p>
                <div className="w-full bg-green-900/30 rounded-full h-2 mb-2 sm:mb-3">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeProgreso}%` }}
                  ></div>
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-300 mb-3 sm:mb-4">
                  {misInscripciones.length} DE {TOTAL_SESIONES_EVENTO} SESIONES
                </p>
                <button
                  onClick={() => setCurrentPage('miAgenda')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all"
                >
                  Ver Mi Agenda
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <span className="material-symbols-outlined text-[80px] sm:text-[100px]">calendar_month</span>
              </div>
            </div>
          </aside>

          {/* Timeline - RESPONSIVE */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            {horasOrdenadas.length === 0 ? (
              <div className="text-center py-12 sm:py-20 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="material-symbols-outlined text-4xl sm:text-6xl text-gray-300 dark:text-gray-500">event_busy</span>
                <p className="text-gray-500 dark:text-gray-400 mt-4 font-medium text-sm sm:text-base">No hay sesiones para este día</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {horasOrdenadas.map(hora => (
                  <div key={hora} className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <div className="sm:w-20 flex-shrink-0 pt-0 sm:pt-2">
                      <div className="text-green-800 dark:text-green-400 font-bold text-base sm:text-lg">{formatearHoraAMPM(hora)}</div>
                      <div className="text-gray-400 text-[9px] sm:text-[10px] uppercase font-bold mt-0.5 sm:mt-1">
                        {getCategoriaLabel(sesionesPorHora[hora][0]?.categoria)}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 sm:space-y-4">
                      {sesionesPorHora[hora].map(sesion => {
                        const enAgenda = yaInscrito(sesion.id);
                        const esDestacada = sesion.categoria === 'Conferencia Magistral' || sesion.categoria === 'Keynote';

                        return (
                          <div
                            key={sesion.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-sm border transition-all hover:shadow-md ${esDestacada ? 'border-green-500 dark:border-green-600 ring-1 ring-green-500/20' : 'border-gray-100 dark:border-gray-700'
                              } ${enAgenda ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                              <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-md tracking-widest uppercase bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                    {getCategoriaLabel(sesion.categoria)}
                                  </span>
                                  {esDestacada && (
                                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-md bg-green-800 text-white flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[9px] sm:text-[10px]">star</span>
                                      Destacada
                                    </span>
                                  )}
                                  {enAgenda && (
                                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-md bg-green-600 text-white flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[9px] sm:text-[10px]">check</span>
                                      En mi agenda
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                                  {sesion.titulo}
                                </h3>

                                <div className="flex items-center gap-2 sm:gap-3">
                                  {sesion.imagen_ponente ? (
                                    <img
                                      src={sesion.imagen_ponente}
                                      alt={sesion.ponente}
                                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-bold flex-shrink-0">
                                      {sesion.ponente?.charAt(0) || 'P'}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <span className="text-gray-800 dark:text-gray-200 font-medium text-xs sm:text-sm">{sesion.ponente}</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-1 sm:ml-2">{sesion.ponente_especialidad || 'Ponente'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    {sesion.escenario}
                                  </span>
                                </div>

                                {sesion.descripcion && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{sesion.descripcion}</p>
                                )}
                              </div>

                              <div className="flex-shrink-0 sm:self-start">
                                {enAgenda ? (
                                  <div className="flex flex-col items-start sm:items-end gap-2">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[9px] sm:text-[10px]">check</span>
                                      <span className="hidden sm:inline">En mi agenda</span>
                                      <span className="sm:hidden">Agregado</span>
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAgregarSesion(sesion)}
                                    className="flex items-center gap-1.5 sm:gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold hover:border-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all w-full sm:w-auto justify-center"
                                  >
                                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                                    Agregar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CronogramaEstudiante;