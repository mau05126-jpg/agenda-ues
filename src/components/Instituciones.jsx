import uaemex        from '../assets/Logo_de_la_UAEMex.svg';
import testsfp       from '../assets/Testsfp.png';
import recurso4      from '../assets/Recurso-4.webp';
import intercultural from '../assets/intercultural.webp';
import comecyt       from '../assets/comecyt.png';
import queretaro     from '../assets/universidad-queretaro-escudo.png';
import valle         from '../assets/valle.png';
import tec           from '../assets/tec.png';

const imagenes = [uaemex, testsfp, recurso4, intercultural, comecyt, queretaro, valle, tec];

const Instituciones = () => {
  // Duplicar para que el loop sea continuo
  const items = [...imagenes, ...imagenes];

  return (
    <section className="bg-[#f5f5f5] dark:bg-gray-800 py-12 transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 text-center mb-8">
        <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-[0.25em] uppercase transition-colors">
          Instituciones Participantes
        </h3>
      </div>

      <div className="relative w-full overflow-hidden">
        {/* Degradados en los bordes para efecto de fundido */}
        <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-r from-[#f5f5f5] dark:from-gray-800 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-l from-[#f5f5f5] dark:from-gray-800 to-transparent" />

        <div className="flex items-center carousel-track">
          {items.map((src, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-8 w-28 h-16 flex items-center justify-center"
            >
              <img
                src={src}
                alt={`Institución ${(i % imagenes.length) + 1}`}
                className="max-w-full max-h-full object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .carousel-track {
          animation: carousel-scroll 18s linear infinite;
          width: max-content;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes carousel-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-color-scheme: dark) {
          .carousel-fade-left  { background: linear-gradient(to right, #1f2937, transparent); }
          .carousel-fade-right { background: linear-gradient(to left,  #1f2937, transparent); }
        }
      `}</style>
    </section>
  );
};

export default Instituciones;
