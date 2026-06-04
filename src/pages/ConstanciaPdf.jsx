import { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../services/authService';
import logoImg from '../assets/Logo.png';

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const formatFecha = (f) => {
  if (!f) return '';
  const [y, m, d] = String(f).split('T')[0].split('-').map(Number);
  return `${d} de ${MESES_ES[m - 1]} de ${y}`;
};

const formatHora = (h) => {
  if (!h) return '';
  const [hh, mm] = h.split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${(hh % 12 || 12).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
};

const ConstanciaPdf = ({ setCurrentPage }) => {
  const [user] = useState(getCurrentUser);
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [zoom, setZoom] = useState(90);
  const hoy = new Date();
  const fechaEmision = `${hoy.getDate()} de ${MESES_ES[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  useEffect(() => {
    if (!user) { setCurrentPage('loginPage'); return; }
    cargarAsistencias();
  }, []);

  const cargarAsistencias = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/asistencias?mis=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAsistencias(data.asistencias);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (asistencias.length < 5) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="h-1 w-full bg-green-600 rounded-t-3xl -mt-8 -mx-8 mb-8 rounded-none" style={{marginTop:'-2rem',marginLeft:'-2rem',marginRight:'-2rem',borderRadius:'1.5rem 1.5rem 0 0'}} />
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Constancia no disponible</h2>
          <p className="text-gray-500 text-sm mb-2">
            Necesitas confirmar asistencia a al menos <span className="font-bold text-green-700">5 sesiones</span> mediante QR para obtener tu constancia.
          </p>
          <div className="bg-green-50 rounded-xl p-3 border border-green-100 my-4">
            <p className="text-2xl font-extrabold text-green-700">{asistencias.length} / 5</p>
            <p className="text-xs text-green-600 font-semibold">sesiones confirmadas</p>
          </div>
          <button onClick={() => setCurrentPage('miAgenda')} className="w-full bg-green-700 text-white font-bold py-3 rounded-xl text-sm mt-2">
            Volver a Mi Agenda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-8 px-4">
      {/* Toolbar */}
      <div className="max-w-[900px] mx-auto mb-4 flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => setCurrentPage('miAgenda')}
          className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Regresar
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="bg-white border border-gray-300 text-gray-600 w-8 h-8 rounded-lg text-lg font-bold hover:bg-gray-50 flex items-center justify-center">-</button>
          <span className="text-sm font-bold text-gray-600 w-12 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="bg-white border border-gray-300 text-gray-600 w-8 h-8 rounded-lg text-lg font-bold hover:bg-gray-50 flex items-center justify-center">+</button>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition"
        >
          <span className="material-symbols-outlined text-sm">print</span>
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Hoja constancia */}
      <div
        className="mx-auto bg-white shadow-2xl origin-top"
        style={{
          width: '794px',
          minHeight: '1123px',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          marginBottom: `${(zoom / 100 - 1) * 1123}px`,
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Borde decorativo */}
        <div style={{border: '12px double #1b5e20', margin: '20px', minHeight: 'calc(1123px - 40px)', display: 'flex', flexDirection: 'column', padding: '40px 50px'}}>

          {/* Encabezado */}
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '16px'}}>
            <img src={logoImg} alt="UES" style={{height: '80px', objectFit: 'contain'}} />
            <div style={{textAlign: 'center'}}>
              <p style={{fontSize: '11px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px'}}>Universidad del Ejército y Fuerza Aérea</p>
              <p style={{fontSize: '13px', fontWeight: 'bold', color: '#1b5e20', letterSpacing: '1px', textTransform: 'uppercase'}}>San José del Rincón, Estado de México</p>
            </div>
          </div>

          <div style={{height: '2px', background: 'linear-gradient(to right, transparent, #1b5e20, transparent)', margin: '12px 0 20px'}} />

          {/* Título constancia */}
          <div style={{textAlign: 'center', marginBottom: '28px'}}>
            <h1 style={{fontSize: '28px', fontWeight: 'bold', color: '#1b5e20', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px'}}>
              Constancia de Participación
            </h1>
            <p style={{fontSize: '14px', color: '#555', letterSpacing: '1px'}}>
              12va Jornada Académica y Cultural 2025
            </p>
          </div>

          {/* Texto principal */}
          <div style={{textAlign: 'center', marginBottom: '32px', lineHeight: '2'}}>
            <p style={{fontSize: '14px', color: '#333'}}>La <strong>Universidad del Ejército y Fuerza Aérea, Unidad San José del Rincón</strong></p>
            <p style={{fontSize: '14px', color: '#333', marginBottom: '8px'}}>hace constar que:</p>
            <p style={{fontSize: '26px', fontWeight: 'bold', color: '#1b5e20', letterSpacing: '1px', margin: '8px 0'}}>
              {user?.nombre}
            </p>
            {user?.matricula && (
              <p style={{fontSize: '13px', color: '#777'}}>Matrícula: {user.matricula}</p>
            )}
            <p style={{fontSize: '14px', color: '#333', marginTop: '8px'}}>
              participó como <strong>asistente</strong> en las siguientes sesiones de la
            </p>
            <p style={{fontSize: '14px', color: '#333'}}>
              <strong>12va Jornada Académica y Cultural 2025</strong>
            </p>
          </div>

          {/* Tabla de sesiones */}
          <div style={{marginBottom: '32px'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '12px'}}>
              <thead>
                <tr style={{background: '#1b5e20', color: 'white'}}>
                  <th style={{padding: '8px 12px', textAlign: 'left', letterSpacing: '1px', fontSize: '10px', textTransform: 'uppercase'}}>#</th>
                  <th style={{padding: '8px 12px', textAlign: 'left', letterSpacing: '1px', fontSize: '10px', textTransform: 'uppercase'}}>Sesión</th>
                  <th style={{padding: '8px 12px', textAlign: 'left', letterSpacing: '1px', fontSize: '10px', textTransform: 'uppercase'}}>Ponente</th>
                  <th style={{padding: '8px 12px', textAlign: 'center', letterSpacing: '1px', fontSize: '10px', textTransform: 'uppercase'}}>Fecha</th>
                  <th style={{padding: '8px 12px', textAlign: 'center', letterSpacing: '1px', fontSize: '10px', textTransform: 'uppercase'}}>Hora</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map((a, i) => (
                  <tr key={a.id} style={{background: i % 2 === 0 ? '#f8fdf8' : 'white', borderBottom: '1px solid #e0e0e0'}}>
                    <td style={{padding: '8px 12px', color: '#1b5e20', fontWeight: 'bold'}}>{i + 1}</td>
                    <td style={{padding: '8px 12px', color: '#222'}}>{a.titulo}</td>
                    <td style={{padding: '8px 12px', color: '#555'}}>{a.ponente || '—'}</td>
                    <td style={{padding: '8px 12px', textAlign: 'center', color: '#555'}}>{formatFecha(a.fecha)}</td>
                    <td style={{padding: '8px 12px', textAlign: 'center', color: '#555'}}>{formatHora(a.hora?.substring(0,5))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pie */}
          <div style={{flex: 1}} />

          <div style={{textAlign: 'center', marginBottom: '40px'}}>
            <p style={{fontSize: '13px', color: '#555'}}>
              Constancia emitida el <strong>{fechaEmision}</strong>
            </p>
          </div>

          {/* Firmas */}
          <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', gap: '40px'}}>
            {[
              { nombre: 'Coordinación Académica', titulo: 'UES San José del Rincón' },
              { nombre: 'Dirección del Evento', titulo: '12va Jornada 2025' },
            ].map((f, i) => (
              <div key={i} style={{textAlign: 'center', flex: 1}}>
                <div style={{borderTop: '1.5px solid #333', paddingTop: '8px', marginTop: '60px'}}>
                  <p style={{fontSize: '12px', fontWeight: 'bold', color: '#222'}}>{f.nombre}</p>
                  <p style={{fontSize: '11px', color: '#777'}}>{f.titulo}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{height: '2px', background: 'linear-gradient(to right, transparent, #1b5e20, transparent)', margin: '24px 0 0'}} />

          <p style={{textAlign: 'center', fontSize: '10px', color: '#aaa', letterSpacing: '1px', marginTop: '8px'}}>
            "Cultura que Inspira, Conocimiento que Transforma" · agenda-ues.vercel.app
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body > *:not(.constancia-print) { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default ConstanciaPdf;
