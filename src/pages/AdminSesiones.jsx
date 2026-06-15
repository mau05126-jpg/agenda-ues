// src/pages/AdminSesiones.jsx
import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { getCurrentUser, logoutUser } from '../services/authService';
import AdminToast, { useToast } from '../components/AdminToast';

const AdminSesiones = ({ setCurrentPage }) => {
  const { sesiones, actualizarSesion, eliminarSesion, refreshData } = useAdmin();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('agendaDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [stats, setStats] = useState({
    total: sesiones.length,
    ponentes: new Set(sesiones.map(s => s.ponente)).size
  });
  const [editFormData, setEditFormData] = useState({
    id: null,
    nombre: '',
    tipo: '',
    ponente: '',
    fecha: '',
    hora: '',
    escenario: '',
    descripcion: ''
  });
  const [editFotoPonente, setEditFotoPonente] = useState(null);
  const [editFotoPonentePrev, setEditFotoPonentePrev] = useState(null);

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
      return;
    }
    refreshData();
  }, []);

  // Actualizar stats cuando cambien las sesiones
  useEffect(() => {
    setStats({
      total: sesiones.length,
      ponentes: new Set(sesiones.map(s => s.ponente)).size
    });
  }, [sesiones]);

  const getColorTipo = (tipo) => {
    if (tipo === 'Taller Práctico') return 'bg-blue-50 text-blue-600';
    if (tipo === 'Ponencia') return 'bg-purple-50 text-purple-600';
    if (tipo === 'Keynote') return 'bg-amber-50 text-amber-600';
    return 'bg-[#E8F5E9] text-[#2E7D32]';
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  // Ver detalles
  const handleView = (sesion) => {
    setSelectedSesion(sesion);
    setShowViewModal(true);
  };

  // Editar - con datos precargados
  const handleEdit = (sesion) => {
    setSelectedSesion(sesion);
    let fechaFormateada = '';
    if (sesion.fechaOriginal) {
      const fecha = new Date(sesion.fechaOriginal);
      fechaFormateada = fecha.toISOString().split('T')[0];
    }
    setEditFormData({
      id: sesion.id,
      nombre: sesion.nombre,
      tipo: sesion.tipo,
      ponente: sesion.ponente,
      fecha: fechaFormateada,
      hora: sesion.hora,
      escenario: sesion.escenario,
      descripcion: sesion.descripcion
    });
    setEditFotoPonente(null);
    setEditFotoPonentePrev(sesion.imagen_ponente || null);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFotoPonente(file);
      setEditFotoPonentePrev(URL.createObjectURL(file));
    }
  };

  // Guardar cambios de edición
  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;
      if (editFotoPonente) {
        const formData = new FormData();
        formData.append('titulo', editFormData.nombre);
        formData.append('categoria', editFormData.tipo);
        formData.append('ponente', editFormData.ponente);
        formData.append('fecha', editFormData.fecha);
        formData.append('hora', editFormData.hora);
        formData.append('escenario', editFormData.escenario);
        formData.append('descripcion', editFormData.descripcion);
        formData.append('imagenPonente', editFotoPonente);
        response = await fetch(`/api/sesiones/actualizar?id=${selectedSesion.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      } else {
        response = await fetch(`/api/sesiones/actualizar?id=${selectedSesion.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            titulo: editFormData.nombre,
            categoria: editFormData.tipo,
            ponente: editFormData.ponente,
            fecha: editFormData.fecha,
            hora: editFormData.hora,
            escenario: editFormData.escenario,
            descripcion: editFormData.descripcion
          })
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        // Formatear fecha para mostrar
        let fechaFormateada = selectedSesion.fecha;
        if (editFormData.fecha) {
          const fecha = new Date(editFormData.fecha);
          fechaFormateada = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        
        // Crear sesión actualizada
        const sesionActualizada = {
          ...selectedSesion,
          nombre: editFormData.nombre,
          tipo: editFormData.tipo,
          colorTipo: getColorTipo(editFormData.tipo),
          ponente: editFormData.ponente,
          ponenteIniciales: editFormData.ponente
            ? editFormData.ponente.charAt(0) + (editFormData.ponente.charAt(1) || '')
            : '??',
          fecha: fechaFormateada,
          fechaOriginal: editFormData.fecha,
          hora: editFormData.hora,
          escenario: editFormData.escenario,
          descripcion: editFormData.descripcion,
          imagen_ponente: result.imagen_ponente || selectedSesion.imagen_ponente
        };
        
        // Actualizar en el contexto (esto actualiza stats automáticamente)
        actualizarSesion(sesionActualizada);
        
        showToast('Sesión actualizada exitosamente');
        setShowEditModal(false);
      } else {
        showToast(result.error || 'Error al actualizar la sesión', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error de conexión. Intenta nuevamente.', 'error');
    }
  }

  // Eliminar con modal
  const handleDeleteClick = (sesion) => {
    setSelectedSesion(sesion);
    setShowDeleteModal(true);
  };

  // Confirmar eliminar
  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sesiones/eliminar?id=${selectedSesion.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Eliminar del contexto (esto actualiza stats automáticamente)
        eliminarSesion(selectedSesion.id);
        showToast('Sesión eliminada exitosamente');
        setShowDeleteModal(false);
      } else {
        showToast(result.error || 'Error al eliminar la sesión', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error de conexión. Intenta nuevamente.', 'error');
    }
  };

  const filteredSesiones = sesiones.filter(sesion =>
    sesion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sesion.ponente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sesion.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tipoOptions = ['Conferencia', 'Taller Práctico', 'Ponencia', 'Keynote'];
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
          <button className="nav-item flex items-center gap-3 py-3 px-4 bg-white/10 dark:bg-white/5 text-white font-semibold rounded-lg w-full text-left">
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
      <main id="mainContent" className={`lg:ml-[260px] min-h-screen transition-all duration-300 ${(showLogoutModal || showEditModal || showDeleteModal || showViewModal) ? 'filter blur-sm pointer-events-none' : ''}`}>
        <header className={`w-full h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-b border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            {/* Botón hamburguesa móvil */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg lg:text-xl font-extrabold tracking-tight text-[#1B5E20] dark:text-[#81C784]">Resumen General</h2>
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

        <div className="p-4 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-extrabold text-[#1a1c1c] dark:text-gray-100 tracking-tight">
                Gestión de la 12va Jornada Académica y Cultural 2025
              </h2>
            </div>
            <div className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border shadow-sm ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="w-8 h-8 bg-[#1B5E20] dark:bg-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold text-xs">
                {user?.nombre?.charAt(0) || 'A'}
              </div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-[#212121]'}`}>{user?.nombre}</span>
            </div>
          </div>

          {/* Stats Cards Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div className={`p-4 lg:p-5 rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <span className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Sesiones</span>
              <span className={`text-4xl font-extrabold ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>{stats.total}</span>
              <span className={`material-symbols-outlined absolute -right-1 -bottom-1 text-7xl ${darkMode ? 'text-gray-800' : 'text-gray-100'}`}>event_note</span>
            </div>
            <div className={`p-4 lg:p-5 rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <span className={`text-[11px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ponentes Activos</span>
              <span className="text-4xl font-extrabold text-[#2E7D32]">{stats.ponentes}</span>
              <span className={`material-symbols-outlined absolute -right-1 -bottom-1 text-7xl ${darkMode ? 'text-gray-800' : 'text-gray-100'}`}>person_celebrate</span>
            </div>
            <div className={`sm:col-span-2 p-4 lg:p-5 rounded-xl shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <span className={`text-[11px] font-medium uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Búsqueda Rápida</span>
              <div className="relative">
                <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>search</span>
                <input
                  className={`w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#2E7D32] outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#2E7D32]' : 'bg-gray-50 border border-gray-200 focus:border-[#2E7D32]'}`}
                  placeholder="Filtrar por nombre, ponente o tipo..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Table Container */}
          <section className={`rounded-xl shadow-sm overflow-hidden border transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>#</th>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tipo</th>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Nombre de la sesión</th>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ponente</th>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fecha & Hora</th>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Escenario</th>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Público</th>
                    <th className={`px-6 py-4 text-[11px] font-semibold uppercase tracking-widest text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-50'}`}>
                  {filteredSesiones.length === 0 ? (
                    <tr>
                      <td colSpan="8" className={`px-6 py-12 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        No hay sesiones registradas
                      </td>
                    </tr>
                  ) : (
                    filteredSesiones.map((sesion, idx) => (
                      <tr key={sesion.id} className={`table-row group transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-6 py-6 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{String(idx + 1).padStart(2, '0')}</td>
                        <td className="px-6 py-6">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${sesion.colorTipo}`}>
                            {sesion.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <p className={`text-sm font-bold group-hover:text-[#2E7D32] transition-colors leading-tight ${darkMode ? 'text-gray-200' : 'text-[#1a1c1c]'}`}>
                            {sesion.nombre}
                          </p>
                          <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Eje: {sesion.eje}</p>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center text-xs font-bold text-white">
                              {sesion.ponenteIniciales}
                            </div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{sesion.ponente}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-[#1a1c1c]'}`}>{sesion.fecha}</div>
                          <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sesion.hora}</div>
                        </td>
                        <td className={`px-6 py-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{sesion.escenario}</td>
                        <td className={`px-6 py-6 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{sesion.publico}</td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleView(sesion)} className={`p-2 rounded-lg transition-all ${darkMode ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/40' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`} title="Ver"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>visibility</span></button>
                            <button onClick={() => handleEdit(sesion)} className={`p-2 rounded-lg transition-all ${darkMode ? 'text-[#66BB6A] bg-[#1B5E20]/20 hover:bg-[#1B5E20]/40' : 'text-[#2E7D32] bg-[#E8F5E9] hover:bg-[#C8E6C9]'}`} title="Editar"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>edit</span></button>
                            <button onClick={() => handleDeleteClick(sesion)} className={`p-2 rounded-lg transition-all ${darkMode ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40' : 'text-[#C62828] bg-[#FFEBEE] hover:bg-[#FFCDD2]'}`} title="Eliminar"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={`px-6 py-4 border-t flex items-center justify-between transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Mostrando {filteredSesiones.length} de {stats.total} sesiones</span>
              <div className="flex gap-2">
                <button className={`p-1.5 disabled:opacity-30 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} disabled><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                <button className="w-7 h-7 rounded-lg bg-green-800 text-white text-xs">1</button>
                <button className={`p-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><span className="material-symbols-outlined text-sm">chevron_right</span></button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Floating Action Button */}
      <button onClick={() => setCurrentPage('adminRegistrarSesion')} className="fab fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-green-800 text-white rounded-2xl shadow-lg flex items-center justify-center z-20 hover:scale-105 transition-transform">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Modal de Visualización — fuera de <main> para no heredar el blur */}
      {showViewModal && selectedSesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)}>
          <div className={`rounded-2xl max-w-2xl w-full mx-4 overflow-hidden shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#2E7D32] text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>event_note</span>
                </div>
                <div>
                  <h3 className={`text-lg font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Detalles de la Sesión</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Información completa</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className={`border-b pb-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Título</label><p className={`text-lg font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{selectedSesion.nombre}</p></div>
              <div className="grid grid-cols-2 gap-4"><div><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tipo</label><p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedSesion.tipo}</p></div><div><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Eje</label><p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedSesion.eje}</p></div></div>
              <div><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ponente</label><div className="flex items-center gap-3 mt-1"><div className="w-10 h-10 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold">{selectedSesion.ponenteIniciales}</div><span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedSesion.ponente}</span></div></div>
              <div className="grid grid-cols-3 gap-4"><div><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fecha</label><p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedSesion.fecha}</p></div><div><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Hora</label><p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedSesion.hora}</p></div><div><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Escenario</label><p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedSesion.escenario}</p></div></div>
              <div><label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Descripción</label><p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedSesion.descripcion}</p></div>
            </div>
            <div className={`border-t px-6 py-4 flex justify-end gap-3 transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <button onClick={() => setShowViewModal(false)} className={`px-4 py-2 border rounded-lg transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'text-gray-700 border-gray-200 hover:bg-gray-100'}`}>Cerrar</button>
              <button onClick={() => { setShowViewModal(false); handleEdit(selectedSesion); }} className="px-4 py-2 bg-[#1B5E20] text-white rounded-lg hover:bg-[#2E7D32] transition-colors">Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición — fuera de <main> para no heredar el blur */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className={`rounded-2xl max-w-md w-full mx-4 overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="px-6 pt-6 pb-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#2E7D32] text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>edit_note</span>
              </div>
              <div>
                <h3 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Editar Sesión</h3>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Modifica los datos de la sesión</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className={`ml-auto p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}>
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className={`mx-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
            <div className="px-6 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Título</label>
                <input type="text" name="nombre" value={editFormData.nombre} onChange={handleEditChange} className={`w-full mt-1.5 px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-[#2E7D32]' : 'border-gray-200 focus:border-[#2E7D32]'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tipo</label>
                  <select name="tipo" value={editFormData.tipo} onChange={handleEditChange} className={`w-full mt-1.5 px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white focus:border-[#2E7D32]' : 'border-gray-200 focus:border-[#2E7D32]'}`}>
                    {tipoOptions.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ponente</label>
                  <input type="text" name="ponente" value={editFormData.ponente} onChange={handleEditChange} className={`w-full mt-1.5 px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-[#2E7D32]' : 'border-gray-200 focus:border-[#2E7D32]'}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha</label>
                  <input type="date" name="fecha" value={editFormData.fecha} onChange={handleEditChange} className={`w-full mt-1.5 px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white focus:border-[#2E7D32]' : 'border-gray-200 focus:border-[#2E7D32]'}`} />
                </div>
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hora</label>
                  <input type="time" name="hora" value={editFormData.hora} onChange={handleEditChange} className={`w-full mt-1.5 px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white focus:border-[#2E7D32]' : 'border-gray-200 focus:border-[#2E7D32]'}`} />
                </div>
              </div>
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Escenario</label>
                <select name="escenario" value={editFormData.escenario} onChange={handleEditChange} className={`w-full mt-1.5 px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white focus:border-[#2E7D32]' : 'border-gray-200 focus:border-[#2E7D32]'}`}>
                  {escenarioOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Foto del Ponente</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <label className="cursor-pointer shrink-0">
                    <div className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${darkMode ? 'border-gray-600 bg-gray-800 hover:border-[#66BB6A]' : 'border-gray-300 bg-gray-50 hover:border-[#2E7D32]'}`}>
                      {editFotoPonentePrev ? (
                        <img src={editFotoPonentePrev} alt="Ponente" className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-symbols-outlined text-2xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>add_a_photo</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleEditFotoChange} />
                  </label>
                  <div>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{editFotoPonente ? editFotoPonente.name : editFotoPonentePrev ? 'Foto actual' : 'Sin foto'}</p>
                    <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Haz clic en la imagen para cambiarla</p>
                  </div>
                </div>
              </div>
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Descripción</label>
                <textarea name="descripcion" value={editFormData.descripcion} onChange={handleEditChange} rows="2" className={`w-full mt-1.5 px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all resize-none ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-[#2E7D32]' : 'border-gray-200 focus:border-[#2E7D32]'}`}></textarea>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 transition-colors duration-300 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <button onClick={() => setShowEditModal(false)} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={handleSaveEdit} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#1B5E20] hover:bg-[#2E7D32] shadow-lg shadow-green-900/20 transition-all active:scale-95">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación — fuera de <main> para no heredar el blur */}
      {showDeleteModal && selectedSesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className={`rounded-2xl max-w-[420px] w-full mx-4 overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#C62828]"></div>
            <div className="p-6 lg:p-8 text-center">
              <div className="mb-5 w-14 h-14 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[#C62828] text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>delete</span>
              </div>
              <h3 className={`text-xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Eliminar sesión?</h3>
              <p className={`text-sm leading-relaxed mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estás a punto de eliminar</p>
              <p className={`text-sm font-bold mb-6 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>"{selectedSesion.nombre}"</p>
              <p className={`text-xs mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Esta acción no se puede deshacer.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowDeleteModal(false)} className={`py-3 px-6 rounded-xl font-semibold text-sm transition-colors active:scale-95 ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                <button onClick={handleConfirmDelete} className="py-3 px-6 rounded-xl font-semibold text-sm text-white bg-[#C62828] hover:bg-[#B71C1C] shadow-lg shadow-red-500/20 transition-all active:scale-95">Eliminar</button>
              </div>
            </div>
            <div className={`px-8 py-3 flex justify-center transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cierre de Sesión */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={handleCancelLogout}>
          <div className={`rounded-2xl max-w-[420px] mx-4 overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-6 lg:p-10 text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span>
              </div>
              <h3 className={`text-xl font-extrabold tracking-tight mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Cerrar sesión?</h3>
              <p className={`text-sm leading-relaxed mb-8 max-w-[280px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Estás a punto de salir del Panel de Administración. ¿Deseas continuar?
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={handleCancelLogout}
                  className={`py-3 px-6 rounded-lg font-semibold transition-colors active:scale-95 ${darkMode ? 'text-[#66BB6A] bg-gray-700 hover:bg-gray-600' : 'text-[#2E7D32] bg-gray-100 hover:bg-gray-200'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="py-3 px-6 rounded-lg font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C] shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
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

export default AdminSesiones;