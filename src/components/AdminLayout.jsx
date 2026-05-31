// src/components/AdminLayout.jsx
import { useState } from 'react';
import { logoutUser } from '../services/authService';

const AdminLayout = ({ children, currentPage, setCurrentPage, user }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutModal(false);
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Sidebar FIJO - nunca se vuelve a renderizar */}
      <aside className="h-dvh w-[260px] fixed left-0 top-0 bg-[#1B5E20] flex flex-col z-30">
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

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <button onClick={() => setCurrentPage('admin')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${currentPage === 'admin' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Panel de Administración</span>
          </button>
          <button onClick={() => setCurrentPage('adminSesiones')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${currentPage === 'adminSesiones' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Sesiones</span>
          </button>
          <button onClick={() => setCurrentPage('adminUsuarios')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${currentPage === 'adminUsuarios' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">group</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Usuarios</span>
          </button>
          <button onClick={() => setCurrentPage('adminEscenarios')} className={`nav-item flex items-center gap-3 py-3 px-4 rounded-lg w-full text-left ${currentPage === 'adminEscenarios' ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-lg">meeting_room</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Escenarios</span>
          </button>
          <button className="nav-item flex items-center gap-3 py-3 px-4 text-white/60 hover:text-white rounded-lg w-full text-left">
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span className="text-sm tracking-wide whitespace-nowrap">Reportes</span>
          </button>
        </nav>

        <div className="px-4 pb-safe-or-8 flex-shrink-0" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <div className="border-t border-white/10 pt-4">
            <button onClick={handleLogoutClick} className="w-full nav-item flex items-center gap-3 py-3 px-4 text-white/60 hover:text-white rounded-lg text-left">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-sm tracking-wide whitespace-nowrap">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - SOLO ESTO CAMBIA */}
      <main className="ml-[260px] min-h-screen">
        <header className="w-full h-16 sticky top-0 z-20 bg-white flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#1B5E20] tracking-tight">
            {currentPage === 'admin' && 'Resumen General'}
            {currentPage === 'adminSesiones' && 'Gestión de Sesiones'}
            {currentPage === 'adminUsuarios' && 'Gestión de Usuarios'}
            {currentPage === 'adminEscenarios' && 'Gestión de Escenarios'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{user?.nombre}</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Administrador</p>
              </div>
              <div className="w-9 h-9 bg-[#1B5E20] rounded-full flex items-center justify-center text-white font-bold">
                {user?.nombre?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>

      {/* Modal de cierre */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onClick={handleCancelLogout}>
          <div className="bg-white rounded-2xl max-w-[420px] mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-[#2E7D32]"></div>
            <div className="p-10 text-center">
              <div className="mb-6 w-16 h-16 rounded-2xl bg-[#FFEBEE] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[#C62828] text-3xl">logout</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 mb-3">¿Cerrar sesión?</h3>
              <p className="text-gray-500 text-sm mb-8">Estás a punto de salir del Panel de Administración. ¿Deseas continuar?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCancelLogout} className="py-3 rounded-lg font-semibold text-[#2E7D32] bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button onClick={handleConfirmLogout} className="py-3 rounded-lg font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C]">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;