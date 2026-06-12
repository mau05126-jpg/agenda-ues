// src/pages/AdminUsuarios.jsx - Optimizado sin spinner, con caché + Modal Agregar Usuario
import { useState, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';
import AdminToast, { useToast } from '../components/AdminToast';

const AdminUsuarios = ({ setCurrentPage }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('agendaDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ========== MODAL AGREGAR USUARIO ==========
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    matricula: '',
    carrera: '',
    semestre: '',
    password: '',
    confirmPassword: '',
    rol: 'estudiante',
    activo: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========== MODAL EDITAR USUARIO ==========
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // ========== MODAL VER USUARIO ==========
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  // ========== MODAL CONFIRMAR ELIMINACIÓN ==========
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Cargar datos desde caché INSTANTÁNEAMENTE
  const [usuarios, setUsuarios] = useState(() => {
    const cached = localStorage.getItem('admin_usuarios_cache');
    return cached ? JSON.parse(cached) : [];
  });

  const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('admin_usuarios_stats');
    return cached ? JSON.parse(cached) : { total: 0, admins: 0, subadmins: 0, estudiantes: 0 };
  });

  const user = getCurrentUser();
  const { toasts, showToast, removeToast } = useToast();

  // ========== PERMISOS POR ROL ==========
  const esAdmin = user?.rol === 'admin';
  const esSubadmin = user?.rol === 'subadmin';
  const puedeCrearAdmin = esAdmin;
  const puedeCrearSubadmin = esAdmin;
  const puedeCrearEstudiante = esAdmin || esSubadmin;
  const puedeEliminar = esAdmin;
  const puedeEditarRol = esAdmin;

  // Roles disponibles según permisos
  const rolesDisponibles = [
    { value: 'estudiante', label: 'Estudiante', disabled: !puedeCrearEstudiante },
    { value: 'subadmin', label: 'Subadministrador', disabled: !puedeCrearSubadmin },
    { value: 'admin', label: 'Administrador', disabled: !puedeCrearAdmin },
  ].filter(r => !r.disabled);

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
    cargarUsuariosActualizados();
  }, []);

  const cargarUsuariosActualizados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.usuarios) {
        const usuariosFormateados = data.usuarios.map(u => ({
          id: u.id,
          nombre: u.nombre_completo,
          email: u.email,
          matricula: u.matricula || '—',
          carrera: u.carrera || '—',
          semestre: u.semestre || '—',
          rol: u.rol,
          estado: u.activo === undefined ? true : u.activo,
          iniciales: u.nombre_completo ? u.nombre_completo.charAt(0) + (u.nombre_completo.charAt(1) || '') : '??',
          fecha_registro: u.fecha_registro
        }));

        setUsuarios(usuariosFormateados);

        const total = usuariosFormateados.length;
        const admins = usuariosFormateados.filter(u => u.rol === 'admin').length;
        const subadmins = usuariosFormateados.filter(u => u.rol === 'subadmin').length;
        const estudiantes = usuariosFormateados.filter(u => u.rol === 'estudiante').length;

        const nuevosStats = { total, admins, subadmins, estudiantes };
        setStats(nuevosStats);

        localStorage.setItem('admin_usuarios_cache', JSON.stringify(usuariosFormateados));
        localStorage.setItem('admin_usuarios_stats', JSON.stringify(nuevosStats));
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  // ========== MODAL AGREGAR USUARIO - FUNCIONES ==========
  const openAddModal = () => {
    setFormData({
      nombre_completo: '',
      email: '',
      matricula: '',
      carrera: '',
      semestre: '',
      password: '',
      confirmPassword: '',
      rol: puedeCrearEstudiante ? 'estudiante' : '',
      activo: true
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const errors = {};

    if (!formData.nombre_completo.trim()) {
      errors.nombre_completo = 'El nombre es obligatorio';
    } else if (formData.nombre_completo.trim().length < 3) {
      errors.nombre_completo = 'Mínimo 3 caracteres';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email no válido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      errors.password = 'Mínimo 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar matrícula solo si es estudiante
    if (formData.rol === 'estudiante') {
      if (!formData.matricula.trim()) {
        errors.matricula = 'La matrícula es obligatoria para estudiantes';
      }
      if (!formData.carrera.trim()) {
        errors.carrera = 'La carrera es obligatoria para estudiantes';
      }
    }

    // Validar permisos de rol
    if (formData.rol === 'admin' && !puedeCrearAdmin) {
      errors.rol = 'No tienes permiso para crear administradores';
    }
    if (formData.rol === 'subadmin' && !puedeCrearSubadmin) {
      errors.rol = 'No tienes permiso para crear subadministradores';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rol: formData.rol,
        activo: formData.activo
      };

      // Solo enviar campos de estudiante si aplica
      if (formData.rol === 'estudiante') {
        payload.matricula = formData.matricula.trim();
        payload.carrera = formData.carrera.trim();
        payload.semestre = formData.semestre.trim() || '1';
      }

      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await cargarUsuariosActualizados();
        closeAddModal();
        showToast('Usuario creado exitosamente');
      } else {
        setFormErrors(prev => ({
          ...prev,
          general: data.message || 'Error al crear usuario'
        }));
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      setFormErrors(prev => ({
        ...prev,
        general: 'Error de conexión. Intenta de nuevo.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);

  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  // ========== VER USUARIO ==========
  const openViewModal = (u) => { setViewTarget(u); setShowViewModal(true); };

  // ========== EDITAR USUARIO ==========
  const openEditModal = (u) => {
    setEditData({
      id: u.id,
      nombre_completo: u.nombre,
      email: u.email,
      matricula: u.matricula !== '—' ? u.matricula : '',
      carrera: u.carrera !== '—' ? u.carrera : '',
      semestre: u.semestre !== '—' ? u.semestre : '',
      rol: u.rol,
      activo: u.estado,
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editData.nombre_completo?.trim()) errors.nombre_completo = 'Obligatorio';
    if (!editData.email?.trim()) errors.email = 'Obligatorio';
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }

    setIsEditing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: editData.id,
          nombre_completo: editData.nombre_completo.trim(),
          email: editData.email.trim(),
          matricula: editData.matricula || null,
          carrera: editData.carrera || null,
          semestre: editData.semestre || null,
          rol: editData.rol,
          activo: editData.activo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await cargarUsuariosActualizados();
        setShowEditModal(false);
      } else {
        setEditErrors({ general: data.error || 'Error al actualizar' });
      }
    } catch (_) {
      setEditErrors({ general: 'Error de conexión' });
    } finally {
      setIsEditing(false);
    }
  };

  // ========== ELIMINAR USUARIO ==========
  const openDeleteModal = (u) => { setDeleteTarget(u); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/usuarios?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        await cargarUsuariosActualizados();
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        const d = await res.json();
        showToast(d.error || 'Error al eliminar', 'error');
      }
    } catch (_) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/usuarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, activo: !estadoActual })
      });

      if (response.ok) {
        cargarUsuariosActualizados();
      } else {
        showToast('Error al actualizar estado', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error de conexión', 'error');
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || (user.rol !== 'admin' && user.rol !== 'subadmin')) {
    setCurrentPage('loginPage');
    return null;
  }

  // Color del rol badge
  const getRolBadgeClass = (rol) => {
    switch(rol) {
      case 'admin': return 'bg-[#1B5E20] text-white';
      case 'subadmin': return 'bg-[#2E7D32] text-white';
      default: return 'bg-[#E8F5E9] text-[#2E7D32]';
    }
  };

  const getRolLabel = (rol) => {
    switch(rol) {
      case 'admin': return 'Admin';
      case 'subadmin': return 'Subadmin';
      default: return 'Estudiante';
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f5f5f5] dark:bg-[#0f172a]">
      {/* Sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
      <main className={`lg:ml-[260px] min-h-screen transition-all duration-300 ${(showLogoutModal || showAddModal || showEditModal || showDeleteModal || showViewModal) ? 'filter blur-sm pointer-events-none' : ''}`}>
        <header className={`w-full h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-b border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg lg:text-xl font-extrabold tracking-tight text-[#1B5E20] dark:text-[#81C784]">Gestión de Usuarios</h2>
            <div className="hidden md:block relative">
              <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>search</span>
              <input className={`pl-10 pr-4 py-2 border-none rounded-full text-sm w-56 focus:ring-2 focus:ring-[#2E7D32] transition-all outline-none ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' : 'bg-gray-100 focus:bg-white'}`} placeholder="Buscar usuarios..." type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
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
                <p className={`text-[10px] uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{user?.rol === 'admin' ? 'Administrador' : 'Subadministrador'}</p>
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
              <h2 className="text-xl lg:text-2xl font-extrabold text-[#1a1c1c] dark:text-gray-100 tracking-tight">Gestión de Usuarios y Roles</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Solo estudiantes activos pueden registrarse en el sistema.</p>
            </div>
            {/* Botón Agregar Usuario - solo si tiene permisos */}
            {(puedeCrearAdmin || puedeCrearSubadmin || puedeCrearEstudiante) && (
              <button 
                onClick={openAddModal}
                className="bg-[#1B5E20] dark:bg-[#2E7D32] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#2E7D32] dark:hover:bg-[#43A047] transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Agregar Usuario
              </button>
            )}
          </div>

          {/* Stats cards - ahora con 4 columnas incluyendo subadmins */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div className={`p-4 lg:p-5 rounded-xl shadow-sm flex flex-col justify-between h-28 border-l-4 border-[#1B5E20] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <span className={`text-[11px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Usuarios</span>
              <span className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.total}</span>
            </div>
            <div className={`p-4 lg:p-5 rounded-xl shadow-sm flex flex-col justify-between h-28 border-l-4 border-[#1B5E20] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <span className={`text-[11px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Administradores</span>
              <span className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.admins}</span>
            </div>
            <div className={`p-4 lg:p-5 rounded-xl shadow-sm flex flex-col justify-between h-28 border-l-4 border-[#2E7D32] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <span className={`text-[11px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Subadmins</span>
              <span className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.subadmins}</span>
            </div>
            <div className={`p-4 lg:p-5 rounded-xl shadow-sm flex flex-col justify-between h-28 border-l-4 border-[#43A047] transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              <span className={`text-[11px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Estudiantes</span>
              <span className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{stats.estudiantes}</span>
            </div>
          </section>

          <div className={`rounded-xl shadow-sm overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <table className="w-full text-left min-w-[900px]">
                <thead className={`transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nombre</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Matrícula</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Carrera</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rol</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Estado</th>
                    <th className={`px-6 py-4 text-xs font-semibold uppercase text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map(u => (
                    <tr key={u.id} className={`border-t transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{u.nombre}</span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{u.matricula}</td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{u.email}</td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{u.carrera}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRolBadgeClass(u.rol)}`}>
                          {getRolLabel(u.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleEstado(u.id, u.estado)}
                          className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${u.estado ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transform transition-all duration-200 ${u.estado ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => openViewModal(u)}
                            title="Ver usuario"
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                          >
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>visibility</span>
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            title="Editar usuario"
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-[#2E7D32] hover:bg-[#E8F5E9]'}`}
                          >
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>edit</span>
                          </button>
                          {puedeEliminar && (
                            <button
                              onClick={() => openDeleteModal(u)}
                              title="Eliminar usuario"
                              className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                            >
                              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsuarios.length === 0 && (
                    <tr><td colSpan="7" className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>No hay usuarios registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ========== MODAL VER USUARIO ========== */}
      {showViewModal && viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)}>
          <div className={`rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className={`sticky top-0 px-6 py-4 flex justify-between items-center border-b transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#2E7D32] text-xl">person</span>
                </div>
                <div>
                  <h3 className={`text-lg font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Detalles del Usuario</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Información completa</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Avatar + nombre */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold text-xl">
                  {viewTarget.iniciales}
                </div>
                <div>
                  <p className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{viewTarget.nombre}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRolBadgeClass(viewTarget.rol)}`}>{getRolLabel(viewTarget.rol)}</span>
                </div>
              </div>
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Correo</label>
                  <p className={`text-sm mt-0.5 break-all ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewTarget.email}</p>
                </div>
                <div>
                  <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Matrícula</label>
                  <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewTarget.matricula}</p>
                </div>
                <div>
                  <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Carrera</label>
                  <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewTarget.carrera}</p>
                </div>
                <div>
                  <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Semestre</label>
                  <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewTarget.semestre}</p>
                </div>
              </div>
              <div>
                <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Estado</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${viewTarget.estado ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewTarget.estado ? 'Activo' : 'Deshabilitado'}</p>
                </div>
              </div>
            </div>
            <div className={`border-t px-6 py-4 flex justify-end gap-3 transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <button onClick={() => setShowViewModal(false)} className={`px-4 py-2 border rounded-lg transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'text-gray-700 border-gray-200 hover:bg-gray-100'}`}>Cerrar</button>
              <button onClick={() => { setShowViewModal(false); openEditModal(viewTarget); }} className="px-4 py-2 bg-[#1B5E20] text-white rounded-lg hover:bg-[#2E7D32] transition-colors">Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL AGREGAR USUARIO ========== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[4px] overflow-y-auto py-8" onClick={closeAddModal}>
          <div 
            className={`rounded-2xl w-full max-w-[520px] mx-4 overflow-hidden shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#2E7D32] text-xl">person_add</span>
                </div>
                <div>
                  <h3 className={`text-lg font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Agregar Usuario</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {esAdmin ? 'Crear admin, subadmin o estudiante' : 'Crear nuevo estudiante'}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Error general */}
              {formErrors.general && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {formErrors.general}
                </div>
              )}

              {/* Nombre completo */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez García"
                  className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } ${formErrors.nombre_completo ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {formErrors.nombre_completo && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.nombre_completo}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ejemplo@umb.edu.mx"
                  className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } ${formErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Rol - solo visible si tiene opciones */}
              {rolesDisponibles.length > 1 && (
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } ${formErrors.rol ? 'border-red-500 focus:ring-red-500' : ''}`}
                  >
                    {rolesDisponibles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {formErrors.rol && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.rol}</p>
                  )}
                </div>
              )}

              {/* Campos de estudiante - condicionales */}
              {formData.rol === 'estudiante' && (
                <div className={`space-y-4 p-4 rounded-lg border border-dashed ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Datos del Estudiante</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Matrícula <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="matricula"
                        value={formData.matricula}
                        onChange={handleInputChange}
                        placeholder="Ej: 13220025"
                        className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        } ${formErrors.matricula ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {formErrors.matricula && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.matricula}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Semestre
                      </label>
                      <input
                        type="text"
                        name="semestre"
                        value={formData.semestre}
                        onChange={handleInputChange}
                        placeholder="Ej: 5"
                        className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Carrera <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="carrera"
                      value={formData.carrera}
                      onChange={handleInputChange}
                      placeholder="Ej: Ingeniería en Sistemas"
                      className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      } ${formErrors.carrera ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {formErrors.carrera && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.carrera}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Contraseña */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Mínimo 6 caracteres"
                    className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    } ${formErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                  )}
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Confirmar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Repite la contraseña"
                    className={`w-full px-4 py-2.5 rounded-lg text-sm border transition-all outline-none focus:ring-2 focus:ring-[#2E7D32] ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    } ${formErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Estado activo */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                  className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${formData.activo ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transform transition-all duration-200 ${formData.activo ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Usuario activo {formData.activo ? '(podrá iniciar sesión)' : '(deshabilitado temporalmente)'}
                </span>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    darkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white bg-[#1B5E20] hover:bg-[#2E7D32] dark:bg-[#2E7D32] dark:hover:bg-[#43A047] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      Crear Usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL EDITAR USUARIO ========== */}
      {showEditModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[4px] overflow-y-auto py-8" onClick={() => setShowEditModal(false)}>
          <div className={`rounded-2xl w-full max-w-[520px] mx-4 overflow-hidden shadow-2xl ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#2E7D32] text-xl">manage_accounts</span>
                </div>
                <div>
                  <h3 className={`text-lg font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Editar Usuario</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{editData.nombre_completo}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {editErrors.general && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{editErrors.general}</div>
              )}

              {/* Nombre */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nombre Completo <span className="text-red-500">*</span></label>
                <input type="text" name="nombre_completo" value={editData.nombre_completo} onChange={handleEditChange}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#2E7D32] ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} ${editErrors.nombre_completo ? 'border-red-500' : ''}`} />
                {editErrors.nombre_completo && <p className="text-red-500 text-xs mt-1">{editErrors.nombre_completo}</p>}
              </div>

              {/* Email */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Correo Electrónico <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={editData.email} onChange={handleEditChange}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#2E7D32] ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} ${editErrors.email ? 'border-red-500' : ''}`} />
                {editErrors.email && <p className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
              </div>

              {/* Matrícula + Semestre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Matrícula</label>
                  <input type="text" name="matricula" value={editData.matricula} onChange={handleEditChange}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#2E7D32] ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Semestre</label>
                  <input type="text" name="semestre" value={editData.semestre} onChange={handleEditChange}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#2E7D32] ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                </div>
              </div>

              {/* Carrera */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Carrera</label>
                <input type="text" name="carrera" value={editData.carrera} onChange={handleEditChange}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#2E7D32] ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
              </div>

              {/* Rol - solo admin puede cambiar */}
              {puedeEditarRol && (
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rol</label>
                  <select name="rol" value={editData.rol} onChange={handleEditChange}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#2E7D32] ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                    <option value="estudiante">Estudiante</option>
                    <option value="subadmin">Subadministrador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}

              {/* Estado */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setEditData(prev => ({ ...prev, activo: !prev.activo }))}
                  className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${editData.activo ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transform transition-all duration-200 ${editData.activo ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {editData.activo ? 'Usuario activo' : 'Usuario deshabilitado'}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                  Cancelar
                </button>
                <button type="submit" disabled={isEditing}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white bg-[#1B5E20] hover:bg-[#2E7D32] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isEditing ? <><span className="material-symbols-outlined text-lg animate-spin">refresh</span>Guardando...</> : <><span className="material-symbols-outlined text-lg">save</span>Guardar Cambios</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL CONFIRMAR ELIMINACIÓN ========== */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[4px]" onClick={() => setShowDeleteModal(false)}>
          <div className={`rounded-2xl w-full max-w-[420px] mx-4 overflow-hidden shadow-2xl ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#C62828]"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-[#C62828] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_remove</span>
              </div>
              <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>¿Eliminar usuario?</h3>
              <p className={`text-sm mb-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{deleteTarget.nombre}</p>
              <p className={`text-xs mb-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Esta acción no se puede deshacer.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className={`py-3 rounded-lg font-semibold transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                  Cancelar
                </button>
                <button onClick={handleConfirmDelete}
                  className="py-3 rounded-lg font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C] transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cierre */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={handleCancelLogout}>
          <div className={`rounded-2xl max-w-[420px] mx-4 overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-6 lg:p-10 text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto"><span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span></div>
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

export default AdminUsuarios;