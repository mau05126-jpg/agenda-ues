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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {ponentes.map((p) => (
              <article
                key={p.nombre}
                onClick={() => setSelected(p)}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer group hover:shadow-2xl hover:-translate-y-1.5 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 flex flex-col"
              >
                {/* Área superior con gradiente y detalle decorativo */}
                <div className="relative h-28 sm:h-32 bg-gradient-to-br from-green-800 via-green-700 to-green-500 flex-shrink-0 overflow-hidden">
                  {/* Círculos decorativos de fondo */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute top-3 left-4 w-8 h-8 rounded-full bg-white/10" />

                  {/* Foto flotante */}
                  <div className="absolute -bottom-12 sm:-bottom-14 left-1/2 -translate-x-1/2">
                    {p.imagen ? (
                      <img
                        src={p.imagen}
                        alt={p.nombre}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-xl group-hover:ring-green-200 dark:group-hover:ring-green-700 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-green-500 to-green-900 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-xl group-hover:ring-green-200 transition-all duration-300">
                        <span className="text-white text-xl sm:text-2xl font-extrabold select-none">
                          {getIniciales(p.nombre)}
                        </span>
                      </div>
                    )}
                    {/* Badge sesiones */}
                    <span className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 bg-green-600 text-white text-[9px] sm:text-[10px] font-black w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
                      {p.sesiones.length}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="pt-14 sm:pt-16 pb-4 sm:pb-5 px-3 sm:px-5 flex flex-col gap-1.5 sm:gap-2 flex-1 text-center">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg leading-tight">
                      {p.nombre}
                    </h3>
                    {p.especialidad && (
                      <p className="text-green-700 dark:text-green-400 text-[11px] sm:text-xs font-semibold mt-1 leading-tight">
                        {p.especialidad}
                      </p>
                    )}
                    {p.institucion && (
                      <p className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-[11px] mt-0.5 flex items-center justify-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]">domain</span>
                        {p.institucion}
                      </p>
                    )}
                  </div>

                  <div className="w-8 h-0.5 bg-gradient-to-r from-green-300 to-green-500 dark:from-green-700 dark:to-green-500 rounded-full mx-auto my-1" />

                  {p.bio ? (
                    <p className="text-gray-400 dark:text-gray-500 text-[11px] sm:text-xs leading-relaxed line-clamp-2 flex-1">
                      {p.bio}
                    </p>
                  ) : (
                    <p className="text-gray-300 dark:text-gray-600 text-[10px] italic flex-1">
                      Sin biografía
                    </p>
                  )}

                  <div className="mt-2 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors font-bold tracking-widest uppercase">
                      Ver perfil
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Barra verde + cerrar */}
            <div className="h-1 w-full bg-green-700 flex-shrink-0" />
            <div className="flex justify-end px-5 pt-4 flex-shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <span className="material-symbols-outlined text-gray-400 text-xl">close</span>
              </button>
            </div>

            {/* Foto + nombre — encabezado limpio */}
            <div className="flex flex-col items-center text-center px-6 pb-5 gap-4 flex-shrink-0">
              {/* Foto grande con anillo verde */}
              <div className="relative">
                {selected.imagen ? (
                  <img
                    src={selected.imagen}
                    alt={selected.nombre}
                    className="w-28 h-28 rounded-full object-cover shadow-xl ring-4 ring-green-200 dark:ring-green-800"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-xl ring-4 ring-green-200 dark:ring-green-800">
                    <span className="text-white text-3xl font-extrabold">{getIniciales(selected.nombre)}</span>
                  </div>
                )}
                {/* Badge de sesiones en la foto */}
                <span className="absolute -bottom-1 -right-1 bg-green-700 text-white text-[11px] font-black min-w-[26px] h-[26px] px-1.5 rounded-full flex items-center justify-center shadow border-2 border-white dark:border-gray-900">
                  {selected.sesiones.length}
                </span>
              </div>

              {/* Nombre y rol */}
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {selected.nombre}
                </h2>
                {selected.especialidad && (
                  <p className="text-green-700 dark:text-green-400 font-semibold text-sm mt-1">
                    {selected.especialidad}
                  </p>
                )}
                {selected.institucion && (
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-xs">domain</span>
                    {selected.institucion}
                  </p>
                )}
              </div>
            </div>

            {/* Línea separadora */}
            <div className="h-px bg-gray-100 dark:bg-gray-700/60 mx-6 flex-shrink-0" />

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* Biografía */}
                {selected.bio && (
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 border border-green-100 dark:border-green-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-base">menu_book</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-700 dark:text-green-500">
                        Sobre el conferencista
                      </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-justify">
                      {selected.bio}
                    </p>
                  </div>
                )}

                {/* Sesiones */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    ¿Cuándo puedo verlo?
                  </p>
                  <div className="space-y-2">
                    {selected.sesiones.map(s => (
                      <div
                        key={s.id}
                        className="relative bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 overflow-hidden"
                      >
                        {/* Barra lateral verde igual que las tarjetas del cronograma */}
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-green-500 rounded-r-full" />

                        <div className="pl-3">
                          {/* Badges arriba */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 uppercase tracking-wide">
                              {getCategoriaLabel(s.categoria)}
                            </span>
                            {getDia(s.fecha) && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                {getDia(s.fecha)}
                              </span>
                            )}
                          </div>

                          {/* Título */}
                          <p className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                            {s.titulo}
                          </p>

                          {/* Hora y lugar */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {s.hora && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                {formatearHoraAMPM(s.hora)}
                              </span>
                            )}
                            {s.escenario && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">location_on</span>
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
