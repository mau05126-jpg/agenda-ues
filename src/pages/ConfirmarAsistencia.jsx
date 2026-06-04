import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import logoImg from '../assets/Logo.png';

const ConfirmarAsistencia = ({ setCurrentPage, sesionId }) => {
  const [estado, setEstado] = useState('cargando'); // cargando | listo | confirmando | confirmado | ya_confirmado | error
  const [sesion, setSesion] = useState(null);
  const [totalAsistencias, setTotalAsistencias] = useState(0);
  const [user] = useState(getCurrentUser);

  useEffect(() => {
    if (!user) {
      // Guardar el sesion_id para después del login
      localStorage.setItem('pendiente_confirmar', sesionId);
      setCurrentPage('loginPage');
      return;
    }
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    try {
      const res = await fetch(`/api/sesiones/listar`);
      const data = await res.json();
      if (data.success) {
        const s = data.sesiones.find(s => s.id === parseInt(sesionId));
        if (s) {
          setSesion(s);
          setEstado('listo');
        } else {
          setEstado('error');
        }
      }
    } catch {
      setEstado('error');
    }
  };

  const confirmarAsistencia = async () => {
    setEstado('confirmando');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion_id: parseInt(sesionId) }),
      });
      const data = await res.json();
      if (data.success) {
        setTotalAsistencias(data.totalAsistencias);
        setEstado(data.totalAsistencias > 0 ? 'confirmado' : 'ya_confirmado');
      } else {
        setEstado('error');
      }
    } catch {
      setEstado('error');
    }
  };

  const formatearHora = (h) => {
    if (!h) return '';
    const [hh, mm] = h.split(':').map(Number);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${(hh % 12 || 12).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logoImg} alt="UES" className="h-16 object-contain" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-green-700" />

          <div className="p-8">

            {/* Cargando */}
            {estado === 'cargando' && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Cargando información...</p>
              </div>
            )}

            {/* Listo para confirmar */}
            {(estado === 'listo' || estado === 'confirmando') && sesion && (
              <div className="space-y-5">
                <div className="text-center">
                  <span className="text-4xl">📋</span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-2">Confirmar asistencia</h2>
                  <p className="text-gray-500 text-sm mt-1">12va Jornada Académica y Cultural · UES 2025</p>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 border border-green-100 space-y-2">
                  <p className="font-bold text-gray-900 leading-snug">{sesion.titulo}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    🕐 {formatearHora(sesion.hora?.substring(0, 5))}
                    <span className="mx-1">·</span>
                    📍 {sesion.escenario}
                  </p>
                  <p className="text-sm text-gray-500">
                    👤 {sesion.ponente}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    Confirmando como: <span className="font-bold text-gray-700">{user?.nombre}</span>
                  </p>
                </div>

                <button
                  onClick={confirmarAsistencia}
                  disabled={estado === 'confirmando'}
                  className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-60 text-base"
                >
                  {estado === 'confirmando' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Confirmando...
                    </span>
                  ) : '✅ Confirmar mi asistencia'}
                </button>

                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full text-gray-400 text-sm hover:text-gray-600 transition py-1"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Asistencia confirmada */}
            {estado === 'confirmado' && (
              <div className="text-center space-y-4 py-4">
                <div className="text-6xl">🎉</div>
                <h2 className="text-xl font-extrabold text-gray-900">¡Asistencia confirmada!</h2>
                <p className="text-gray-500 text-sm">
                  Tu asistencia a <span className="font-semibold text-gray-700">{sesion?.titulo}</span> quedó registrada.
                </p>
                <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                  <p className="text-green-800 font-black text-2xl">{totalAsistencias}</p>
                  <p className="text-green-600 text-xs font-bold uppercase tracking-wide mt-0.5">
                    {totalAsistencias === 1 ? 'sesión confirmada' : 'sesiones confirmadas'}
                  </p>
                  {totalAsistencias >= 5 && (
                    <p className="text-green-700 text-sm font-semibold mt-2">
                      🏆 ¡Ya puedes descargar tu constancia!
                    </p>
                  )}
                  {totalAsistencias < 5 && (
                    <p className="text-gray-500 text-xs mt-2">
                      Confirma {5 - totalAsistencias} sesión{5 - totalAsistencias !== 1 ? 'es' : ''} más para obtener tu constancia
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage('miAgenda')}
                  className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-2xl transition-all text-sm"
                >
                  Ver mi agenda
                </button>
              </div>
            )}

            {/* Ya estaba confirmada */}
            {estado === 'ya_confirmado' && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">✅</div>
                <h2 className="text-lg font-extrabold text-gray-900">Ya confirmaste esta sesión</h2>
                <p className="text-gray-500 text-sm">Tu asistencia ya estaba registrada anteriormente.</p>
                <button
                  onClick={() => setCurrentPage('miAgenda')}
                  className="w-full bg-green-700 text-white font-bold py-3 rounded-2xl text-sm"
                >
                  Ver mi agenda
                </button>
              </div>
            )}

            {/* Error */}
            {estado === 'error' && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">❌</div>
                <h2 className="text-lg font-extrabold text-gray-900">Sesión no encontrada</h2>
                <p className="text-gray-500 text-sm">El código QR no corresponde a ninguna sesión activa.</p>
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full bg-gray-700 text-white font-bold py-3 rounded-2xl text-sm"
                >
                  Ir al inicio
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          12va Jornada Académica y Cultural · UES San José del Rincón 2025
        </p>
      </div>
    </div>
  );
};

export default ConfirmarAsistencia;
