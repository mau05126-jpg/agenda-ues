import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentUser, logoutUser } from '../services/authService';
import logoImg from '../assets/Logo.png';

const BASE_URL = 'https://agenda-ues.vercel.app';

const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const formatFecha = (f) => {
  if (!f) return '';
  const [y, m, d] = String(f).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS_ES[date.getDay()]} ${d} de ${MESES_ES[m - 1]}`;
};

const formatHora = (h) => {
  if (!h) return '';
  const [hh, mm] = h.split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${(hh % 12 || 12).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
};

const AdminQR = ({ setCurrentPage }) => {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtrodia, setFiltroDia] = useState('todas');
  const [selected, setSelected] = useState(null);
  const [asistentes, setAsistentes] = useState([]);
  const [loadingAsistentes, setLoadingAsistentes] = useState(false);
  const [darkMode] = useState(() => localStorage.getItem('agendaDarkMode') === 'true');

  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.rol !== 'admin') { setCurrentPage('loginPage'); return; }
    cargarSesiones();
  }, []);

  const cargarSesiones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/asistencias', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSesiones(data.sesiones);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const verAsistentes = async (sesion) => {
    setSelected(sesion);
    setLoadingAsistentes(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/asistencias?sesion_id=${sesion.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAsistentes(data.asistencias);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAsistentes(false);
    }
  };

  const dias = ['todas', ...new Set(sesiones.map(s => {
    if (!s.fecha) return null;
    const d = parseInt(String(s.fecha).substring(8, 10), 10);
    return d >= 1 && d <= 5 ? `Día ${d}` : null;
  }).filter(Boolean))].sort();

  const sesionesFiltradas = sesiones.filter(s => {
    if (filtrodia === 'todas') return true;
    const d = parseInt(String(s.fecha).substring(8, 10), 10);
    return `Día ${d}` === filtrodia;
  });

  const imprimirQR = (sesion) => {
    const ventana = window.open('', '_blank');
    const url = `${BASE_URL}/?confirmar=${sesion.id}`;
    ventana.document.write(`
      <html><head><title>QR - ${sesion.titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
        h2 { font-size: 18px; text-align: center; margin-bottom: 8px; }
        p { font-size: 13px; color: #555; text-align: center; margin: 4px 0; }
        .qr { margin: 20px auto; display: block; }
        .url { font-size: 10px; color: #888; word-break: break-all; margin-top: 10px; max-width: 280px; text-align: center; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <img src="${window.location.origin}/Logo.png" style="height:60px;margin-bottom:12px" onerror="this.style.display='none'"/>
      <h2>${sesion.titulo}</h2>
      <p>${formatFecha(sesion.fecha)} · ${formatHora(sesion.hora?.substring(0,5))}</p>
      <p>${sesion.escenario}</p>
      <svg class="qr" id="qr" width="220" height="220"></svg>
      <p class="url">${url}</p>
      <p style="margin-top:16px;font-size:11px;color:#888">Escanea para confirmar tu asistencia</p>
      <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${url}', {width:220}, function(err, canvas) {
          if (!err) document.getElementById('qr').replaceWith(canvas);
          setTimeout(() => window.print(), 500);
        });
      </script>
      </body></html>
    `);
    ventana.document.close();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Navbar admin */}
      <nav className={`fixed top-0 w-full z-50 h-16 flex items-center px-6 border-b shadow-sm ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <button onClick={() => setCurrentPage('admin')} className="flex items-center gap-2 mr-6">
          <span className="material-symbols-outlined text-green-600">arrow_back</span>
          <img src={logoImg} alt="UES" className="h-8 object-contain" />
        </button>
        <h1 className="font-extrabold text-lg">QR de Asistencias</h1>
      </nav>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold">Códigos QR por sesión</h2>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Muestra o imprime el QR en cada sesión para que los estudiantes confirmen su asistencia.
          </p>
        </div>

        {/* Filtro días */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {dias.map(d => (
            <button
              key={d}
              onClick={() => setFiltroDia(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition ${filtrodia === d ? 'bg-green-700 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'}`}
            >
              {d === 'todas' ? 'Todos los días' : d}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Grid de QRs */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sesionesFiltradas.map(s => {
              const url = `${BASE_URL}/?confirmar=${s.id}`;
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                >
                  <div className="h-1 bg-green-600" />
                  <div className="p-5">
                    {/* Info sesión */}
                    <div className="mb-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-800'}`}>
                        {s.categoria}
                      </span>
                      <h3 className="font-bold text-sm mt-2 leading-snug">{s.titulo}</h3>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFecha(s.fecha)} · {formatHora(s.hora?.substring(0,5))}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>📍 {s.escenario}</p>
                    </div>

                    {/* QR + código */}
                    <div className="flex flex-col items-center mb-4 gap-2">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                        <QRCodeSVG value={url} size={160} level="M" />
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <span className="material-symbols-outlined text-sm text-blue-500">tag</span>
                        <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Código:</span>
                        <span className="text-lg font-black text-blue-600">{s.id}</span>
                      </div>
                    </div>

                    {/* Stats + botones */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => verAsistentes(s)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        <span className="material-symbols-outlined text-sm">group</span>
                        {s.total_asistentes} {s.total_asistentes === 1 ? 'asistente' : 'asistentes'}
                      </button>
                      <button
                        onClick={() => imprimirQR(s)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-700 text-white hover:bg-green-600 transition"
                      >
                        <span className="material-symbols-outlined text-sm">print</span>
                        Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal asistentes */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setSelected(null)}>
          <div
            className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1 bg-green-600 flex-shrink-0" />
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base">{selected.titulo}</h3>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatFecha(selected.fecha)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <span className="material-symbols-outlined text-gray-400 text-xl">close</span>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {loadingAsistentes ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : asistentes.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl">📭</span>
                  <p className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nadie ha confirmado asistencia aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {asistentes.length} {asistentes.length === 1 ? 'asistente confirmado' : 'asistentes confirmados'}
                  </p>
                  {asistentes.map((a, i) => (
                    <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {a.nombre?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{a.nombre}</p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.matricula || a.email}</p>
                      </div>
                      <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>#{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQR;
