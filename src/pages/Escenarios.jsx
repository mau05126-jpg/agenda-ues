// src/pages/Escenarios.jsx
import { useState, useEffect } from 'react';

const Escenarios = ({ setCurrentPage, setSelectedEscenario }) => {
  const [escenariosConSesiones, setEscenariosConSesiones] = useState([]);
  const [sesionesPorEscenario, setSesionesPorEscenario] = useState({});

  // Datos de los escenarios
  const escenariosData = [
    {
      id: 1,
      nombre: "Aula Magna",
      icono: "domain",
      descripcion: "Principal recinto para conferencias magistrales.",
      imagen: "/src/assets/2.jpg"
    },
    {
      id: 2,
      nombre: "Laboratorio de Cómputo",
      icono: "computer",
      descripcion: "Espacio especializado para talleres técnicos, programación y visualización de datos complejos durante el evento.",
      imagen:"/src/assets/sla.jpeg"
    },
    {
      id: 3,
      nombre: "Plazoleta Institucional",
      icono: "deck",
      descripcion: "Área de transición ideal para exposiciones y eventos al aire libre, punto de encuentro para actividades culturales.",
      imagen: "/src/assets/1.jpg"
    }
  ];

  // Función para obtener sesiones de un escenario
  const obtenerSesionesPorEscenario = async (escenarioNombre) => {
    try {
      const response = await fetch(`/api/sesiones/listar?escenario=${encodeURIComponent(escenarioNombre)}`);
      const data = await response.json();
      return data.success ? data.sesiones.length : 0;
    } catch (error) {
      console.error('Error:', error);
      return 0;
    }
  };

  // Cargar conteo de sesiones para cada escenario
  useEffect(() => {
    const cargarConteos = async () => {
      const escenariosActualizados = await Promise.all(
        escenariosData.map(async (escenario) => {
          const totalSesiones = await obtenerSesionesPorEscenario(escenario.nombre);
          return { ...escenario, sesiones: totalSesiones };
        })
      );
      setEscenariosConSesiones(escenariosActualizados);
    };
    
    cargarConteos();
  }, []);

  const handleVerSesiones = (escenarioNombre) => {
    setSelectedEscenario(escenarioNombre);
    setCurrentPage('escenarioDetalle');
  };

  const instituciones = ['COMECyT', 'TESVB', 'UAQ', 'UIEM', 'TECNM', 'CCPVT'];

  const escenariosMostrar = escenariosConSesiones.length > 0 ? escenariosConSesiones : escenariosData;

  return (
    <main className="pt-24 pb-16 px-6 lg:px-10 max-w-[1280px] mx-auto">
      {/* HEADER */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 mb-4 w-fit">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm">
            location_on
          </span>
          <span className="text-green-700 dark:text-green-400 text-[10px] font-bold tracking-wider uppercase">
            Infraestructura Académica
          </span>
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-extrabold text-green-900 dark:text-green-400 leading-tight mb-4">
          Escenarios · UES San José del Rincón
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl leading-relaxed">
          Espacios diseñados para la excelencia, la innovación y el intercambio de conocimientos en el corazón de nuestra institución.
        </p>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {escenariosMostrar.map((escenario) => (
          <div 
            key={escenario.id}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-[4/3]">
              <img 
                src={escenario.imagen} 
                alt={escenario.nombre} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop';
                }}
              />
              <span className="absolute top-4 right-4 bg-green-700 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                {escenario.sesiones} Sesiones
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
                  {escenario.icono}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {escenario.nombre}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5">
                {escenario.descripcion}
              </p>
              <button 
                onClick={() => handleVerSesiones(escenario.nombre)}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-green-700 dark:text-green-400 font-bold py-3 rounded-xl text-sm transition"
              >
                Ver sesiones
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER SECTION */}
      <div className="text-center pt-10 border-t border-gray-200 dark:border-gray-800">
        <p className="text-green-700 dark:text-green-400 italic text-base mb-8">
          "Cultura que Inspira, Conocimiento que Transforma"
        </p>
        
        <div className="flex flex-wrap justify-center gap-8 lg:gap-12 mb-8">
          {instituciones.map((inst, index) => (
            <span 
              key={index}
              className="text-green-800/50 dark:text-green-400/50 font-semibold text-xs tracking-[0.2em] uppercase"
            >
              {inst}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Escenarios;