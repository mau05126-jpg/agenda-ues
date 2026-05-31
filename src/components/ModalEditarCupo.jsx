// src/components/ModalEditarCupo.jsx
import { useState, useEffect } from 'react';

const ModalEditarCupo = ({ isOpen, onClose, escenario, onSave }) => {
  const [newCapacidad, setNewCapacidad] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('open');
  const [porcentaje, setPorcentaje] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('agendaDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (escenario) {
      setNewCapacidad(escenario.capacidad.toString());
      setRegistrationStatus(escenario.estado === 'lleno' ? 'closed' : 'open');
      setPorcentaje(Math.round((escenario.ocupacion / escenario.capacidad) * 100));
    }
  }, [escenario]);

  const handleSave = () => {
    const nuevaCapacidad = parseInt(newCapacidad);
    if (nuevaCapacidad < escenario.ocupacion) {
      alert(`No puedes reducir la capacidad por debajo de los inscritos actuales (${escenario.ocupacion})`);
      return;
    }
    onSave(escenario.id, nuevaCapacidad, registrationStatus);
    onClose();
  };

  if (!isOpen || !escenario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content - Responsive + Dark Mode */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden mx-auto animate-modal-pop max-h-[90vh] overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
        {/* Header - Responsive */}
        <div className={`px-4 lg:px-6 py-4 border-b flex justify-between items-center transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
          <div>
            <h3 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-gray-100' : 'text-[#1a1c1c]'}`}>Editar Cupo</h3>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {escenario.nombre}
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <span className={`material-symbols-outlined text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>close</span>
          </button>
        </div>

        {/* Content - Responsive */}
        <div className="px-4 lg:px-6 py-5 space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Ocupación Actual
                </p>
                <p className="text-3xl font-black text-[#2E7D32]">{porcentaje}%</p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {escenario.ocupacion} inscritos
                </p>
              </div>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div 
                className="h-full bg-[#2E7D32] rounded-full transition-all duration-500"
                style={{ width: `${porcentaje}%` }}
              ></div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Current Enrollment */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Inscritos Actuales
              </label>
              <div className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-[#1a1c1c]'}`}>{escenario.ocupacion}</span>
              </div>
            </div>

            {/* Total Capacity */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Capacidad Total
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={newCapacidad}
                  onChange={(e) => setNewCapacidad(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border font-bold text-sm outline-none transition-all focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-[#1a1c1c]'}`}
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <span className="material-symbols-outlined text-lg">groups</span>
                </div>
              </div>
            </div>

            {/* Registration Status Toggle */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Estado de Registro
              </label>
              <div className={`flex p-1 rounded-lg gap-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setRegistrationStatus('open')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    registrationStatus === 'open' 
                      ? darkMode ? 'bg-gray-700 text-[#66BB6A] shadow-sm border border-gray-600' : 'bg-white text-[#2E7D32] shadow-sm border border-gray-200'
                      : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Abierto
                </button>
                <button
                  onClick={() => setRegistrationStatus('closed')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    registrationStatus === 'closed' 
                      ? darkMode ? 'bg-gray-700 text-[#66BB6A] shadow-sm border border-gray-600' : 'bg-white text-[#2E7D32] shadow-sm border border-gray-200'
                      : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Cerrado
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Responsive */}
        <div className={`px-4 lg:px-6 py-4 flex flex-col gap-2 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <button 
            onClick={handleSave}
            className="w-full bg-[#2E7D32] text-white py-3 rounded-lg font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            Actualizar Cupo
          </button>
          <button 
            onClick={onClose}
            className={`w-full py-2 rounded-lg font-semibold text-xs transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Cancelar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-pop { animation: modal-pop 0.2s ease-out; }
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #1e293b; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
};

export default ModalEditarCupo;