// src/pages/EscenarioDetalle.jsx
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';

const EscenarioDetalle = ({ escenarioNombre, setCurrentPage }) => {
  const [sesiones, setSesiones] = useState(() => {
    const guardado = localStorage.getItem(`sesiones_${escenarioNombre}`);
    return guardado ? JSON.parse(guardado) : [];
  });
  // Set de IDs de sesiones en las que ya está inscrito el usuario
  const [inscritos, setInscritos] = useState(new Set());
  const [loadingInscripcion, setLoadingInscripcion] = useState(null); // id de sesión en proceso
  
  const [escenarioData, setEscenarioData] = useState(() => {
    const metadata = {
      "Aula Magna": {
        capacidad: 100,
        ubicacion: "Aula Magna",
        descripcion: "Sede principal de la 12va Jornada Académica y Cultural 2025.",
        imagen: "/2.jpg"
      },
      "Laboratorio de Cómputo": {
        capacidad: 30,
        ubicacion: "Laboratorio de Cómputo",
        descripcion: "Espacio especializado para talleres técnicos y programación.",
        imagen:"/sla.jpeg"
      },
      "Plazoleta Institucional": {
        capacidad: 50,
        ubicacion: "Plazoleta Institucional",
        descripcion: "Área para exposiciones y eventos al aire libre.",
        imagen: "/1.jpg"
      }
    };
    return metadata[escenarioNombre] || {
      capacidad: 100,
      ubicacion: 'Unidad Central',
      descripcion: `Sesiones en ${escenarioNombre}`,
      imagen: "/2.jpg"
    };
  });

  useEffect(() => {
    const cargarSesiones = async () => {
      if (!escenarioNombre) return;
      try {
        const response = await fetch(`/api/sesiones/listar?escenario=${encodeURIComponent(escenarioNombre)}`);
        const data = await response.json();
        if (data.success && data.sesiones) {
          const sesionesFormateadas = data.sesiones.map(s => ({
            id: s.id,
            hora: s.hora ? s.hora.substring(0, 5) : 'N/A',
            tipo: s.categoria || 'Conferencia',
            titulo: s.titulo,
            participante: s.ponente,
            descripcion: s.descripcion
          }));
          setSesiones(sesionesFormateadas);
          localStorage.setItem(`sesiones_${escenarioNombre}`, JSON.stringify(sesionesFormateadas));
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    cargarSesiones();
  }, [escenarioNombre]);

  // Cargar inscripciones actuales del usuario al montar
  useEffect(() => {
    const cargarInscritos = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/inscripciones/mis-inscripciones', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setInscritos(new Set(data.inscripciones.map(i => i.id)));
        }
      } catch (_) {}
    };
    cargarInscritos();
  }, []);

  const handleInscribirse = async (sesionId) => {
    const token = localStorage.getItem('token');
    if (!token) { setCurrentPage('loginPage'); return; }

    const yaInscrito = inscritos.has(sesionId);
    setLoadingInscripcion(sesionId);

    try {
      if (yaInscrito) {
        // Cancelar inscripción
        const res = await fetch('/api/inscripciones/cancelar', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sesion_id: sesionId }),
        });
        const data = await res.json();
        if (data.success) {
          setInscritos(prev => { const s = new Set(prev); s.delete(sesionId); return s; });
          // Actualizar localStorage de MiAgenda
          const user = getCurrentUser();
          if (user?.id) {
            const stored = JSON.parse(localStorage.getItem(`inscripciones_${user.id}`) || '[]');
            localStorage.setItem(`inscripciones_${user.id}`, JSON.stringify(stored.filter(s => s.id !== sesionId)));
          }
        }
      } else {
        // Inscribirse
        const res = await fetch('/api/inscripciones/inscribir', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sesion_id: sesionId }),
        });
        const data = await res.json();
        if (data.success) {
          setInscritos(prev => new Set([...prev, sesionId]));
          // Sincronizar con localStorage de MiAgenda
          const user = getCurrentUser();
          if (user?.id) {
            const sesion = sesiones.find(s => s.id === sesionId);
            const stored = JSON.parse(localStorage.getItem(`inscripciones_${user.id}`) || '[]');
            if (sesion && !stored.find(s => s.id === sesionId)) {
              stored.push({
                id: sesionId,
                titulo: sesion.titulo,
                hora: sesion.hora,
                tipo: sesion.tipo,
                participante: sesion.participante,
                escenario: escenarioNombre,
                descripcion: sesion.descripcion,
              });
              localStorage.setItem(`inscripciones_${user.id}`, JSON.stringify(stored));
            }
          }
        } else {
          alert(data.error || 'Error al inscribirse');
        }
      }
    } catch (_) {
      alert('Error de conexión');
    } finally {
      setLoadingInscripcion(null);
    }
  };

  return (
    <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-10 max-w-[1280px] mx-auto">
      
      {/* Breadcrumb - Responsive */}
      <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 overflow-x-auto">
        <button onClick={() => setCurrentPage('home')} className="hover:text-green-700 dark:hover:text-green-400 whitespace-nowrap">Inicio</button>
        <span className="material-symbols-outlined text-xs flex-shrink-0">chevron_right</span>
        <button onClick={() => setCurrentPage('escenarios')} className="hover:text-green-700 dark:hover:text-green-400 whitespace-nowrap">Escenarios</button>
        <span className="material-symbols-outlined text-xs flex-shrink-0">chevron_right</span>
        <span className="text-green-700 dark:text-green-400 font-semibold truncate">{escenarioNombre}</span>
      </nav>

      {/* Header Info + Image - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 mb-8 sm:mb-12">
        <div>
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 rounded-full px-3 sm:px-4 py-1.5 mb-3 sm:mb-4">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse flex-shrink-0"></span>
            <span className="text-green-700 dark:text-green-400 text-[10px] font-bold uppercase">Sede Principal</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-green-900 dark:text-green-100 leading-tight mb-3 sm:mb-4">
            Sesiones en {escenarioNombre}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
            {escenarioData?.descripcion}
          </p>
          
          {/* Stats - Responsive flex wrap */}
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base sm:text-lg">groups</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Capacidad</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{escenarioData?.capacidad} personas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base sm:text-lg">location_on</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Ubicación</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{escenarioData?.ubicacion}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Image - Responsive height */}
        <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg dark:shadow-gray-900/50 h-48 sm:h-64">
          <img 
            src={escenarioData?.imagen} 
            alt={escenarioNombre} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Section Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
          Programa de la Jornada
        </h2>
        <button 
          onClick={() => setCurrentPage('escenarios')} 
          className="flex items-center gap-1 text-green-700 dark:text-green-400 font-semibold text-sm hover:gap-2 transition-all w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </button>
      </div>

      {/* Sessions List - Responsive Cards */}
      <div className="space-y-3 sm:space-y-4 mb-12 sm:mb-16">
        {sesiones.length > 0 ? (
          sesiones.map((sesion) => (
            <div 
              key={sesion.id} 
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow"
            >
              {/* Time - Responsive width */}
              <div className="sm:w-20 flex-shrink-0">
                <div className="text-xl sm:text-2xl font-extrabold text-green-700 dark:text-green-400">
                  {sesion.hora}
                </div>
                <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-0.5">
                  {sesion.tipo}
                </div>
              </div>
              
              {/* Info - Flexible */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 break-words">
                  {sesion.titulo}
                </h3>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <span className="material-symbols-outlined text-sm flex-shrink-0">person</span>
                  <span className="truncate">{sesion.participante}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 line-clamp-2">
                  {sesion.descripcion?.substring(0, 150)}...
                </p>
              </div>
              
              {/* Buttons - Responsive stack on mobile */}
              <div className="flex gap-2 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => handleInscribirse(sesion.id)}
                  disabled={loadingInscripcion === sesion.id}
                  className={`px-4 sm:px-5 py-2 rounded-lg text-xs font-bold transition-colors flex-1 sm:flex-none flex items-center gap-1 justify-center
                    ${inscritos.has(sesion.id)
                      ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400'
                      : 'bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 text-white'
                    } ${loadingInscripcion === sesion.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loadingInscripcion === sesion.id
                    ? '...'
                    : inscritos.has(sesion.id)
                      ? 'Cancelar'
                      : 'Inscribirse'
                  }
                </button>
              </div>
            </div>
          ))
        ) : (
          /* Empty State - Dark mode fixed */
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border border-gray-100 dark:border-gray-700">
            <span className="material-symbols-outlined text-4xl sm:text-6xl text-gray-400 dark:text-gray-500 mb-4 block">
              event_busy
            </span>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              No hay sesiones para este escenario
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default EscenarioDetalle;