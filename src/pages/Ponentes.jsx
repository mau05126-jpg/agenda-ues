import { useState, useEffect } from 'react';

const Ponentes = ({ setCurrentPage }) => {
  const [ponentes, setPonentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [theme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const fetchPonentes = async () => {
      try {
        const res = await fetch('/api/sesiones/listar');
        const data = await res.json();
        if (data.success && data.sesiones) {
          const map = new Map();
          data.sesiones.forEach(s => {
            if (!s.ponente) return;
            if (!map.has(s.ponente)) {
              map.set(s.ponente, {
                nombre: s.ponente,
                imagen: s.imagen_ponente || null,
                especialidad: s.ponente_especialidad || '',
                bio: s.ponente_bio || '',
                institucion: s.ponente_institucion || '',
                logo: s.logo_institucion || null,
                sesiones: [],
              });
            }
            map.get(s.ponente).sesiones.push({
              id: s.id,
              titulo: s.titulo,
              fecha: s.fecha,
              hora: s.hora ? s.hora.substring(0, 5) : '',
              escenario: s.escenario,
              categoria: s.categoria,
            });
          });
          setPonentes(Array.from(map.values()));
        }
      } catch (e) {
        console.error('Error cargando ponentes:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPonentes();
  }, []);

  const formatearHoraAMPM = (h) => {
    if (!h) return 'N/A';
    const [hh, mm] = h.split(':').map(Number);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${(hh % 12 || 12).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
  };

  const getIniciales = (nombre) =>
    nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getCategoriaLabel = (cat) => {
    const mapa = {
      'Conferencia Magistral': 'CONFERENCIA',
      'Conferencia': 'CONFERENCIA',
      'Taller Práctico': 'TALLER',
      'Taller': 'TALLER',
      'Ponencia': 'PONENCIA',
    };
    return mapa[cat] || (cat || 'SESIÓN').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto min-h-screen">

        {/* Header */}
        <header className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold tracking-wider uppercase text-[10px] sm:text-[11px] mb-3">
            <span className="material-symbols-outlined text-sm">groups</span>
            12va Jornada Académica y Cultural · UES 2025
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-white leading-none mb-3">
            Conferencistas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm sm:text-base leading-relaxed">
            Conoce a los expertos que compartirán su conocimiento en esta jornada académica.
          </p>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Sin datos */}
        {!loading && ponentes.length === 0 && (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500 font-medium">
            No hay conferencistas registrados aún.
          </div>
        )}

        {/* Grid de cards */}
        {!loading && ponentes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {ponentes.map(p => (
              <div
                key={p.nombre}
                onClick={() => setSelected(p)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4 cursor-pointer hover:shadow-md hover:border-green-400 dark:hover:border-green-600 transition-all group"
              >
                {/* Avatar */}
                <div className="flex justify-center">
                  {p.imagen ? (
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-green-100 dark:ring-green-900/30 group-hover:ring-green-400 dark:group-hover:ring-green-600 transition-all"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-green-700 flex items-center justify-center text-white text-2xl font-extrabold ring-4 ring-green-100 dark:ring-green-900/30 group-hover:ring-green-400 transition-all">
                      {getIniciales(p.nombre)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="text-center">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">{p.nombre}</h3>
                  {p.especialidad && (
                    <p className="text-green-700 dark:text-green-400 text-xs font-semibold mt-1">{p.especialidad}</p>
                  )}
                  {p.institucion && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{p.institucion}</p>
                  )}
                </div>

                {/* Badge de sesiones */}
                <div className="flex justify-center">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {p.sesiones.length} sesión{p.sesiones.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                {/* Bio truncada */}
                {p.bio ? (
                  <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-3 leading-relaxed text-center">
                    {p.bio}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-600 text-xs italic text-center">Sin biografía registrada</p>
                )}

                {/* Ver perfil */}
                <button className="text-xs text-green-700 dark:text-green-400 font-bold self-center flex items-center gap-1 group-hover:underline mt-auto">
                  Ver perfil completo
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de perfil completo */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px] px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full mx-auto overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-green-700 flex-shrink-0" />

            <div className="overflow-y-auto">
              <div className="p-6 sm:p-8">

                {/* Cerrar */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-xl">close</span>
                  </button>
                </div>

                {/* Ponente header */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start mb-6">
                  {selected.imagen ? (
                    <img
                      src={selected.imagen}
                      alt={selected.nombre}
                      className="w-24 h-24 rounded-full object-cover flex-shrink-0 ring-4 ring-green-100 dark:ring-green-900/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-green-700 flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
                      {getIniciales(selected.nombre)}
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                      {selected.nombre}
                    </h2>
                    {selected.especialidad && (
                      <p className="text-green-700 dark:text-green-400 font-semibold text-sm mt-1">{selected.especialidad}</p>
                    )}
                    {selected.institucion && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{selected.institucion}</p>
                    )}
                    <span className="inline-block mt-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      {selected.sesiones.length} sesión{selected.sesiones.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>

                {/* Biografía */}
                {selected.bio && (
                  <div className="mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                      Biografía
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{selected.bio}</p>
                  </div>
                )}

                {/* Sesiones programadas */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Sesiones programadas
                  </h4>
                  <div className="space-y-2">
                    {selected.sesiones.map(s => (
                      <div
                        key={s.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex gap-3 items-start border border-gray-100 dark:border-gray-700"
                      >
                        <span className="material-symbols-outlined text-green-700 dark:text-green-400 text-lg flex-shrink-0 mt-0.5">
                          event
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{s.titulo}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 uppercase tracking-wider">
                              {getCategoriaLabel(s.categoria)}
                            </span>
                            {s.hora && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatearHoraAMPM(s.hora)}</span>
                            )}
                            {s.escenario && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[11px]">location_on</span>
                                {s.escenario}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ponentes;
