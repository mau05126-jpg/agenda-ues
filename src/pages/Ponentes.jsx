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
      <main className="pt-24 pb-16 px-6 lg:px-10 max-w-[1280px] mx-auto">

        {/* ── Header ─────────────────────────────────── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 mb-4 w-fit">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm">groups</span>
            <span className="text-green-700 dark:text-green-400 text-[10px] font-bold tracking-wider uppercase">
              12va Jornada Académica y Cultural · UES 2025
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-green-900 dark:text-green-400 leading-tight mb-3">
                Conferencistas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl leading-relaxed">
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
        </div>

        {/* ── Sin datos ─────────────────────────────── */}
        {ponentes.length === 0 && (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500 font-medium">
            No hay conferencistas registrados aún.
          </div>
        )}

        {/* ── Grid de cards ─────────────────────────── */}
        {ponentes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ponentes.map((p) => (
              <article
                key={p.nombre}
                onClick={() => setSelected(p)}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                {/* Área decorativa superior con foto flotante */}
                <div className="relative h-20 bg-gradient-to-br from-green-700 to-green-500 flex-shrink-0">
                  {/* Badge de sesiones */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {p.sesiones.length} {p.sesiones.length === 1 ? 'sesión' : 'sesiones'}
                    </span>
                  </div>
                  {/* Foto flotante sobre el borde */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    {p.imagen ? (
                      <img
                        src={p.imagen}
                        alt={p.nombre}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg group-hover:ring-green-200 dark:group-hover:ring-green-700 transition-all duration-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg group-hover:ring-green-200 dark:group-hover:ring-green-700 transition-all duration-200">
                        <span className="text-white text-xl font-extrabold select-none">
                          {getIniciales(p.nombre)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="pt-12 pb-5 px-5 flex flex-col gap-3 flex-1 text-center">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
                      {p.nombre}
                    </h3>
                    {p.especialidad && (
                      <p className="text-green-700 dark:text-green-400 text-xs font-semibold mt-1">
                        {p.especialidad}
                      </p>
                    )}
                    {p.institucion && (
                      <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">domain</span>
                        {p.institucion}
                      </p>
                    )}
                  </div>

                  <div className="w-full h-px bg-gray-100 dark:bg-gray-700" />

                  {p.bio ? (
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-3 flex-1">
                      {p.bio}
                    </p>
                  ) : (
                    <p className="text-gray-300 dark:text-gray-600 text-xs italic flex-1">
                      Sin biografía registrada
                    </p>
                  )}

                  <button className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-green-700 dark:text-green-400 font-bold flex items-center justify-center gap-1 group-hover:gap-2 transition-all duration-150">
                    Ver perfil completo
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ────────────────────────────────────── */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
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
                <div className="h-36 bg-gradient-to-br from-green-800 to-green-600 flex items-center px-5 gap-4">
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

                {/* Chips */}
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
