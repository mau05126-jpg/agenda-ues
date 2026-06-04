import { useState, useEffect } from 'react';

const parsePonentes = (sesiones) => {
  const map = new Map();
  sesiones.forEach(s => {
    if (!s.ponente) return;
    if (!map.has(s.ponente)) {
      map.set(s.ponente, {
        nombre: s.ponente,
        imagen: s.imagen_ponente || null,
        especialidad: s.ponente_especialidad || '',
        bio: s.ponente_bio || '',
        institucion: s.ponente_institucion || '',
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
  return Array.from(map.values());
};

const Ponentes = ({ setCurrentPage }) => {
  const [ponentes, setPonentes] = useState(() => {
    const cached = localStorage.getItem('sesiones_cronograma_cache') || localStorage.getItem('ponentes_cache');
    return cached ? parsePonentes(JSON.parse(cached)) : [];
  });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch('/api/sesiones/listar');
        const data = await res.json();
        if (data.success && data.sesiones) {
          localStorage.setItem('ponentes_cache', JSON.stringify(data.sesiones));
          setPonentes(parsePonentes(data.sesiones));
        }
      } catch (e) {
        console.error('Error cargando ponentes:', e);
      }
    };
    cargar();
  }, []);

  const formatearHoraAMPM = (h) => {
    if (!h) return '';
    const [hh, mm] = h.split(':').map(Number);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${(hh % 12 || 12).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
  };

  const getIniciales = (nombre) =>
    nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const getCategoriaLabel = (cat) => ({
    'Conferencia Magistral': 'CONFERENCIA',
    'Conferencia': 'CONFERENCIA',
    'Taller Práctico': 'TALLER',
    'Taller': 'TALLER',
    'Ponencia': 'PONENCIA',
  })[cat] || (cat || 'SESIÓN').toUpperCase();

  const getDia = (fecha) => {
    if (!fecha) return null;
    const d = parseInt(String(fecha).substring(8, 10), 10);
    return d >= 1 && d <= 5 ? `Día ${d}` : null;
  };

  const totalSesiones = ponentes.reduce((acc, p) => acc + p.sesiones.length, 0);

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────── */}
        <header className="mb-10 sm:mb-14">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold tracking-widest uppercase text-[10px] sm:text-[11px] mb-3">
            <span className="material-symbols-outlined text-sm">groups</span>
            12va Jornada Académica y Cultural · UES 2025
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-gray-900 dark:text-white leading-none">
                Conferencistas
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm sm:text-base max-w-xl leading-relaxed">
                Expertos que compartirán su conocimiento durante los 5 días de la jornada académica.
              </p>
            </div>
            {ponentes.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="bg-green-800 dark:bg-green-900 text-white rounded-2xl px-5 py-3 text-center min-w-[80px]">
                  <p className="text-2xl sm:text-3xl font-extrabold leading-none">{ponentes.length}</p>
                  <p className="text-green-300 text-[10px] font-bold uppercase tracking-wider mt-1">Ponentes</p>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3 text-center min-w-[80px]">
                  <p className="text-2xl sm:text-3xl font-extrabold leading-none">{totalSesiones}</p>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">Sesiones</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Sin datos ───────────────────────────── */}
        {ponentes.length === 0 && (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500 font-medium">
            No hay conferencistas registrados aún.
          </div>
        )}

        {/* ── Grid de cards ───────────────────────── */}
        {ponentes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {ponentes.map((p) => (
              <article
                key={p.nombre}
                onClick={() => setSelected(p)}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                {/* Foto */}
                <div className="relative h-52 overflow-hidden flex-shrink-0">
                  {p.imagen ? (
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
                      <span className="text-white text-6xl font-extrabold tracking-tighter opacity-90 select-none">
                        {getIniciales(p.nombre)}
                      </span>
                    </div>
                  )}
                  {/* Badge de sesiones encima de la foto */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/55 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {p.sesiones.length} {p.sesiones.length === 1 ? 'sesión' : 'sesiones'}
                    </span>
                  </div>
                  {/* Gradiente inferior para leer el texto si lo hubiera */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Info */}
                <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
                      {p.nombre}
                    </h3>
                    {p.especialidad && (
                      <p className="text-green-700 dark:text-green-400 text-xs font-semibold mt-0.5">
                        {p.especialidad}
                      </p>
                    )}
                    {p.institucion && (
                      <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">domain</span>
                        {p.institucion}
                      </p>
                    )}
                  </div>

                  {p.bio ? (
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2 flex-1">
                      {p.bio}
                    </p>
                  ) : (
                    <p className="text-gray-300 dark:text-gray-600 text-xs italic flex-1">Sin biografía registrada</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                    <span className="text-xs text-green-700 dark:text-green-400 font-bold flex items-center gap-1 group-hover:gap-2 transition-all duration-150">
                      Ver perfil
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                    <span className="material-symbols-outlined text-gray-200 dark:text-gray-700 text-xl group-hover:text-green-400 transition-colors">
                      person
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Hero del modal */}
            <div className="relative flex-shrink-0">
              {selected.imagen ? (
                <>
                  <div className="h-52 sm:h-60 overflow-hidden">
                    <img
                      src={selected.imagen}
                      alt={selected.nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                      {selected.nombre}
                    </h2>
                    {selected.especialidad && (
                      <p className="text-green-300 text-sm font-semibold mt-1">{selected.especialidad}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-36 bg-gradient-to-br from-green-800 to-green-600 relative flex items-center px-5 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
                    {getIniciales(selected.nombre)}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{selected.nombre}</h2>
                    {selected.especialidad && (
                      <p className="text-green-200 text-sm mt-0.5 font-medium">{selected.especialidad}</p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/55 transition"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto">
              <div className="p-5 sm:p-6 space-y-5">

                {/* Chips: institución + sesiones */}
                <div className="flex flex-wrap gap-2">
                  {selected.institucion && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full font-medium">
                      <span className="material-symbols-outlined text-xs">domain</span>
                      {selected.institucion}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-green-800 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                    <span className="material-symbols-outlined text-xs">event</span>
                    {selected.sesiones.length} {selected.sesiones.length === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>

                {/* Biografía */}
                {selected.bio && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                      Biografía
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{selected.bio}</p>
                  </div>
                )}

                {/* Sesiones */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Sesiones programadas
                  </h4>
                  <div className="space-y-2">
                    {selected.sesiones.map(s => (
                      <div
                        key={s.id}
                        className="flex gap-3 items-start bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-green-700 dark:text-green-400 text-base">event</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">{s.titulo}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 uppercase tracking-wide">
                              {getCategoriaLabel(s.categoria)}
                            </span>
                            {getDia(s.fecha) && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{getDia(s.fecha)}</span>
                            )}
                            {s.hora && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatearHoraAMPM(s.hora)}</span>
                            )}
                            {s.escenario && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">location_on</span>
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
