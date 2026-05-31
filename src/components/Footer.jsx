const instituciones = ['COMECyT', 'TESVB', 'UAQ', 'UIEM', 'TECNM', 'CCPVT'];

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-6">
        <div className="text-center mb-8">
          <h4 className="text-[10px] font-bold text-green-900 dark:text-green-400 tracking-[0.3em] uppercase mb-3 transition-colors">
            AgendaUES
          </h4>
          <p className="text-green-700 dark:text-green-300 italic text-sm transition-colors">
            "Cultura que Inspira, Conocimiento que Transforma"
          </p>
        </div>
        
        <div className="flex justify-center gap-5 mb-8 text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest transition-colors">
          {instituciones.map((inst, index) => (
            <a 
              key={index}
              href="#" 
              className="hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              {inst}
            </a>
          ))}
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 transition-colors">
          <p>© 2025 Universidad Mexiquense del Bicentenario. Todos los derechos reservados.</p>
          <div className="flex gap-6 mt-3 md:mt-0">
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-200 transition">Privacidad</a>
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-200 transition">Términos</a>
            <a href="#" className="hover:text-gray-700 dark:hover:text-gray-200 transition">Contacto</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;