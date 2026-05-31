import { useState, useEffect } from 'react';

const DEFAULT_DIAS = [
  { dia: 1,  mes: 'Diciembre', nombre: 'Lunes',     sesiones: 0 },
  { dia: 2,  mes: 'Diciembre', nombre: 'Martes',    sesiones: 0 },
  { dia: 3,  mes: 'Diciembre', nombre: 'Miércoles', sesiones: 0 },
  { dia: 4,  mes: 'Diciembre', nombre: 'Jueves',    sesiones: 0 },
  { dia: 5,  mes: 'Diciembre', nombre: 'Viernes',   sesiones: 0 },
];

const Cronograma = () => {
  const [dias, setDias] = useState(() => {
    const cached = localStorage.getItem('sesiones_cache');
    return cached ? calcularDias(JSON.parse(cached)) : DEFAULT_DIAS;
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch('/api/sesiones/listar');
        const data = await res.json();
        if (data.success && data.sesiones) {
          const formateadas = data.sesiones.map(s => ({
            id: s.id,
            titulo: s.titulo,
            ponente: s.ponente,
            escenario: s.escenario,
            hora: s.hora ? s.hora.substring(0, 5) : 'N/A',
            diaSemana: s.fecha ? new Date(s.fecha).getDay() : 0,
            fecha: s.fecha,
          }));
          localStorage.setItem('sesiones_cache', JSON.stringify(formateadas));
          setDias(calcularDias(formateadas));
        }
      } catch (_) {}
    };
    cargar();
  }, []);

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-16 lg:py-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-green-900 dark:text-green-400 mb-2 transition-colors">
              Cronograma de Sesiones
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg transition-colors">
              Explora la distribución de temas y talleres a lo largo de la semana cultural y académica.
            </p>
          </div>
          <div className="w-12 h-1 bg-green-800 dark:bg-green-500 rounded-full mb-2 transition-colors"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {dias.map((dia, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition"
            >
              <div className="text-green-700 dark:text-green-400 font-extrabold text-2xl leading-none mb-0.5">
                {String(dia.dia).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-green-600 dark:text-green-300 font-bold tracking-[0.15em] uppercase mb-4">
                {dia.mes}
              </div>
              <div className="text-gray-900 dark:text-white font-bold text-sm mb-1">
                {dia.nombre}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {dia.sesiones} Sesiones
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Parsea la fecha como local (evita el desfase UTC)
function parseFechaLocal(fechaStr) {
  const parte = fechaStr.split('T')[0];
  const [y, m, d] = parte.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toKey(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcularDias(sesiones) {
  // Contar sesiones por fecha local
  const conteo = {};
  sesiones.forEach(s => {
    if (!s.fecha) return;
    const key = toKey(parseFechaLocal(s.fecha));
    conteo[key] = (conteo[key] || 0) + 1;
  });

  const fechas = Object.keys(conteo).sort();
  if (fechas.length === 0) return DEFAULT_DIAS;

  // Encontrar el lunes de la semana de la primera sesión
  const primeraFecha = parseFechaLocal(fechas[0]);
  const diaSemana = primeraFecha.getDay(); // 0=dom, 1=lun ... 6=sab
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(primeraFecha);
  lunes.setDate(primeraFecha.getDate() + diffLunes);

  // Generar los 5 días Lunes→Viernes en orden
  return Array.from({ length: 5 }, (_, i) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    const key = toKey(fecha);
    return {
      dia: fecha.getDate(),
      mes: fecha.toLocaleDateString('es-MX', { month: 'long' }),
      nombre: fecha.toLocaleDateString('es-MX', { weekday: 'long' }),
      sesiones: conteo[key] || 0,
    };
  });
}

export default Cronograma;
