// src/pages/AdminPanel.jsx - Dashboard completo
import { useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';

const AdminPanel = ({ setCurrentPage }) => {
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sesiones, setSesiones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estadísticas para el dashboard
  const [stats, setStats] = useState({
    totalSesiones: 0,
    totalPonentes: 0,
    totalEscenarios: 4,
    totalInscritos: 45
  });

  useEffect(() => {
    if (!user || user.rol !== 'admin') {
      setCurrentPage('loginPage');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const response = await fetch('/api/sesiones/listar');
      const data = await response.json();
      if (data.success && data.sesiones) {
        const formateadas = data.sesiones.map(s => ({
          id: s.id,
          nombre: s.titulo,
          ponente: s.ponente,
          fecha: s.fecha ? new Date(s.fecha).toLocaleDateString() : 'N/A',
          hora: s.hora ? s.hora.substring(0,5) : 'N/A',
          escenario: s.escenario,
          tipo: s.categoria
        }));
        setSesiones(formateadas);
        
        // Actualizar estadísticas
        setStats({
          totalSesiones: formateadas.length,
          totalPonentes: new Set(formateadas.map(s => s.ponente)).size,
          totalEscenarios: 4,
          totalInscritos: 45
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentPage('home');
  };

  const filteredSesiones = sesiones.filter(s => 
    s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ponente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Datos del gráfico de barras (distribución por día)
  const getDistribucionPorDia = () => {
    const dias = { LUN: 0, MAR: 0, MIE: 0, JUE: 0, VIE: 0 };
    sesiones.forEach(s => {
      if (s.fecha && s.fecha !== 'N/A') {
        const dia = new Date(s.fecha).getDay();
        if (dia === 1) dias.LUN++;
        else if (dia === 2) dias.MAR++;
        else if (dia === 3) dias.MIE++;
        else if (dia === 4) dias.JUE++;
        else if (dia === 5) dias.VIE++;
      }
    });
    const maxValor = Math.max(...Object.values(dias), 1);
    return Object.entries(dias).map(([dia, valor]) => ({
      dia,
      valor,
      altura: `${(valor / maxValor) * 100}%`
    }));
  };

  const distribucion = getDistribucionPorDia();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside className="w-[260px] fixed left-0 top-0 bottom-0 bg-[#1B5E20] flex flex-col z-50">
        <div className="px-6 pt-8 pb-6 flex-shrink-0">
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
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${activeTab === 'dashboard' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-sm tracking-wide">Panel de Administración</span>
          </button>
          <button onClick={() => setActiveTab('sesiones')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${activeTab === 'sesiones' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span className="text-sm tracking-wide">Sesiones</span>
          </button>
          <button onClick={() => setActiveTab('usuarios')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${activeTab === 'usuarios' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">group</span>
            <span className="text-sm tracking-wide">Usuarios</span>
          </button>
          <button onClick={() => setActiveTab('escenarios')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${activeTab === 'escenarios' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">meeting_room</span>
            <span className="text-sm tracking-wide">Escenarios</span>
          </button>
          <button onClick={() => setCurrentPage('adminReportes')} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span className="text-sm tracking-wide">Reportes</span>
          </button>
        </nav>

        <div className="px-4 flex-shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <div className="border-t border-white/10 pt-4">
            <button onClick={() => setShowLogoutModal(true)} className="w-full nav-item flex items-center gap-3 py-3 px-4 text-white/60 hover:text-white rounded-lg text-left">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-sm tracking-wide">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[260px] min-h-screen">
        {/* Header */}
        <header className="w-full h-16 sticky top-0 z-40 bg-white flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-extrabold text-[#1B5E20] tracking-tight">Resumen General</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">search</span>
              <input className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm w-56 focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none" placeholder="Buscar registros..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{user?.nombre || 'Admin UES'}</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">{user?.rol === 'admin' ? 'Super Usuario' : 'Administrador'}</p>
              </div>
              <div className="w-9 h-9 bg-[#1B5E20] rounded-full flex items-center justify-center text-white font-bold">
                {user?.nombre?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="p-8 space-y-8">
            {/* Statistics Row */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="stat-card bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#2E7D32]">
                <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#2E7D32]">
                  <span className="material-symbols-outlined">event_note</span>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-800">{stats.totalSesiones}</p>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Sesiones Registradas</p>
                </div>
              </div>
              <div className="stat-card bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#388E3C]">
                <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#388E3C]">
                  <span className="material-symbols-outlined">record_voice_over</span>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-800">{stats.totalPonentes}</p>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ponentes Confirmados</p>
                </div>
              </div>
              <div className="stat-card bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#43A047]">
                <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#43A047]">
                  <span className="material-symbols-outlined">meeting_room</span>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-800">{stats.totalEscenarios}</p>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Escenarios Activos</p>
                </div>
              </div>
              <div className="stat-card bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 border-l-4 border-[#66BB6A]">
                <div className="w-11 h-11 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-[#66BB6A]">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-800">{stats.totalInscritos}</p>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Estudiantes Inscritos</p>
                </div>
              </div>
            </section>

            {/* Central Section: Bar Chart & Alerts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Distribución de Sesiones</h3>
                    <p className="text-xs text-gray-500 mt-1">Actividad por día de la semana (Lunes a Viernes)</p>
                  </div>
                  <span className="text-[#2E7D32] font-bold text-xs bg-[#E8F5E9] px-3 py-1.5 rounded-full">Semana Actual</span>
                </div>
                <div className="flex items-end justify-between h-52 px-2 gap-3">
                  {distribucion.map((item) => (
                    <div key={item.dia} className="bar-item flex flex-col items-center flex-1 group cursor-pointer">
                      <div className="w-full bg-[#2E7D32] relative rounded-t-lg" style={{ height: item.altura }}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-[#2E7D32] opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.valor}
                        </span>
                      </div>
                      <span className="mt-3 text-[11px] font-medium text-gray-500 uppercase">{item.dia}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-[#2E7D32]">campaign</span>
                  <h3 className="text-base font-bold text-gray-800">Notificaciones Críticas</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500 flex gap-3">
                    <span className="material-symbols-outlined text-red-500 shrink-0 text-lg">warning</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Escenario Aula Magna</p>
                      <p className="text-xs text-gray-500 mt-0.5">Capacidad al 90%. Se recomienda monitoreo.</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#43A047] flex gap-3">
                    <span className="material-symbols-outlined text-[#43A047] shrink-0 text-lg">check_circle</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Ponente Aceptado</p>
                      <p className="text-xs text-gray-500 mt-0.5">Dr. Martínez ha confirmado su asistencia.</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#66BB6A] flex gap-3">
                    <span className="material-symbols-outlined text-[#66BB6A] shrink-0 text-lg">info</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Nuevo Registro</p>
                      <p className="text-xs text-gray-500 mt-0.5">12 estudiantes nuevos inscritos hoy.</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 text-[#2E7D32] font-bold text-xs hover:bg-[#E8F5E9] transition-colors rounded-lg uppercase tracking-widest">
                  Ver todo el historial
                </button>
              </div>
            </section>

            {/* Recent Activity Table */}
            <section className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Actividad Reciente</h3>
                <div className="flex gap-3">
                  <button className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">Exportar CSV</button>
                  <button className="px-4 py-2 text-xs font-medium bg-[#2E7D32] text-white rounded-lg hover:bg-[#1B5E20] transition-colors">Filtrar</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Usuario</th>
                      <th className="pb-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Acción</th>
                      <th className="pb-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Elemento</th>
                      <th className="pb-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Fecha/Hora</th>
                      <th className="pb-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center font-bold text-xs">MA</div>
                          <span className="text-sm font-semibold text-gray-800">Miguel Alvarado</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">Modificación de horario</td>
                      <td className="py-4 px-4 text-sm font-medium text-[#2E7D32]">Taller de Innovación</td>
                      <td className="py-4 px-4 text-xs text-gray-500">Hoy, 10:45 AM</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#E8F5E9] text-[#2E7D32]">Completado</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-xs">LG</div>
                          <span className="text-sm font-semibold text-gray-800">Lucía Gómez</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">Registro de ponente</td>
                      <td className="py-4 px-4 text-sm font-medium text-[#2E7D32]">Ing. Carlos Ruíz</td>
                      <td className="py-4 px-4 text-xs text-gray-500">Hoy, 09:12 AM</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FFF3E0] text-[#E65100]">Procesando</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#FFEBEE] text-[#C62828] rounded-full flex items-center justify-center font-bold text-xs">RS</div>
                          <span className="text-sm font-semibold text-gray-800">Ricardo Sosa</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">Cancelación de sesión</td>
                      <td className="py-4 px-4 text-sm font-medium text-[#2E7D32]">Seminario Ética</td>
                      <td className="py-4 px-4 text-xs text-gray-500">Ayer, 04:30 PM</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FFEBEE] text-[#C62828]">Fallido</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : activeTab === 'sesiones' ? (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Sesiones</h2>
              <button onClick={() => setCurrentPage('adminRegistrarSesion')} className="bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span>
                Nueva Sesión
              </button>
            </div>
            
            <div className="relative mb-6">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input type="text" placeholder="Buscar sesiones..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Título</th>
                    <th className="px-4 py-3 text-left">Ponente</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Escenario</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSesiones.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-3">{s.nombre}</td>
                      <td className="px-4 py-3">{s.ponente}</td>
                      <td className="px-4 py-3">{s.fecha}</td>
                      <td className="px-4 py-3">{s.hora}</td>
                      <td className="px-4 py-3">{s.escenario}</td>
                    </tr>
                  ))}
                  {filteredSesiones.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No hay sesiones registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'usuarios' ? (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Usuarios</h2>
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              Próximamente...
            </div>
          </div>
        ) : (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Escenarios</h2>
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              Próximamente...
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="ml-[260px] px-8 py-6 text-center border-t border-gray-100">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-[0.15em]">AgendaUES © 2025 - Sistema de Gestión de Agenda Universitaria</p>
      </footer>

      {/* Modal de Cierre de Sesión */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-2xl max-w-[420px] mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-10 text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 mb-3">¿Cerrar sesión?</h3>
              <p className="text-gray-500 text-sm mb-8">Estás a punto de salir del Panel de Administración. ¿Deseas continuar?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="py-3 rounded-lg font-semibold text-[#2E7D32] bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button onClick={handleLogout} className="py-3 rounded-lg font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C]">Cerrar Sesión</button>
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
      `}</style>
    </div>
  );
};

export default AdminPanel;