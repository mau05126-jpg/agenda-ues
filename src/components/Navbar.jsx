// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { FiMenu, FiX } from 'react-icons/fi';
import logoUES from '../assets/Logo.png';

const Navbar = ({ toggleTheme, theme, currentPage, setCurrentPage }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(() => localStorage.getItem('logo_principal_cache') || null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        const val = data.config?.logo_principal;
        if (val) {
          setLogoSrc(val);
          localStorage.setItem('logo_principal_cache', val);
        } else {
          localStorage.removeItem('logo_principal_cache');
          setLogoSrc(null);
        }
      })
      .catch(() => {});
  }, []);

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  return (
    <header className="fixed w-full top-0 left-0 z-50 border-b border-green-100/50 dark:border-gray-800 h-16 bg-[#F1F8F1] dark:bg-gray-900 transition-colors duration-300">
      <div className="flex justify-between items-center px-6 lg:px-10 h-full max-w-[1440px] mx-auto">
        
        {/* Logo - igual que tenías */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
          <img src={logoSrc || logoUES} alt="Logo UES" className="h-10 w-auto object-contain" />
          <span className="text-gray-800 dark:text-white font-bold text-lg ml-1 transition-colors">
            Agenda UES
          </span>
        </div>

        {/* Desktop Nav - igual que tenías */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <button onClick={() => setCurrentPage('home')} className={`transition pb-0.5 ${currentPage === 'home' ? 'text-green-800 dark:text-green-400 border-b-2 border-green-600' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'}`}>
            Inicio
          </button>
          <button onClick={() => setCurrentPage('agenda')} className={`transition pb-0.5 ${currentPage === 'agenda' ? 'text-green-800 dark:text-green-400 border-b-2 border-green-600' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'}`}>
            Agenda
          </button>
          <button onClick={() => setCurrentPage('escenarios')} className={`transition pb-0.5 ${currentPage === 'escenarios' ? 'text-green-800 dark:text-green-400 border-b-2 border-green-600' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'}`}>
            Escenarios
          </button>
          <button onClick={() => setCurrentPage('ponentes')} className={`transition pb-0.5 ${currentPage === 'ponentes' ? 'text-green-800 dark:text-green-400 border-b-2 border-green-600' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'}`}>
            Conferencistas
          </button>
        </nav>

        {/* Right side - igual que tenías + botón hamburguesa */}
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Cambiar tema">
            {theme === 'dark' ? <MdLightMode className="text-gray-300 text-xl" /> : <MdDarkMode className="text-gray-500 text-xl" />}
          </button>
          
          <button onClick={() => setCurrentPage('loginPage')} className="hidden sm:block bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-md font-semibold text-xs transition">
            Iniciar sesión
          </button>

          {/* ✅ BOTÓN MENÚ MÓVIL - Nuevo */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {menuOpen ? (
              <FiX className="text-gray-800 dark:text-white text-xl" />
            ) : (
              <FiMenu className="text-gray-800 dark:text-white text-xl" />
            )}
          </button>
        </div>
      </div>

      {/* ✅ MENÚ MÓVIL DESPLEGABLE - Nuevo */}
      {menuOpen && (
        <div className="md:hidden bg-[#F1F8F1] dark:bg-gray-900 border-t border-green-100/50 dark:border-gray-800 px-6 py-4 shadow-lg">
          <nav className="flex flex-col gap-3">
            <button 
              onClick={() => handleNavClick('home')} 
              className={`text-left py-2 px-3 rounded-lg transition ${currentPage === 'home' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => handleNavClick('agenda')} 
              className={`text-left py-2 px-3 rounded-lg transition ${currentPage === 'agenda' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Agenda
            </button>
            <button
              onClick={() => handleNavClick('escenarios')}
              className={`text-left py-2 px-3 rounded-lg transition ${currentPage === 'escenarios' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Escenarios
            </button>
            <button
              onClick={() => handleNavClick('ponentes')}
              className={`text-left py-2 px-3 rounded-lg transition ${currentPage === 'ponentes' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Conferencistas
            </button>
            <button 
              onClick={() => handleNavClick('loginPage')} 
              className="mt-2 w-full bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-md font-semibold text-sm transition"
            >
              Iniciar sesión
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;