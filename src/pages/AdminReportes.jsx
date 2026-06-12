// src/pages/AdminReportes.jsx
import { useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';

const AdminReportes = ({ setCurrentPage }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('agendaDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cargar desde caché INSTANTÁNEAMENTE (mismo patrón que AdminUsuarios/AdminSesiones)
  const [usuarios, setUsuarios] = useState(() => {
    const cached = localStorage.getItem('admin_usuarios_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [sesiones, setSesiones] = useState(() => {
    const cached = localStorage.getItem('admin_sesiones_cache');
    return cached ? JSON.parse(cached) : [];
  });
  // Solo muestra "cargando" si no hay nada en caché
  const [loading, setLoading] = useState(() => !localStorage.getItem('admin_usuarios_cache'));

  const user = getCurrentUser();

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
    if (!user || (user.rol !== 'admin' && user.rol !== 'subadmin')) {
      setCurrentPage('loginPage');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usuariosRes, sesionesRes] = await Promise.all([
        fetch('/api/admin/usuarios', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/sesiones/listar')
      ]);
      const usuariosData = await usuariosRes.json();
      const sesionesData = await sesionesRes.json();

      if (usuariosData.success && usuariosData.usuarios) {
        // Mismo formato que usa AdminUsuarios para el caché
        const formateados = usuariosData.usuarios.map(u => ({
          id: u.id,
          nombre: u.nombre_completo,
          email: u.email,
          matricula: u.matricula || '—',
          carrera: u.carrera || '—',
          semestre: u.semestre || '—',
          rol: u.rol,
          estado: u.activo === undefined ? true : u.activo,
        }));
        setUsuarios(formateados);
        localStorage.setItem('admin_usuarios_cache', JSON.stringify(formateados));
      }

      if (sesionesData.success && sesionesData.sesiones) {
        const sesionesFormateadas = sesionesData.sesiones.map(s => ({
          id: s.id,
          nombre: s.titulo || 'Sin título',
          ponente: s.ponente || '',
          escenario: s.escenario || '',
          fecha: s.fecha,
          hora: s.hora ? s.hora.substring(0, 5) : '',
          duracion: s.duracion || 90,
          descripcion: s.descripcion || '',
        }));
        setSesiones(sesionesFormateadas);
        localStorage.setItem('admin_sesiones_cache', JSON.stringify(sesionesFormateadas));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas calculadas
  // El caché usa "estado" (no "activo") y "nombre" (no "nombre_completo")
  const estudiantes = usuarios.filter(u => u.rol === 'estudiante' && u.estado !== false);
  const totalInscritos = estudiantes.length;
  const totalSesiones = sesiones.length;

  // Agrupar estudiantes por carrera para la gráfica
  const carreraMap = {};
  estudiantes.forEach(u => {
    const carrera = (u.carrera && u.carrera !== '—') ? u.carrera : 'Sin carrera';
    carreraMap[carrera] = (carreraMap[carrera] || 0) + 1;
  });
  const carrerasData = Object.entries(carreraMap)
    .map(([carrera, count]) => ({ carrera, count }))
    .sort((a, b) => b.count - a.count);
  const maxCarrera = carrerasData.length > 0 ? Math.max(...carrerasData.map(c => c.count)) : 1;

  // Exportar lista de estudiantes como CSV
  const exportarCSV = () => {
    const headers = ['Nombre', 'Email', 'Matrícula', 'Carrera', 'Semestre', 'Rol', 'Estado'];
    const rows = usuarios.map(u => [
      u.nombre || u.nombre_completo || '',
      u.email,
      u.matricula !== '—' ? u.matricula || '' : '',
      u.carrera !== '—' ? u.carrera || '' : '',
      u.semestre !== '—' ? u.semestre || '' : '',
      u.rol,
      u.estado !== false ? 'Activo' : 'Inactivo'
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios_agendaues_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => setCurrentPage('adminPdfViewer');

  if (!user || (user.rol !== 'admin' && user.rol !== 'subadmin')) {
    setCurrentPage('loginPage');
    return null;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f5f5f5] dark:bg-[#0f172a]">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
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
          <button onClick={() => { setCurrentPage('admin'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Panel de Administración</span>
          </button>
          <button onClick={() => { setCurrentPage('adminSesiones'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Sesiones</span>
          </button>
          <button onClick={() => { setCurrentPage('adminUsuarios'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">group</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Usuarios</span>
          </button>
          <button onClick={() => { setCurrentPage('adminEscenarios'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">meeting_room</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Escenarios</span>
          </button>
          {/* Activo */}
          <button className="nav-item flex items-center gap-3 py-3 px-4 bg-white/10 dark:bg-white/5 text-white font-semibold rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Reportes</span>
          </button>
          <button onClick={() => { setCurrentPage('adminQR'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">qr_code_2</span>
            <span className="text-sm tracking-wide whitespace-nowrap">QR Asistencias</span>
          </button>
          <button onClick={() => { setCurrentPage('adminLogos'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">image</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Logos</span>
          </button>
        </nav>

        <div className="px-4 pb-8">
          <div className="border-t border-white/10 dark:border-white/5 pt-4">
            <button onClick={() => setShowLogoutModal(true)} className="w-full nav-item flex items-center gap-3 py-3 px-4 text-white/60 hover:text-white rounded-lg text-left">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-sm tracking-wide whitespace-nowrap">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`lg:ml-[260px] min-h-screen transition-all duration-300 ${showLogoutModal ? 'filter blur-sm pointer-events-none' : ''}`}>

        {/* Header */}
        <header className={`w-full h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-b border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg lg:text-xl font-extrabold tracking-tight text-[#1B5E20] dark:text-[#81C784]">Reportes y Estadísticas</h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
              <span className="material-symbols-outlined text-lg">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user?.nombre}</p>
                <p className={`text-[10px] uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{user?.rol === 'admin' ? 'Administrador' : 'Subadministrador'}</p>
              </div>
              <div className="w-9 h-9 bg-[#1B5E20] dark:bg-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold">
                {user?.nombre?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-8">

          {/* Breadcrumb + Título */}
          <div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-[#1a1c1c] dark:text-gray-100 tracking-tight">Reportes y Estadísticas</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <p className={`text-xs uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Datos en tiempo real</p>
            </div>
          </div>

          {/* Métricas resumen */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className={`p-6 rounded-xl shadow-sm flex flex-col gap-3 border-l-4 border-[#1B5E20] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Inscritos</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-[#1B5E20] dark:text-[#81C784]">{loading ? '—' : totalInscritos}</span>
                <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-[#2E7D32]'}`}>estudiantes activos</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm flex flex-col gap-3 border-l-4 border-[#2E7D32] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sesiones Registradas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-[#1B5E20] dark:text-[#81C784]">{loading ? '—' : totalSesiones}</span>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>en el programa</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm flex flex-col gap-3 border-l-4 border-[#43A047] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Carreras Representadas</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-extrabold text-[#1B5E20] dark:text-[#81C784]">{loading ? '—' : carrerasData.length}</span>
                <div className={`w-20 h-1.5 self-center rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="bg-[#2E7D32] h-full rounded-full" style={{ width: carrerasData.length > 0 ? '100%' : '0%' }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* Gráfica: Inscritos por Carrera */}
          <section className={`p-6 lg:p-8 rounded-xl shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className={`text-lg font-extrabold ${darkMode ? 'text-gray-100' : 'text-[#1B5E20]'}`}>Inscritos por Carrera</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Distribución de participación estudiantil</p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${darkMode ? 'bg-[#1B5E20]/30 text-green-400' : 'bg-[#E8F5E9] text-[#1B5E20]'}`}>
                  {totalInscritos} estudiantes
                </span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className={`h-20 rounded-xl animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                ))}
              </div>
            ) : carrerasData.length === 0 ? (
              <div className={`h-40 flex flex-col items-center justify-center gap-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <span className="material-symbols-outlined text-4xl">bar_chart</span>
                <p className="text-sm">No hay estudiantes registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrerasData.map(({ carrera, count }, index) => {
                  const barPct = maxCarrera > 0 ? (count / maxCarrera) * 100 : 0;
                  const totalPct = totalInscritos > 0 ? Math.round((count / totalInscritos) * 100) : 0;
                  const rankColors = ['#1B5E20','#2E7D32','#388E3C','#43A047','#66BB6A'];
                  const color = rankColors[Math.min(index, rankColors.length - 1)];
                  const isTop = index === 0;
                  return (
                    <div key={carrera}
                      className={`rounded-xl p-4 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default
                        ${darkMode
                          ? 'bg-gray-800/60 border-gray-700 hover:border-green-700/50'
                          : 'bg-gray-50 border-gray-100 hover:border-green-200 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank badge */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm"
                            style={{ background: color }}
                          >
                            {index + 1}
                          </div>
                          {/* Nombre completo */}
                          <span className={`text-sm font-bold leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            {carrera}
                          </span>
                          {isTop && (
                            <span className="flex-shrink-0 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm"
                              style={{ background: color }}>
                              #1
                            </span>
                          )}
                        </div>
                        {/* Contador + % */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <span className={`text-2xl font-black leading-none ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{count}</span>
                          <div className={`text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0
                            ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}>
                            {totalPct}%
                          </div>
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${barPct}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}99)`,
                            minWidth: count > 0 ? '8px' : '0'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Herramientas de exportación */}
          <section>
            <h3 className={`text-[11px] font-semibold uppercase tracking-widest mb-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Herramientas de Exportación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* PDF */}
              <div className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                </div>
                <h4 className={`font-extrabold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Programa Completo</h4>
                <p className={`text-xs mb-5 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Documento consolidado del programa de sesiones en formato imprimible.</p>
                <button
                  onClick={exportarPDF}
                  className="w-full py-2.5 px-4 bg-[#1B5E20] dark:bg-[#2E7D32] text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#2E7D32] dark:hover:bg-[#43A047] transition-colors active:scale-[0.98]"
                >
                  Generar PDF
                </button>
              </div>

              {/* CSV */}
              <div className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
                <div className="w-12 h-12 bg-[#E8F5E9] dark:bg-[#1B5E20]/30 text-[#2E7D32] dark:text-green-400 rounded-xl flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>table_chart</span>
                </div>
                <h4 className={`font-extrabold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Lista de Estudiantes</h4>
                <p className={`text-xs mb-5 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Matriz de datos estructurada para gestión en Excel (formato CSV).</p>
                <button
                  onClick={exportarCSV}
                  className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors active:scale-[0.98] ${darkMode ? 'bg-gray-700 text-green-400 hover:bg-gray-600' : 'bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9]'}`}
                >
                  Descargar CSV
                </button>
              </div>

              {/* Escenarios */}
              <div className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
                <div className="w-12 h-12 bg-[#E8F5E9] dark:bg-teal-900/30 text-[#43A047] dark:text-teal-400 rounded-xl flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                </div>
                <h4 className={`font-extrabold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Métricas de Escenarios</h4>
                <p className={`text-xs mb-5 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Análisis detallado de ocupación y uso de los espacios físicos del evento.</p>
                <button
                  onClick={() => setCurrentPage('adminEscenarios')}
                  className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors active:scale-[0.98] ${darkMode ? 'bg-gray-700 text-green-400 hover:bg-gray-600' : 'bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9]'}`}
                >
                  Ver Detalles
                </button>
              </div>

            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className={`px-8 py-6 border-t text-center ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-[10px] uppercase tracking-[0.15em] font-medium ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>AgendaUES © 2025 - Sistema de Gestión de Agenda Universitaria</p>
        </footer>
      </main>

      {/* Modal Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={() => setShowLogoutModal(false)}>
          <div className={`rounded-2xl max-w-[420px] mx-4 overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-6 lg:p-10 text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span>
              </div>
              <h3 className={`text-xl font-extrabold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Cerrar sesión?</h3>
              <p className={`text-sm mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estás a punto de salir del Panel de Administración. ¿Deseas continuar?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowLogoutModal(false)} className={`py-3 rounded-lg font-semibold transition-colors ${darkMode ? 'text-[#66BB6A] bg-gray-700 hover:bg-gray-600' : 'text-[#2E7D32] bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button onClick={() => { logoutUser(); setShowLogoutModal(false); setCurrentPage('home'); }} className="py-3 rounded-lg font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C]">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
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

export default AdminReportes;
