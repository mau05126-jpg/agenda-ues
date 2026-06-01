// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { getCurrentUser, logoutUser } from '../services/authService';

const AdminDashboard = ({ setCurrentPage }) => {
  const { stats, sesiones, refreshData } = useAdmin();
  const [user, setUser] = useState(() => getCurrentUser());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Leer preferencia guardada o preferencia del sistema
    const saved = localStorage.getItem('agendaDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const [localStats, setLocalStats] = useState({
    sesiones: 0,
    ponentes: 0,
    escenarios: 0,
    estudiantes: 0,
    distribucion: {
      LUN: { valor: 0, altura: '0%' },
      MAR: { valor: 0, altura: '0%' },
      MIE: { valor: 0, altura: '0%' },
      JUE: { valor: 0, altura: '0%' },
      VIE: { valor: 0, altura: '0%' }
    }
  });

  // Guardar preferencia de modo oscuro
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
      return;
    }
    if (refreshData) refreshData();
    cargarActividad();
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    const token = localStorage.getItem('token');
    const notifs = [];

    try {
      // 1. Nuevos estudiantes (últimas 48h)
      const usuRes = await fetch('/api/admin/usuarios', { headers: { 'Authorization': `Bearer ${token}` } });
      const usuData = await usuRes.json();
      if (usuData.success && usuData.usuarios) {
        const hace48h = Date.now() - 48 * 60 * 60 * 1000;
        const nuevos = usuData.usuarios.filter(u =>
          u.rol === 'estudiante' && u.activo !== false &&
          new Date(u.created_at || u.fecha_registro || 0).getTime() > hace48h
        );
        if (nuevos.length > 0) {
          notifs.push({
            id: 'nuevos_estudiantes',
            tipo: 'estudiante',
            icono: 'person_add',
            color: '#00695C',
            bg: '#E0F2F1',
            titulo: `${nuevos.length} nuevo${nuevos.length > 1 ? 's' : ''} estudiante${nuevos.length > 1 ? 's' : ''} registrado${nuevos.length > 1 ? 's' : ''}`,
            detalle: 'En las últimas 48 horas',
          });
        }
      }
    } catch (_) {}

    try {
      // 2. Escenarios casi llenos (≥80%)
      const escRes = await fetch('/api/escenarios/ocupacion', { headers: { 'Authorization': `Bearer ${token}` } });
      const escData = await escRes.json();
      if (escData.success) {
        const ocupMap = {};
        (escData.ocupacion || []).forEach(o => { ocupMap[o.escenario] = parseInt(o.inscritos) || 0; });
        const casiLlenos = (escData.escenarios || []).filter(e => {
          const pct = (ocupMap[e.nombre] || 0) / (parseInt(e.capacidad) || 1) * 100;
          return pct >= 80;
        });
        casiLlenos.forEach(e => {
          const inscritos = ocupMap[e.nombre] || 0;
          const pct = Math.round(inscritos / parseInt(e.capacidad) * 100);
          notifs.push({
            id: `escenario_${e.nombre}`,
            tipo: 'escenario',
            icono: pct >= 100 ? 'block' : 'warning',
            color: pct >= 100 ? '#C62828' : '#E65100',
            bg: pct >= 100 ? '#FFEBEE' : '#FFF3E0',
            titulo: `${e.nombre} al ${pct}% de capacidad`,
            detalle: `${inscritos} / ${e.capacidad} inscritos`,
          });
        });
      }
    } catch (_) {}

    try {
      // 3. Sesiones sin ponente
      const sesRes = await fetch('/api/sesiones/listar');
      const sesData = await sesRes.json();
      if (sesData.success && sesData.sesiones) {
        const sinPonente = sesData.sesiones.filter(s => !s.ponente || s.ponente.trim() === '');
        if (sinPonente.length > 0) {
          notifs.push({
            id: 'sin_ponente',
            tipo: 'sesion',
            icono: 'person_off',
            color: '#1565C0',
            bg: '#E3F2FD',
            titulo: `${sinPonente.length} sesión${sinPonente.length > 1 ? 'es' : ''} sin ponente`,
            detalle: sinPonente.map(s => s.titulo).slice(0, 2).join(', ') + (sinPonente.length > 2 ? '…' : ''),
          });
        }
      }
    } catch (_) {}

    try {
      // 4. Inscripciones recientes (actividad_log)
      const actRes = await fetch('/api/admin/actividad', { headers: { 'Authorization': `Bearer ${token}` } });
      const actData = await actRes.json();
      if (actData.success && actData.actividades) {
        const inscRecientes = actData.actividades.filter(a => a.tipo === 'inscripcion');
        if (inscRecientes.length > 0) {
          notifs.push({
            id: 'inscripciones_recientes',
            tipo: 'inscripcion',
            icono: 'how_to_reg',
            color: '#6A1B9A',
            bg: '#F3E5F5',
            titulo: `${inscRecientes.length} inscripción${inscRecientes.length > 1 ? 'es' : ''} reciente${inscRecientes.length > 1 ? 's' : ''}`,
            detalle: inscRecientes[0]?.detalle || 'Actividad reciente',
          });
        }
      }
    } catch (_) {}

    setNotificaciones(notifs);
  };

  const cargarActividad = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/actividad', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setActividades(data.actividades);
    } catch (_) {}
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return 'Recientemente';
    const diff = Math.floor((Date.now() - new Date(fechaStr)) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
    return new Date(fechaStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  useEffect(() => {
    if (stats) {
      setLocalStats({
        sesiones: stats.sesiones || 0,
        ponentes: stats.ponentes || 0,
        escenarios: stats.escenarios || 0,
        estudiantes: stats.estudiantes || 0,
        distribucion: stats.distribucion || {
          LUN: { valor: 0, altura: '0%' },
          MAR: { valor: 0, altura: '0%' },
          MIE: { valor: 0, altura: '0%' },
          JUE: { valor: 0, altura: '0%' },
          VIE: { valor: 0, altura: '0%' }
        }
      });
    }
  }, [stats]);

  useEffect(() => {
    if (sesiones && sesiones.length > 0) {
      setLocalStats(prev => ({
        ...prev,
        sesiones: sesiones.length,
        ponentes: new Set(sesiones.map(s => s.ponente)).size,
        escenarios: new Set(sesiones.map(s => s.escenario)).size
      }));
    }
  }, [sesiones]);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);

  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  // Cerrar sidebar al hacer click fuera en móvil
  const handleOverlayClick = () => setSidebarOpen(false);

  if (!user || user.rol !== 'admin') {
    setCurrentPage('loginPage');
    return null;
  }

  const barras = [
    { dia: 'LUN', valor: localStats.distribucion?.LUN?.valor || 0, altura: localStats.distribucion?.LUN?.altura || '0%' },
    { dia: 'MAR', valor: localStats.distribucion?.MAR?.valor || 0, altura: localStats.distribucion?.MAR?.altura || '0%' },
    { dia: 'MIE', valor: localStats.distribucion?.MIE?.valor || 0, altura: localStats.distribucion?.MIE?.altura || '0%' },
    { dia: 'JUE', valor: localStats.distribucion?.JUE?.valor || 0, altura: localStats.distribucion?.JUE?.altura || '0%' },
    { dia: 'VIE', valor: localStats.distribucion?.VIE?.valor || 0, altura: localStats.distribucion?.VIE?.altura || '0%' }
  ];

  // Icono del tema
  const ThemeIcon = () => (
    <span className="material-symbols-outlined text-lg">
      {darkMode ? 'light_mode' : 'dark_mode'}
    </span>
  );

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f5f5f5] dark:bg-[#0f172a]">
      {/* Overlay móvil para sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        w-[260px] fixed left-0 top-0 bottom-0 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-[#2E7D32] dark:bg-[#1B5E20]
      `}>
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
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

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <button className="nav-item flex items-center gap-3 py-3 px-4 bg-white/10 dark:bg-white/5 text-white font-semibold rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Panel de Administración</span>
          </button>
          <button onClick={() => { setCurrentPage('adminSesiones'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Sesiones</span>
          </button>
          <button onClick={() => { setCurrentPage('adminUsuarios'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">group</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Usuarios</span>
          </button>
          <button onClick={() => { setCurrentPage('adminEscenarios'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">meeting_room</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Escenarios</span>
          </button>
          <button onClick={() => { setCurrentPage('adminReportes'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Reportes</span>
          </button>
        </nav>

        <div className="px-4 pb-6 flex-shrink-0">
          <div className="border-t border-white/10 dark:border-white/5 pt-4">
            <button onClick={handleLogoutClick} className="w-full nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg text-left">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-sm tracking-wide whitespace-nowrap">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen transition-all">
        {/* Header - Responsive */}
        <header className={`
          w-full h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shadow-sm
          transition-colors duration-300
          ${darkMode ? 'bg-[#1e293b] border-b border-gray-700' : 'bg-white'}
        `}>
          <div className="flex items-center gap-4">
            {/* Botón hamburguesa móvil */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg lg:text-xl font-extrabold tracking-tight text-[#1B5E20] dark:text-[#81C784]">
              Resumen General
            </h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Botón modo oscuro */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                darkMode 
                  ? 'text-yellow-400 hover:bg-gray-700' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              <ThemeIcon />
            </button>
            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(v => !v)}
                className={`p-2 rounded-full transition-colors relative ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <span className="material-symbols-outlined">notifications</span>
                {notificaciones.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                    {notificaciones.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                  <div className={`absolute right-0 top-11 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className={`px-4 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-sm font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Notificaciones</span>
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{notificaciones.length} nuevas</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <div className="py-10 text-center">
                          <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">notifications_off</span>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sin notificaciones</p>
                        </div>
                      ) : (
                        notificaciones.map(n => (
                          <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${darkMode ? 'border-gray-700/50 hover:bg-gray-700/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: n.bg }}>
                              <span className="material-symbols-outlined text-sm" style={{ color: n.color }}>{n.icono}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{n.titulo}</p>
                              <p className={`text-[11px] mt-0.5 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{n.detalle}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className={`px-4 py-2.5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <button onClick={() => { setNotificaciones([]); setShowNotif(false); }} className="text-[11px] font-bold text-[#2E7D32] hover:underline w-full text-center">
                        Marcar todas como leídas
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.nombre}</p>
                <p className={`text-[10px] uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Administrador</p>
              </div>
              <div className="w-9 h-9 bg-[#1B5E20] dark:bg-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold">
                {user.nombre?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
          {/* Stats Cards - Responsive Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div className={`stat-card p-4 lg:p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#2E7D32] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#2E7D32]">
                <span className="material-symbols-outlined">event_note</span>
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{localStats.sesiones}</p>
                <p className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sesiones Registradas</p>
              </div>
            </div>
            <div className={`stat-card p-4 lg:p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#388E3C] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#388E3C]">
                <span className="material-symbols-outlined">record_voice_over</span>
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{localStats.ponentes}</p>
                <p className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ponentes Confirmados</p>
              </div>
            </div>
            <div className={`stat-card p-4 lg:p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#43A047] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#43A047]">
                <span className="material-symbols-outlined">meeting_room</span>
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{localStats.escenarios}</p>
                <p className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Escenarios Activos</p>
              </div>
            </div>
            <div className={`stat-card p-4 lg:p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#66BB6A] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#66BB6A]">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{localStats.estudiantes}</p>
                <p className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estudiantes Inscritos</p>
              </div>
            </div>
          </section>

          {/* Charts & Summary - Responsive */}
          <section className="grid grid-cols-1 gap-4 lg:gap-6">
            {/* Gráfica de barras verticales - Distribución por día */}
            <div className={`p-4 lg:p-6 rounded-xl shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Distribución de Sesiones</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sesiones por día de la semana</p>
                </div>
                <span className="text-[#2E7D32] font-bold text-xs bg-[#E8F5E9] dark:bg-[#1B5E20]/30 dark:text-green-400 px-3 py-1.5 rounded-full">
                  {localStats.sesiones} total
                </span>
              </div>

              {localStats.sesiones === 0 ? (
                <div className={`h-52 flex flex-col items-center justify-center gap-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                  <span className="material-symbols-outlined text-5xl">bar_chart</span>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sin sesiones registradas</p>
                </div>
              ) : (
                <>
                  {/* Área de barras */}
                  <div className="flex items-end justify-between gap-3 px-2" style={{ height: '200px' }}>
                    {barras.map((barra, idx) => {
                      const maxVal = Math.max(...barras.map(b => b.valor), 1);
                      const heightPct = (barra.valor / maxVal) * 85;
                      const isMax = barra.valor === maxVal && barra.valor > 0;
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-default">
                          {/* Valor siempre visible */}
                          <span className={`text-sm font-extrabold mb-2 transition-colors
                            ${barra.valor === 0
                              ? darkMode ? 'text-gray-700' : 'text-gray-300'
                              : isMax
                                ? 'text-[#1B5E20] dark:text-green-400'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            {barra.valor}
                          </span>
                          {/* Barra */}
                          <div
                            className="w-full rounded-t-xl transition-all duration-700 ease-out group-hover:opacity-80"
                            style={{
                              height: barra.valor > 0 ? `${heightPct}%` : '4px',
                              background: isMax
                                ? 'linear-gradient(180deg, #1B5E20, #2E7D32)'
                                : barra.valor > 0
                                  ? 'linear-gradient(180deg, #2E7D32, #43A047)'
                                  : darkMode ? '#374151' : '#e5e7eb',
                              borderRadius: barra.valor > 0 ? '10px 10px 0 0' : '4px 4px 0 0',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Eje X */}
                  <div className={`flex justify-between px-2 mt-3 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    {barras.map((barra, idx) => (
                      <div key={idx} className="flex-1 text-center">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {barra.dia}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </section>

          {/* Activity Table */}
          <section className={`p-4 lg:p-6 rounded-xl shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="mb-6">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Actividad Reciente</h3>
            </div>
            {actividades.length === 0 ? (
              <div className={`h-32 flex flex-col items-center justify-center gap-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                <span className="material-symbols-outlined text-4xl">history</span>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sin actividad registrada</p>
              </div>
            ) : (
              <div className="space-y-1">
                {actividades.map((act, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Icono */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: act.bg }}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: act.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {act.icono}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {act.titulo}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {act.detalle}
                      </p>
                    </div>
                    {/* Fecha */}
                    <span className={`text-[11px] font-medium flex-shrink-0 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      {formatFecha(act.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className={`px-4 lg:px-8 py-6 text-center border-t transition-colors duration-300 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-[11px] font-medium uppercase tracking-[0.15em] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>AgendaUES © 2025</p>
        </footer>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={handleCancelLogout}>
          <div className={`rounded-2xl max-w-[420px] mx-4 overflow-hidden ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-6 lg:p-10 text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span>
              </div>
              <h3 className={`text-xl font-extrabold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Cerrar sesión?</h3>
              <p className={`text-sm mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estás a punto de salir. ¿Deseas continuar?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCancelLogout} className={`py-3 rounded-lg font-semibold ${darkMode ? 'text-[#66BB6A] bg-gray-700 hover:bg-gray-600' : 'text-[#2E7D32] bg-gray-100'}`}>Cancelar</button>
                <button onClick={handleConfirmLogout} className="py-3 rounded-lg font-semibold text-white bg-[#C62828]">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nav-item { transition: all 0.2s ease; }
        .nav-item:hover { background-color: rgba(255,255,255,0.08); }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
        .bar-item { transition: opacity 0.2s ease; }
        .bar-item:hover { opacity: 0.85; }

        /* Scrollbar personalizado para modo oscuro */
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #1e293b; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;