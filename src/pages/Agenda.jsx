// src/pages/Agenda.jsx
import { useState, useEffect } from 'react';

const calcHoraFin = (hora, duracion) => {
  if (!hora || hora === 'N/A' || !duracion) return null;
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + parseInt(duracion);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const Agenda = ({ setCurrentPage }) => {
  const [activeDay, setActiveDay] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  
  // Cargar datos del localStorage al iniciar (INSTANTÁNEO)
  const [sesiones, setSesiones] = useState(() => {
    const guardado = localStorage.getItem('sesiones_cache');
    return guardado ? JSON.parse(guardado) : [];
  });

  useEffect(() => {
    // Cargar datos actualizados en segundo plano
    const cargarDatos = async () => {
      try {
        const response = await fetch('/api/sesiones/listar');
        const data = await response.json();
        
        if (data.success && data.sesiones) {
          const sesionesFormateadas = data.sesiones.map(s => {
            let diaSemana = 0;
            if (s.fecha) {
              const dia = parseInt(String(s.fecha).substring(8, 10), 10);
              if (dia === 1) diaSemana = 0;
              else if (dia === 2) diaSemana = 1;
              else if (dia === 3) diaSemana = 2;
              else if (dia === 4) diaSemana = 3;
              else if (dia === 5) diaSemana = 4;
            }
            return {
              id: s.id,
              titulo: s.titulo,
              descripcion: s.descripcion,
              ponente: s.ponente,
              escenario: s.escenario,
              hora: s.hora ? s.hora.substring(0, 5) : 'N/A',
              duracion: s.duracion || 90,
              diaSemana: diaSemana
            };
          });
          setSesiones(sesionesFormateadas);
          // Guardar en localStorage para próxima vez
          localStorage.setItem('sesiones_cache', JSON.stringify(sesionesFormateadas));
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    cargarDatos();
  }, []);

  const days = [
    { name: "Lunes 1", shortName: "Hoy" },
    { name: "Martes 2", shortName: "Mañana" },
    { name: "Miércoles 3", shortName: "Día 3" },
    { name: "Jueves 4", shortName: "Día 4" },
    { name: "Viernes 5", shortName: "Día 5" }
  ];

  const sesionesDelDia = sesiones.filter(s => s.diaSemana === activeDay);

  const filteredSesiones = searchTerm === ''
    ? sesionesDelDia
    : sesiones.filter(s =>
        s.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ponente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.escenario?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Al buscar, cambiar el tab al día del primer resultado encontrado
  useEffect(() => {
    if (searchTerm === '') return;
    const matched = sesiones.filter(s =>
      s.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ponente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.escenario?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (matched.length > 0) setActiveDay(matched[0].diaSemana);
  }, [searchTerm, sesiones]);

  return (
    <main className="pt-24 pb-16 px-6 lg:px-10 max-w-[1280px] mx-auto">
      <div className="mb-8">
        <p className="text-[10px] font-bold text-green-700 dark:text-green-400 tracking-[0.2em] uppercase mb-2">Calendario Académico</p>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-green-900 dark:text-green-400 leading-tight mb-3">
          Programa de Sesiones · 12va<br />Jornada 2025
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl leading-relaxed">
          Explora el ecosistema de conocimiento, cultura e innovación diseñado para transformar nuestra comunidad.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar sesiones, ponentes o temas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setActiveDay(index)}
            className={`px-6 py-3 rounded-xl text-center min-w-[100px] transition ${
              activeDay === index
                ? 'bg-green-800 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-green-400'
            }`}
          >
            <div className="text-[9px] font-bold tracking-wider uppercase opacity-80 mb-0.5">{day.shortName}</div>
            <div className="text-sm font-extrabold">{day.name}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-5">
          {filteredSesiones.length > 0 ? (
            filteredSesiones.map((sesion) => (
              <div key={sesion.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex gap-5 relative overflow-hidden hover:shadow-lg transition">
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-green-600 rounded-r-full"></div>
                <div className="pl-3 min-w-[90px] text-center flex flex-col items-center justify-center gap-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{parseInt(sesion.hora) < 12 ? 'AM' : 'PM'}</div>
                  <div className="text-sm font-extrabold text-gray-800 dark:text-white leading-tight whitespace-nowrap">
                    {sesion.hora}
                    {calcHoraFin(sesion.hora, sesion.duracion) && (
                      <span className="font-semibold text-gray-500 dark:text-gray-400"> a {calcHoraFin(sesion.hora, sesion.duracion)}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  {searchTerm && (
                    <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">
                      {days[sesion.diaSemana]?.name}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2">{sesion.titulo}</h3>
                  <div className="flex flex-wrap gap-3 mb-3 text-xs">
                    <span className="flex items-center gap-1 text-green-700 dark:text-green-400 font-semibold">
                      <span className="material-symbols-outlined text-sm">person</span>
                      {sesion.ponente}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {sesion.escenario}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{sesion.descripcion}</p>
                  <button onClick={() => setCurrentPage('loginPage')} className="inline-flex items-center gap-2 border border-green-600 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-50 transition">
                    <span className="material-symbols-outlined text-sm">bookmark_border</span>
                    Inicia sesión
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">event_busy</span>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No se encontraron sesiones con ese criterio' : 'No hay sesiones para este día'}
              </p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[340px] space-y-6">
          <div className="bg-green-900 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-3">Personaliza tu experiencia</h3>
            <p className="text-green-100 text-sm leading-relaxed mb-5">Crea una cuenta para guardar tus sesiones favoritas.</p>
            <button onClick={() => setCurrentPage('loginPage')} className="w-full bg-green-400 hover:bg-green-300 text-green-900 font-bold py-3 rounded-xl text-sm transition">Crear mi Agenda</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Agenda;