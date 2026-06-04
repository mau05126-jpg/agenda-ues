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
          <h1 className="text-4xl lg:text-6xl font-extrabold text-green-900 dark:text-green-400 leading-tight mb-3">
            Conferencistas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl leading-relaxed">
            Expertos que compartirán su conocimiento durante los 5 días de la jornada académica.
          </p>
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
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer group hover:shadow-xl hover:-translate-y-1 hover:border-green-200 dark:hover:border-green-700 transition-all duration-200 flex flex-col"
              >
                {/* Área decorativa con foto flotante */}
                <div className="relative h-20 bg-gradient-to-br from-green-700 to-green-500 flex-shrink-0">
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    {p.imagen ? (
                      <img
                        src={p.imagen}
                        alt={p.nombre}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg group-hover:ring-green-100 dark:group-hover:ring-green-800 transition-all duration-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg">
                        <span className="text-white text-xl font-extrabold select-none">
                          {getIniciales(p.nombre)}
                        </span>
                      </div>
                    )}
                    {/* Número de sesiones en la foto */}
                    <span className="absolute -bottom-1 -right-1 bg-green-700 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800">
                      {p.sesiones.length}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="pt-12 pb-5 px-5 flex flex-col gap-2 flex-1 text-center">
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

                  <div className="w-10 h-0.5 bg-green-200 dark:bg-green-800 rounded-full mx-auto my-1" />

                  {p.bio ? (
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-3 flex-1">
                      {p.bio}
                    </p>
                  ) : (
                    <p className="text-gray-300 dark:text-gray-600 text-xs italic flex-1">
                      Sin biografía registrada
                    </p>
                  )}

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors font-medium">
                    Toca para ver perfil
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[94vh] sm:max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Hero: foto desenfocada de fondo + circular encima ── */}
            <div className="relative flex-shrink-0 h-44">
              {/* Fondo desenfocado */}
              {selected.imagen ? (
                <>
                  <img
                    src={selected.imagen}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-md"
                  />
                  <div className="absolute inset-0 bg-black/50" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-green-600" />
              )}

              {/* Botón cerrar */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition z-10"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>

              {/* Foto circular flotando sobre el borde inferior */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
                {selected.imagen ? (
                  <img
                    src={selected.imagen}
                    alt={selected.nombre}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center ring-4 ring-white dark:ring-gray-900 shadow-xl">
                    <span className="text-white text-2xl font-extrabold">{getIniciales(selected.nombre)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Nombre + especialidad + chips ── */}
            <div className="pt-16 pb-5 px-6 text-center flex-shrink-0 border-b border-gray-100 dark:border-gray-700/60">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {selected.nombre}
              </h2>
              {selected.especialidad && (
                <p className="text-green-700 dark:text-green-400 font-semibold text-sm mt-1">
                  {selected.especialidad}
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {selected.institucion && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full font-medium">
                    <span className="material-symbols-outlined text-xs">domain</span>
                    {selected.institucion}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-green-800 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                  <span className="material-symbols-outlined text-xs">event</span>
                  {selected.sesiones.length} {selected.sesiones.length === 1 ? 'sesión' : 'sesiones'}
                </span>
              </div>
            </div>

            {/* ── Contenido scrolleable ── */}
            <div className="overflow-y-auto">
              <div className="p-5 sm:p-6 space-y-6">

                {/* Sobre el conferencista */}
                {selected.bio && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                      Sobre el conferencista
                    </p>
                    <div className="flex gap-3">
                      <div className="w-0.5 flex-shrink-0 bg-green-500 dark:bg-green-600 rounded-full" />
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {selected.bio}
                      </p>
                    </div>
                  </div>
                )}

                {/* ¿Cuándo puedo verlo? */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    ¿Cuándo puedo verlo?
                  </p>
                  <div className="space-y-2.5">
                    {selected.sesiones.map(s => (
                      <div
                        key={s.id}
                        className="flex gap-3 items-stretch bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50"
                      >
                        {/* Franja de día */}
                        <div className="flex-shrink-0 w-14 bg-green-700 dark:bg-green-800 flex flex-col items-center justify-center py-3 gap-0.5">
                          {getDia(s.fecha) ? (
                            <>
                              <span className="text-green-200 text-[8px] font-black uppercase tracking-wider leading-none">día</span>
                              <span className="text-white text-2xl font-extrabold leading-none">
                                {getDia(s.fecha)?.split(' ')[1]}
                              </span>
                            </>
                          ) : (
                            <span className="material-symbols-outlined text-white text-xl">event</span>
                          )}
                        </div>

                        {/* Detalle sesión */}
                        <div className="flex-1 py-3 pr-4 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2">
                            {s.titulo}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 uppercase tracking-wide">
                              {getCategoriaLabel(s.categoria)}
                            </span>
                            {s.hora && (
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {formatearHoraAMPM(s.hora)}
                              </span>
                            )}
                            {s.escenario && (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-xs">location_on</span>
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
