// src/pages/AdminEscenarios.jsx - Con ocupación real
import { useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';
import ModalEditarCupo from '../components/ModalEditarCupo';
import AdminToast, { useToast } from '../components/AdminToast';

const AdminEscenarios = ({ setCurrentPage }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('agendaDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEscenario, setSelectedEscenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [nuevoForm, setNuevoForm] = useState({ nombre: '', ubicacion: '', descripcion: '', capacidad: '' });
  const [nuevoLoading, setNuevoLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [escenarioAEliminar, setEscenarioAEliminar] = useState(null);
  
  // Cargar datos desde caché INSTANTÁNEAMENTE
  const [escenarios, setEscenarios] = useState(() => {
    const cached = localStorage.getItem('admin_escenarios_cache');
    if (cached && JSON.parse(cached).length > 0) {
      return JSON.parse(cached);
    }
    return [
      {
        id: 1,
        nombre: 'Aula Magna',
        ubicacion: 'Edificio Central, Piso 1',
        icono: 'school',
        ocupacion: 0,
        capacidad: 100,
        estado: 'sin_inscritos',
        color: 'text-gray-400',
        bgColor: 'bg-gray-100'
      },
      {
        id: 2,
        nombre: 'Laboratorio de Computo',
        ubicacion: 'Bloque B, Sótano 2',
        icono: 'science',
        ocupacion: 0,
        capacidad: 20,
        estado: 'sin_inscritos',
        color: 'text-gray-400',
        bgColor: 'bg-gray-100'
      },
      {
        id: 3,
        nombre: 'Plazoleta Institucional',
        ubicacion: 'Edificio de Eventos, Piso 3',
        icono: 'theater_comedy',
        ocupacion: 0,
        capacidad: 250,
        estado: 'sin_inscritos',
        color: 'text-gray-400',
        bgColor: 'bg-gray-100'
      },
      {
        id: 4,
        nombre: 'Sala de Conferencias C',
        ubicacion: 'Edificio Administrativo, Piso 4',
        icono: 'meeting_room',
        ocupacion: 0,
        capacidad: 50,
        estado: 'sin_inscritos',
        color: 'text-gray-400',
        bgColor: 'bg-gray-100'
      }
    ];
  });
  
  const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('admin_escenarios_stats');
    if (cached) return JSON.parse(cached);
    return { total: 4, cuposTotales: 420, inscritosHoy: 0 };
  });

  const user = getCurrentUser();
  const { toasts, showToast, removeToast } = useToast();

  // Cargar datos reales desde la API
  const cargarDatosReales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/escenarios/ocupacion', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.escenarios) {
        // Mapa de inscritos por nombre de escenario
        const ocupacionMap = {};
        (data.ocupacion || []).forEach(o => {
          ocupacionMap[o.escenario] = parseInt(o.inscritos) || 0;
        });

        const iconos = ['school', 'science', 'theater_comedy', 'meeting_room', 'laptop'];

        // Construir escenarios desde la BD (fuente de verdad)
        const escenariosActualizados = data.escenarios.map((e, index) => {
          const ocupacionReal = ocupacionMap[e.nombre] || 0;
          const capacidad = parseInt(e.capacidad) || 50;
          const porcentaje = (ocupacionReal / capacidad) * 100;

          let estado = 'sin_inscritos';
          let color = 'text-gray-400';
          let bgColor = 'bg-gray-100';

          if (ocupacionReal >= capacidad) {
            estado = 'lleno';
            color = 'text-[#C62828]';
            bgColor = 'bg-[#FFEBEE]';
          } else if (porcentaje >= 80) {
            estado = 'casi_lleno';
            color = 'text-[#E65100]';
            bgColor = 'bg-[#FFF8E1]';
          } else if (ocupacionReal > 0) {
            estado = 'disponible';
            color = 'text-[#2E7D32]';
            bgColor = 'bg-[#E8F5E9]';
          }

          return {
            id: index + 1,
            nombre: e.nombre,
            ubicacion: e.ubicacion || '',
            icono: iconos[index % iconos.length],
            ocupacion: ocupacionReal,
            capacidad,
            estado,
            color,
            bgColor,
          };
        });

        setEscenarios(escenariosActualizados);

        const totalInscritos = escenariosActualizados.reduce((sum, e) => sum + e.ocupacion, 0);
        const cuposTotales = escenariosActualizados.reduce((sum, e) => sum + e.capacidad, 0);

        const nuevosStats = {
          total: escenariosActualizados.length,
          cuposTotales,
          inscritosHoy: totalInscritos,
        };

        setStats(nuevosStats);
        localStorage.setItem('admin_escenarios_cache', JSON.stringify(escenariosActualizados));
        localStorage.setItem('admin_escenarios_stats', JSON.stringify(nuevosStats));
      }
    } catch (error) {
      console.error('Error cargando ocupación:', error);
    } finally {
      setLoading(false);
    }
  };

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
    cargarDatosReales();
  }, []);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);

  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  const getEstadoBadge = (estado, ocupacion, capacidad) => {
    const porcentaje = (ocupacion / capacidad) * 100;

    if (estado === 'lleno' || ocupacion === capacidad) {
      return {
        texto: 'CUPO LLENO',
        bgColor: 'bg-[#C62828]',
        textColor: 'text-white'
      };
    } else if (porcentaje >= 80) {
      return {
        texto: 'Casi lleno',
        bgColor: 'bg-[#FFF8E1]',
        textColor: 'text-[#E65100]'
      };
    } else if (ocupacion === 0) {
      return {
        texto: 'Sin Inscritos',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-400'
      };
    } else {
      return {
        texto: 'Disponible',
        bgColor: 'bg-[#E8F5E9]',
        textColor: 'text-[#2E7D32]'
      };
    }
  };

  const handleCrearEscenario = async (e) => {
    e.preventDefault();
    if (!nuevoForm.nombre.trim()) { showToast('El nombre del escenario es obligatorio', 'error'); return; }
    if (!nuevoForm.capacidad) { showToast('La capacidad es obligatoria', 'error'); return; }
    if (Number(nuevoForm.capacidad) < 1) { showToast('La capacidad debe ser mayor a 0', 'error'); return; }
    const nombreDuplicado = escenarios.some(e => e.nombre.trim().toLowerCase() === nuevoForm.nombre.trim().toLowerCase());
    if (nombreDuplicado) { showToast('Ya existe un escenario con ese nombre', 'error'); return; }
    setNuevoLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/escenarios/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(nuevoForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowNuevoModal(false);
        setNuevoForm({ nombre: '', ubicacion: '', descripcion: '', capacidad: '' });
        await cargarDatosReales();
      } else {
        showToast(data.error || 'Error al crear el escenario', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setNuevoLoading(false);
    }
  };

  const handleEliminarEscenario = async () => {
    if (!escenarioAEliminar) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/escenarios/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: escenarioAEliminar.nombre })
      });
      const data = await response.json();
      if (data.success) {
        setShowConfirmDelete(false);
        setEscenarioAEliminar(null);
        await cargarDatosReales();
      } else {
        showToast(data.error || 'Error al eliminar', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  const openEditModal = (escenario) => {
    setSelectedEscenario(escenario);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedEscenario(null);
  };

  const handleUpdateCapacidad = (id, nuevaCapacidad, status) => {
    const nuevosEscenarios = escenarios.map(e => {
      if (e.id === id) {
        const nuevaOcupacion = Math.min(e.ocupacion, nuevaCapacidad);
        const nuevoPorcentaje = (nuevaOcupacion / nuevaCapacidad) * 100;

        let nuevoEstado = e.estado;
        if (status === 'closed') {
          nuevoEstado = 'lleno';
        } else if (nuevaOcupacion === nuevaCapacidad) {
          nuevoEstado = 'lleno';
        } else if (nuevoPorcentaje >= 80) {
          nuevoEstado = 'casi_lleno';
        } else if (nuevaOcupacion === 0) {
          nuevoEstado = 'sin_inscritos';
        } else {
          nuevoEstado = 'disponible';
        }

        let nuevoColor = 'text-[#2E7D32]';
        let nuevoBgColor = 'bg-[#E8F5E9]';
        if (nuevoEstado === 'lleno') {
          nuevoColor = 'text-[#C62828]';
          nuevoBgColor = 'bg-[#FFEBEE]';
        } else if (nuevoEstado === 'casi_lleno') {
          nuevoColor = 'text-[#E65100]';
          nuevoBgColor = 'bg-[#FFF8E1]';
        } else if (nuevoEstado === 'sin_inscritos') {
          nuevoColor = 'text-gray-400';
          nuevoBgColor = 'bg-gray-100';
        }

        return { 
          ...e, 
          capacidad: nuevaCapacidad, 
          ocupacion: nuevaOcupacion, 
          estado: nuevoEstado,
          color: nuevoColor,
          bgColor: nuevoBgColor
        };
      }
      return e;
    });
    
    setEscenarios(nuevosEscenarios);
    
    // Recalcular stats
    const totalInscritos = nuevosEscenarios.reduce((sum, e) => sum + e.ocupacion, 0);
    const cuposTotales = nuevosEscenarios.reduce((sum, e) => sum + e.capacidad, 0);
    
    setStats({
      total: nuevosEscenarios.length,
      cuposTotales: cuposTotales,
      inscritosHoy: totalInscritos
    });
    
    localStorage.setItem('admin_escenarios_cache', JSON.stringify(nuevosEscenarios));
    localStorage.setItem('admin_escenarios_stats', JSON.stringify({
      total: nuevosEscenarios.length,
      cuposTotales: cuposTotales,
      inscritosHoy: totalInscritos
    }));
    
    showToast('Capacidad actualizada exitosamente');
  };


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
        w-[260px] fixed left-0 top-0 bottom-0 flex flex-col z-50
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

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <button onClick={() => { setCurrentPage('admin'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
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
          <button className="nav-item flex items-center gap-3 py-3 px-4 bg-white/10 dark:bg-white/5 text-white font-semibold rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">meeting_room</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Escenarios</span>
          </button>
          <button onClick={() => { setCurrentPage('adminReportes'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Reportes</span>
          </button>
          <button onClick={() => { setCurrentPage('adminQR'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">qr_code_2</span>
            <span className="text-sm tracking-wide whitespace-nowrap">QR Asistencias</span>
          </button>
          <button onClick={() => { setCurrentPage('adminLogos'); setSidebarOpen(false); }} className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">image</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Logos</span>
          </button>
        </nav>

        <div className="px-4 pb-8 flex-shrink-0">
          <div className="border-t border-white/10 dark:border-white/5 pt-4">
            <button onClick={handleLogoutClick} className="w-full nav-item flex items-center gap-3 py-3 px-4 text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white/80 rounded-lg text-left">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-sm tracking-wide whitespace-nowrap">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="mainContent" className={`lg:ml-[260px] min-h-screen transition-all duration-300 ${showLogoutModal || showEditModal || showNuevoModal || showConfirmDelete ? 'filter blur-sm pointer-events-none' : ''}`}>
        {/* Header - Responsive */}
        <header className={`w-full h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-b border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            {/* Botón hamburguesa móvil */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg lg:text-xl font-extrabold tracking-tight text-[#1B5E20] dark:text-[#81C784]">Gestión de Escenarios</h2>
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

        <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
          {/* Breadcrumb + Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl lg:text-4xl font-extrabold text-[#1a1c1c] dark:text-gray-100 tracking-tight leading-tight">Gestión de Escenarios<br />y Cupos</h2>
              <p className={`text-sm mt-3 max-w-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Supervise la disponibilidad de espacios físicos y virtuales para la 12va Jornada Académica. Ajuste límites de aforo en tiempo real.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
<button
                onClick={() => setShowNuevoModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#1B5E20] dark:bg-[#2E7D32] text-white font-bold text-sm hover:bg-[#2E7D32] dark:hover:bg-[#43A047] transition-all active:scale-95 shadow-lg shadow-green-900/20 flex items-center gap-2 whitespace-nowrap">
                <span className="material-symbols-outlined text-sm">add_location</span>
                Nuevo Escenario
              </button>
            </div>
          </div>

          {/* Scenarios Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {escenarios.map((escenario) => {
              const porcentaje = (escenario.ocupacion / escenario.capacidad) * 100;
              const badge = getEstadoBadge(escenario.estado, escenario.ocupacion, escenario.capacidad);
              const isFull = escenario.ocupacion === escenario.capacidad;

              return (
                <div key={escenario.id} className={`scenario-card rounded-2xl p-6 shadow-sm border relative hover:shadow-md transition-all duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
                  {isFull && (
                    <div className="absolute top-0 right-0">
                      <span className="px-3 py-1 bg-[#C62828] text-white text-[9px] font-black uppercase tracking-tighter rounded-bl-xl">
                        CUPO LLENO
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-5">
                    <div className={`w-11 h-11 ${escenario.bgColor} rounded-xl flex items-center justify-center ${escenario.color}`}>
                      <span className="material-symbols-outlined text-2xl">{escenario.icono}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === escenario.id ? null : escenario.id)}
                        className={`transition-colors rounded-lg p-1 ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                      {openMenuId === escenario.id && (
                        <div
                          className={`absolute right-0 top-9 z-20 w-44 rounded-xl shadow-xl border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}
                          onMouseLeave={() => setOpenMenuId(null)}
                        >
                          <button
                            onClick={() => { openEditModal(escenario); setOpenMenuId(null); }}
                            className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span className="material-symbols-outlined text-sm text-[#2E7D32]">edit</span>
                            Editar cupo
                          </button>
                          <div className={`h-px mx-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                          <button
                            onClick={() => { setEscenarioAEliminar(escenario); setShowConfirmDelete(true); setOpenMenuId(null); }}
                            className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-[#C62828] hover:bg-red-50'}`}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className={`text-lg font-bold mb-5 ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>{escenario.nombre}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ocupación</span>
                      <span className={`font-bold ${isFull ? 'text-[#C62828]' : darkMode ? 'text-gray-200' : 'text-[#1a1c1c]'}`}>
                        {escenario.ocupacion} / {escenario.capacidad}
                      </span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div
                        className="progress-bar h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${porcentaje}%`,
                          backgroundColor: isFull ? '#C62828' : '#2E7D32'
                        }}
                      ></div>
                    </div>
                    <div className={`flex items-center pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                      <span className={`px-3 py-1 ${badge.bgColor} ${badge.textColor} text-[10px] font-bold uppercase tracking-tighter rounded-full flex items-center gap-1.5`}>
                        {badge.texto === 'Disponible' && <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>}
                        {badge.texto}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Bottom Stats Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            <div className={`stat-card p-6 rounded-2xl shadow-sm border relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="relative z-10">
                <span className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total de Escenarios</span>
                <div className={`text-4xl font-extrabold mt-1 ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>{stats.total}</div>
              </div>
              <span className={`material-symbols-outlined absolute -right-4 -bottom-4 text-[100px] ${darkMode ? 'text-gray-800' : 'text-gray-100'}`}>apartment</span>
            </div>
            <div className={`stat-card p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <span className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Cupos Totales</span>
              <div className={`text-4xl font-extrabold mt-1 ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>{stats.cuposTotales}</div>
            </div>
            <div className={`stat-card p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
              <span className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Inscritos Totales</span>
              <div className="text-4xl font-extrabold text-[#2E7D32] mt-1">{stats.inscritosHoy}</div>
              <div className="flex gap-1 mt-3">
                <div className="h-1 flex-1 bg-[#2E7D32] rounded-full"></div>
                <div className="h-1 flex-1 bg-[#2E7D32]/20 rounded-full"></div>
                <div className="h-1 flex-1 bg-[#2E7D32]/20 rounded-full"></div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Modal de Editar Cupo */}
      <ModalEditarCupo 
        isOpen={showEditModal}
        onClose={closeEditModal}
        escenario={selectedEscenario}
        onSave={handleUpdateCapacidad}
      />

      {/* Modal Nuevo Escenario */}
      {showNuevoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={() => setShowNuevoModal(false)}>
          <div
            className={`rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden animate-modal-pop transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Barra superior verde */}
            <div className="h-1.5 w-full bg-[#2E7D32]" />

            <div className="p-6 lg:p-8">
              {/* Encabezado */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E8F5E9] dark:bg-[#1B5E20]/40 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#2E7D32] dark:text-[#66BB6A]">add_location</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>Nuevo Escenario</h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Complete los datos del espacio</p>
                  </div>
                </div>
                <button onClick={() => setShowNuevoModal(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCrearEscenario} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Nombre del Escenario <span className="text-[#C62828]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Auditorio Central"
                    value={nuevoForm.nombre}
                    onChange={e => setNuevoForm(f => ({ ...f, nombre: e.target.value }))}
                    className={`w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-[#1a1c1c] placeholder-gray-400'}`}
                  />
                </div>

                {/* Ubicación */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ubicación</label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>location_on</span>
                    <input
                      type="text"
                      placeholder="Ej. Edificio Central, Piso 1"
                      value={nuevoForm.ubicacion}
                      onChange={e => setNuevoForm(f => ({ ...f, ubicacion: e.target.value }))}
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none border transition-all focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-[#1a1c1c] placeholder-gray-400'}`}
                    />
                  </div>
                </div>

                {/* Capacidad */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Cupo Máximo <span className="text-[#C62828]">*</span>
                  </label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>group</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ej. 100"
                      value={nuevoForm.capacidad}
                      onChange={e => setNuevoForm(f => ({ ...f, capacidad: e.target.value }))}
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none border transition-all focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-[#1a1c1c] placeholder-gray-400'}`}
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Descripción</label>
                  <textarea
                    rows={3}
                    placeholder="Equipamiento, condiciones del espacio..."
                    value={nuevoForm.descripcion}
                    onChange={e => setNuevoForm(f => ({ ...f, descripcion: e.target.value }))}
                    className={`w-full rounded-xl px-4 py-3 text-sm outline-none border transition-all resize-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-[#1a1c1c] placeholder-gray-400'}`}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNuevoModal(false)}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={nuevoLoading}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-[#1B5E20] hover:bg-[#2E7D32] shadow-lg shadow-green-900/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {nuevoLoading ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        Guardar Escenario
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className={`px-8 py-3 flex justify-center transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>AgendaUES · Gestión de Escenarios</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {showConfirmDelete && escenarioAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={() => setShowConfirmDelete(false)}>
          <div
            className={`rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 overflow-hidden animate-modal-pop ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-[#C62828]" />
            <div className="p-6 lg:p-8 flex flex-col items-center text-center">
              <div className="mb-5 w-14 h-14 rounded-2xl bg-[#FFEBEE] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">delete</span>
              </div>
              <h3 className={`text-lg font-extrabold tracking-tight mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Eliminar escenario?</h3>
              <p className={`text-sm leading-relaxed mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Estás a punto de eliminar
              </p>
              <p className={`text-sm font-bold mb-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                "{escenarioAEliminar.nombre}"
              </p>
              <p className={`text-xs mb-7 max-w-[280px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Esta acción lo desactivará del sistema. Las sesiones existentes no se verán afectadas.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all active:scale-95 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarEscenario}
                  className="py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#C62828] hover:bg-[#B71C1C] shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className={`px-8 py-3 flex justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>AgendaUES · Gestión de Escenarios</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cierre de Sesión */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={handleCancelLogout}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 overflow-hidden animate-modal-pop transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-6 lg:p-10 flex flex-col items-center text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span>
              </div>
              <h3 className={`text-xl font-extrabold tracking-tight mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Cerrar sesión?</h3>
              <p className={`text-sm leading-relaxed mb-8 max-w-[280px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estás a punto de salir del Panel de Administración. ¿Deseas continuar?</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={handleCancelLogout} className={`py-3 px-6 rounded-lg font-semibold transition-colors active:scale-95 ${darkMode ? 'text-[#66BB6A] bg-gray-700 hover:bg-gray-600' : 'text-[#2E7D32] bg-gray-100 hover:bg-gray-200'}`}>
                  Cancelar
                </button>
                <button onClick={handleConfirmLogout} className="py-3 px-6 rounded-lg font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C] shadow-lg shadow-red-500/20 transition-all active:scale-95">
                  Cerrar Sesión
                </button>
              </div>
            </div>
            <div className={`px-10 py-3 flex justify-center transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            </div>
          </div>
        </div>
      )}

      <AdminToast toasts={toasts} removeToast={removeToast} darkMode={darkMode} />
      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-pop { animation: modal-pop 0.3s ease-out; }
        .nav-item { transition: all 0.2s ease; }
        .nav-item:hover { background-color: rgba(255,255,255,0.08); }
        .scenario-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .scenario-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
        .progress-bar { transition: width 0.5s ease; }
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #1e293b; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
};

export default AdminEscenarios;