import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentUser, logoutUser } from '../services/authService';
import logoImg from '../assets/Logo.png';
import umbImg   from '../assets/umbb.png';

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
    const logoLeft  = window.location.origin + umbImg;
    const logoRight = window.location.origin + logoImg;
    const today = new Date();
    const folio = `QR-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${String(sesion.id).padStart(3,'0')}`;

    ventana.document.write(`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/>
<title>QR — ${sesion.titulo}</title>
<style>
  @page { margin: 0; size: letter portrait; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { margin: 0; padding: 0; font-family: "Segoe UI", Arial, sans-serif; background: #fff; color: #111827; }

  .page {
    width: 816px; height: 1056px;
    margin: 0 auto;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }

  /* Barras */
  .bar-top    { height: 7px; background: linear-gradient(90deg,#1B5E20 0%,#2E7D32 50%,#66BB6A 100%); }
  .bar-bottom { height: 5px; background: linear-gradient(90deg,#66BB6A,#2E7D32 50%,#1B5E20); margin-top: auto; }

  /* Cabecera */
  .header {
    padding: 28px 48px 20px;
    display: flex; align-items: center; gap: 20px;
    border-bottom: 1px solid #e5e7eb;
  }
  .header img { width: 90px; height: 90px; object-fit: contain; flex-shrink: 0; }
  .header-center { flex: 1; text-align: center; }
  .header-center .inst {
    font-size: 8px; font-weight: 700; color: #2E7D32;
    letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 5px;
  }
  .divider-line {
    display: flex; align-items: center; gap: 8px; justify-content: center; margin: 0 0 8px;
  }
  .divider-line .line { height: 1px; width: 50px; background: linear-gradient(to right,transparent,#1B5E20); }
  .divider-line .line.rev { background: linear-gradient(to left,transparent,#1B5E20); }
  .header-center h1 {
    font-size: 16px; font-weight: 900; color: #1B5E20; margin: 0;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .header-center .sub {
    font-size: 9px; color: #6b7280; margin: 4px 0 0; letter-spacing: 0.08em;
  }

  /* Cuerpo */
  .body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 48px; gap: 20px; }

  /* Tarjeta de sesión */
  .session-card {
    width: 100%; background: #f8fdf8;
    border: 1.5px solid #c8e6c9; border-radius: 12px;
    padding: 20px 28px; text-align: center;
  }
  .session-badge {
    display: inline-block; background: #1B5E20; color: white;
    font-size: 9px; font-weight: 800; letter-spacing: 0.14em;
    text-transform: uppercase; padding: 3px 12px; border-radius: 20px; margin-bottom: 10px;
  }
  .session-title { font-size: 20px; font-weight: 900; color: #111827; margin: 0 0 10px; line-height: 1.3; }
  .session-meta { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
  .meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #374151; }
  .meta-item .icon { font-size: 15px; color: #2E7D32; }

  /* QR */
  .qr-wrapper {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .qr-box {
    background: white; border: 2.5px solid #1B5E20; border-radius: 16px;
    padding: 16px; box-shadow: 0 4px 24px rgba(27,94,32,0.12);
  }
  #qrcanvas { display: block; }

  .code-badge {
    display: inline-flex; align-items: center; gap: 10px;
    background: #f0fdf4; border: 1.5px solid #86efac;
    border-radius: 40px; padding: 10px 28px;
  }
  .code-label { font-size: 12px; color: #6b7280; font-weight: 600; }
  .code-value { font-size: 32px; font-weight: 900; color: #15803d; letter-spacing: 0.08em; font-family: monospace; }

  .qr-hint {
    font-size: 12px; color: #6b7280; text-align: center;
    font-style: italic; max-width: 360px; line-height: 1.6;
  }
  .qr-url {
    font-size: 9px; color: #9ca3af; word-break: break-all;
    text-align: center; max-width: 400px;
    background: #f9fafb; border: 1px solid #e5e7eb;
    border-radius: 6px; padding: 4px 10px; font-family: monospace;
  }

  /* Pie */
  .footer {
    padding: 14px 48px;
    background: #f8fafc; border-top: 1.5px solid #c8e6c9;
    display: flex; align-items: center; gap: 16px;
  }
  .seal {
    width: 52px; height: 52px; border-radius: 50%;
    border: 2.5px solid #1B5E20; background: white;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    box-shadow: 0 0 0 4px #e8f5e9; flex-shrink: 0;
  }
  .seal-icon { font-size: 20px; color: #1B5E20; }
  .seal-text { font-size: 5.5px; font-weight: 900; color: #1B5E20; text-align: center; line-height: 1.2; text-transform: uppercase; }
  .seal-info { line-height: 1.4; }
  .seal-info .title { font-size: 9px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.06em; }
  .seal-info .sub   { font-size: 8px; color: #6b7280; }
  .seal-info .folio { font-size: 7px; color: #9ca3af; font-family: monospace; }
  .lema { flex: 1; text-align: center; font-size: 10px; font-style: italic; color: #1B5E20; font-weight: 600; line-height: 1.6; }
</style>
</head>
<body>
<div class="page">
  <div class="bar-top"></div>

  <!-- Cabecera -->
  <div class="header">
    <img src="${logoLeft}" onerror="this.style.opacity=0" alt="UMB"/>
    <div class="header-center">
      <p class="inst">Universidad Mexiquense del Bicentenario — Unidad de Estudios Superiores San José del Rincón</p>
      <div class="divider-line">
        <div class="line"></div>
        <span style="font-size:14px;color:#2E7D32">★</span>
        <div class="line rev"></div>
      </div>
      <h1>Código QR de Asistencia</h1>
      <p class="sub">12va Jornada Académica y Cultural 2025</p>
    </div>
    <img src="${logoRight}" onerror="this.style.opacity=0" alt="Logo"/>
  </div>

  <!-- Cuerpo -->
  <div class="body">

    <!-- Tarjeta sesión -->
    <div class="session-card">
      <span class="session-badge">${sesion.categoria || 'Sesión'}</span>
      <h2 class="session-title">${sesion.titulo}</h2>
      <div class="session-meta">
        <div class="meta-item">
          <span class="icon">📅</span>
          <span>${formatFecha(sesion.fecha)}</span>
        </div>
        <div class="meta-item">
          <span class="icon">🕐</span>
          <span>${formatHora(sesion.hora?.substring(0,5))}</span>
        </div>
        <div class="meta-item">
          <span class="icon">📍</span>
          <span>${sesion.escenario || '—'}</span>
        </div>
      </div>
    </div>

    <!-- QR -->
    <div class="qr-wrapper">
      <div class="qr-box">
        <canvas id="qrcanvas"></canvas>
      </div>

      <div class="code-badge">
        <span class="code-label">Código manual:</span>
        <span class="code-value">${sesion.id}</span>
      </div>

      <p class="qr-hint">
        Escanea el código QR con la cámara de tu teléfono para confirmar asistencia,<br/>
        o ingrésalo manualmente en la aplicación.
      </p>

      <div class="qr-url">${url}</div>
    </div>

  </div>

  <!-- Pie -->
  <div class="footer">
    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
      <div class="seal">
        <span class="seal-icon">✔</span>
        <span class="seal-text">VÁLIDO<br/>UMB</span>
      </div>
      <div class="seal-info">
        <div class="title">Sello Oficial</div>
        <div class="sub">Validez institucional garantizada</div>
        <div class="folio">${folio}</div>
      </div>
    </div>
    <div class="lema">"Cultura que inspira, conocimiento que transforma"</div>
  </div>

  <div class="bar-bottom"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
<script>
  QRCode.toCanvas(document.getElementById('qrcanvas'), '${url}', {
    width: 240, margin: 1, color: { dark: '#1B5E20', light: '#ffffff' }
  }, function(err) {
    setTimeout(function() { window.print(); }, 600);
  });
</script>
</body></html>`);
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

                    {/* QR */}
                    <div className="flex flex-col items-center mb-4 gap-2">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                        <QRCodeSVG value={url} size={160} level="M" />
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                        <span className="material-symbols-outlined text-sm">tag</span>
                        Código: <span className="text-green-600 dark:text-green-400 font-black text-sm">{s.id}</span>
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
