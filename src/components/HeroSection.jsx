const cardStyle = {
  background: 'linear-gradient(135deg, rgba(0,30,10,0.75) 0%, rgba(0,0,0,0.65) 100%)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(74,222,128,0.25)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const HeroSection = () => {
  return (
    <section className="relative w-full pt-16 flex flex-col" style={{ minHeight: '100svh' }}>
      <div className="absolute inset-0 pt-16">
        <img
          src="/hero-bg.png"
          alt="Edificio UES"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/75 lg:bg-gradient-to-r lg:from-black/40 lg:via-transparent lg:to-transparent"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between sm:justify-end px-4 sm:px-8 pt-4 sm:pt-0 pb-6 sm:pb-10 max-w-[1280px] mx-auto w-full">

        {/* Badge — arriba en móvil, oculto en desktop (va inline abajo) */}
        <div className="sm:hidden inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 w-fit backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
          <span className="text-white/90 text-[10px] font-bold tracking-wider uppercase">Edición 2025</span>
        </div>

        {/* Contenido inferior */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-4 lg:gap-8">

          {/* Texto principal */}
          <div className="max-w-lg w-full">
            {/* Badge — solo en desktop */}
            <div className="hidden sm:inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 mb-3 w-fit backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              <span className="text-white/90 text-[10px] font-bold tracking-wider uppercase">Edición 2025</span>
            </div>

            <h1 className="text-white text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-2 sm:mb-3 drop-shadow-lg">
              12va Jornada<br />Académica y<br />Cultural 2025
            </h1>

            <p className="text-gray-200 text-sm sm:text-lg font-medium mb-2 sm:mb-4 drop-shadow-md">
              Cultura que Inspira, Conocimiento que Transforma.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm text-gray-200 mb-4 sm:mb-6">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-400 text-base sm:text-xl">calendar_today</span>
                1 al 5 de diciembre de 2025
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-400 text-base sm:text-xl">location_on</span>
                UES San José del Rincón
              </span>
            </div>
          </div>

          {/* Tarjetas — fila única siempre */}
          <div className="flex gap-3 w-full lg:w-auto lg:flex-none">
            <div className="flex-1 lg:flex-none lg:w-44 h-[88px] sm:h-32 lg:h-44 rounded-2xl flex flex-col items-center justify-center text-white" style={cardStyle}>
              <span className="material-symbols-outlined text-green-400 text-xl lg:text-3xl mb-1 lg:mb-3">calendar_month</span>
              <div className="text-3xl lg:text-5xl font-extrabold mb-0.5 lg:mb-1">5</div>
              <div className="text-[8px] lg:text-[10px] font-bold tracking-[0.12em] uppercase text-gray-300 text-center px-1">
                Días de Evento
              </div>
            </div>

            <div className="flex-1 lg:flex-none lg:w-44 h-[88px] sm:h-32 lg:h-44 rounded-2xl flex flex-col items-center justify-center text-white" style={cardStyle}>
              <span className="material-symbols-outlined text-green-400 text-xl lg:text-3xl mb-1 lg:mb-3">mic</span>
              <div className="text-3xl lg:text-5xl font-extrabold mb-0.5 lg:mb-1">14+</div>
              <div className="text-[8px] lg:text-[10px] font-bold tracking-[0.12em] uppercase text-gray-300 text-center px-1">
                Conferencistas
              </div>
            </div>

            <div className="flex-1 lg:flex-none lg:w-44 h-[88px] sm:h-32 lg:h-44 rounded-2xl flex flex-col items-center justify-center text-white" style={cardStyle}>
              <span className="material-symbols-outlined text-green-400 text-xl lg:text-3xl mb-1 lg:mb-3">school</span>
              <div className="text-3xl lg:text-5xl font-extrabold mb-0.5 lg:mb-1">20+</div>
              <div className="text-[8px] lg:text-[10px] font-bold tracking-[0.12em] uppercase text-gray-300 text-center px-1">
                Sesiones Académicas
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;