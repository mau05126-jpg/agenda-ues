const HeroSection = () => {
  return (
    <section className="relative w-full min-h-screen pt-16 flex flex-col">
      <div className="absolute inset-0 pt-16">
        <img 
          src="/hero-bg.png"
          alt="Edificio UES" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-10 max-w-[1280px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
          <div className="max-w-lg">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 mb-4 w-fit backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              <span className="text-white/90 text-[10px] font-bold tracking-wider uppercase">
                Edición 2025
              </span>
            </div>
            
            <h1 className="text-white text-5xl font-extrabold leading-[1.05] tracking-tight mb-3 drop-shadow-lg">
              12va Jornada<br />Académica y<br />Cultural 2025
            </h1>
            
            <p className="text-gray-200 text-lg font-medium mb-4 drop-shadow-md">
              Cultura que Inspira, Conocimiento que Transforma.
            </p>
            
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-200 mb-6">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-400">calendar_today</span>
                1 al 5 de diciembre de 2025
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-400">location_on</span>
                UES San José del Rincón
              </span>
            </div>
            
          </div>
          
          <div className="flex gap-4 flex-wrap justify-center lg:justify-end">
            <div className="glass-card w-44 h-44 rounded-2xl flex flex-col items-center justify-center text-white">
              <span className="material-symbols-outlined text-green-400 text-3xl mb-3">calendar_month</span>
              <div className="text-5xl font-extrabold mb-1">5</div>
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-300">
                Días de Evento
              </div>
            </div>
            
            <div className="glass-card w-44 h-44 rounded-2xl flex flex-col items-center justify-center text-white">
              <span className="material-symbols-outlined text-green-400 text-3xl mb-3">mic</span>
              <div className="text-5xl font-extrabold mb-1">14+</div>
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-300">
                Conferencistas
              </div>
            </div>
            
            <div className="glass-card w-44 h-44 rounded-2xl flex flex-col items-center justify-center text-white">
              <span className="material-symbols-outlined text-green-400 text-3xl mb-3">school</span>
              <div className="text-5xl font-extrabold mb-1">20+</div>
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-300">
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