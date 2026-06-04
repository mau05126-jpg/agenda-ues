import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import logoImg from '../assets/Logo.png';
import umbImg  from '../assets/umbb.png';

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

const parseFechaLocal = (f) => {
  if (!f) return null;
  const parte = String(f).split('T')[0];
  const [y, m, d] = parte.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatFechaLarga = (f) => {
  const d = parseFechaLocal(f);
  if (!d) return '';
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return `${dias[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
};

const formatHora = (h) => {
  if (!h) return '';
  const [hh, mm] = h.substring(0,5).split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${(hh % 12 || 12).toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')} ${ampm}`;
};

/* ── Componente principal ── */
const ConstanciaPdf = ({ setCurrentPage }) => {
  const [zoom, setZoom]           = useState(100);
  const [user]                    = useState(getCurrentUser);
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    if (!user) { setCurrentPage('loginPage'); return; }
    cargarAsistencias();
  }, []);

  const cargarAsistencias = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/asistencias?mis=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data  = await res.json();
      if (data.success) setAsistencias(data.asistencias);
    } catch (e) { console.error(e); }
    finally     { setCargando(false); }
  };

  const today        = new Date();
  const fechaEmision = `${today.getDate()} de ${MESES_ES[today.getMonth()]} de ${today.getFullYear()}`;
  const folio        = `CONST-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${(user?.matricula || '000').slice(-4)}`;

  /* Sin suficientes sesiones */
  if (!cargando && asistencias.length < 5) {
    return (
      <div style={{ minHeight:'100vh', background:'#f0f4f0', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'"Segoe UI", system-ui, sans-serif' }}>
        <div style={{ background:'white', borderRadius:'20px', overflow:'hidden', maxWidth:'380px', width:'100%', boxShadow:'0 8px 40px rgba(0,0,0,0.12)' }}>
          <div style={{ height:'6px', background:'linear-gradient(90deg,#1B5E20,#43A047)' }} />
          <div style={{ padding:'36px', textAlign:'center' }}>
            <div style={{ fontSize:'52px', marginBottom:'16px' }}>🏆</div>
            <h2 style={{ fontSize:'20px', fontWeight:900, color:'#111827', margin:'0 0 8px' }}>Constancia no disponible</h2>
            <p style={{ fontSize:'14px', color:'#6b7280', margin:'0 0 16px', lineHeight:1.6 }}>
              Necesitas confirmar tu asistencia a al menos <strong style={{color:'#1B5E20'}}>5 sesiones</strong> mediante el lector QR.
            </p>
            <div style={{ background:'#f0fdf4', border:'1px solid #c8e6c9', borderRadius:'12px', padding:'16px', margin:'0 0 20px' }}>
              <p style={{ fontSize:'28px', fontWeight:900, color:'#1B5E20', margin:0 }}>{asistencias.length} <span style={{fontSize:'14px', fontWeight:600, color:'#6b7280'}}>/ 5</span></p>
              <p style={{ fontSize:'12px', color:'#2E7D32', fontWeight:700, margin:'4px 0 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>sesiones confirmadas</p>
            </div>
            <button
              onClick={() => setCurrentPage('miAgenda')}
              style={{ width:'100%', background:'#1B5E20', color:'white', fontWeight:700, padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'13px' }}
            >
              Volver a Mi Agenda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col print:h-auto print:block print:overflow-visible" style={{ fontFamily:'"Segoe UI", system-ui, sans-serif' }}>

      {/* ══════ TOOLBAR ══════ */}
      <div
        className="flex items-center justify-between shrink-0 print:hidden"
        style={{ background:'#F1F8F1', borderBottom:'1px solid rgba(46,125,50,0.18)', height:'60px', padding:'0 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', gap:'12px' }}
      >
        {/* Izquierda */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', minWidth:'220px' }}>
          <button onClick={() => setCurrentPage('miAgenda')} style={navBtn}>
            <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>arrow_back</span>
            <span style={{ fontSize:'13px', fontWeight:700 }}>Volver</span>
          </button>
          <div style={{ width:'1px', height:'28px', background:'#c8e6c9' }} />
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1.25 }}>
            <span style={{ fontWeight:800, fontSize:'13px', color:'#166534', letterSpacing:'0.04em' }}>CONSTANCIA</span>
            <span style={{ fontSize:'10px', color:'#43A047', letterSpacing:'0.07em' }}>Vista de impresión</span>
          </div>
        </div>

        {/* Centro */}
        <div style={{ flex:1, textAlign:'center', overflow:'hidden', padding:'0 12px' }}>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#374151', display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            Constancia de Participación — {user?.nombre || 'Estudiante'} — Jornada 2025
          </span>
          {cargando && <span style={{ fontSize:'10px', color:'#9ca3af' }}>Cargando asistencias…</span>}
        </div>

        {/* Derecha */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:'220px', justifyContent:'flex-end' }}>
          <div style={{ display:'flex', alignItems:'center', border:'1px solid #d1d5db', borderRadius:'8px', overflow:'hidden', background:'white' }}>
            <button onClick={() => setZoom(z => Math.max(z-10, 50))} style={zoomBtn}>
              <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>remove</span>
            </button>
            <span style={{ padding:'0 10px', fontSize:'12px', fontWeight:700, color:'#374151', borderLeft:'1px solid #e5e7eb', borderRight:'1px solid #e5e7eb', userSelect:'none' }}>
              {zoom}%
            </span>
            <button onClick={() => setZoom(z => Math.min(z+10, 160))} style={zoomBtn}>
              <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>
            </button>
          </div>
          <div style={{ width:'1px', height:'28px', background:'#e5e7eb' }} />
          <button
            onClick={() => window.print()}
            style={{ ...navBtn, background:'#1B5E20', color:'white', border:'1px solid #166534', padding:'7px 14px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>picture_as_pdf</span>
            <span style={{ fontSize:'12px', fontWeight:700 }}>Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* ══════ ZONA DEL DOCUMENTO ══════ */}
      <div className="pdf-viewer flex-1 overflow-auto pt-9 px-6 pb-14 bg-[#dde3ea] flex justify-center items-start print:block print:p-[2cm] print:bg-white print:overflow-visible print:h-auto print:flex-none">
        <div className="inline-block print:block print:!w-full print:![zoom:1]" style={{ zoom:`${zoom}%` }}>

          {/* ══════ HOJA ══════ */}
          <div className="print:!w-full print:overflow-visible" style={{ width:'816px', background:'white', color:'#111827' }}>

            {/* Barra superior */}
            <div style={{ height:'7px', background:'linear-gradient(90deg,#1B5E20 0%,#2E7D32 50%,#66BB6A 100%)' }} />

            {/* ── Cabecera con logos ── */}
            <div style={{ padding:'28px 40px 20px', display:'flex', alignItems:'center', gap:'20px' }}>
              <div style={{ width:'90px', height:'90px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={umbImg} alt="UMB" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>

              <div style={{ flex:1, textAlign:'center' }}>
                <p style={{ fontSize:'8px', fontWeight:700, color:'#2E7D32', letterSpacing:'0.16em', textTransform:'uppercase', margin:'0 0 6px' }}>
                  Universidad Mexiquense del Bicentenario — San José del Rincón
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', justifyContent:'center' }}>
                  <div style={{ height:'1px', width:'40px', background:'linear-gradient(to right,transparent,#1B5E20)' }} />
                  <span className="material-symbols-outlined" style={{ fontSize:'12px', color:'#2E7D32', fontVariationSettings:"'FILL' 1" }}>workspace_premium</span>
                  <div style={{ height:'1px', width:'40px', background:'linear-gradient(to left,transparent,#1B5E20)' }} />
                </div>
                <h1 style={{ fontSize:'16px', fontWeight:900, color:'#111827', lineHeight:1.3, margin:'0 0 6px', letterSpacing:'-0.01em' }}>
                  Constancia de Participación —{' '}
                  <span style={{ color:'#1B5E20' }}>12va Jornada Académica y Cultural 2025</span>
                </h1>
                <div style={{ display:'flex', justifyContent:'center', gap:'8px', flexWrap:'wrap' }}>
                  <Chip icon="badge"             label={user?.matricula || '—'} mono />
                  <Chip icon="person"            label={user?.nombre    || '—'} />
                  <Chip icon="workspace_premium" label="Constancia oficial" destacado />
                </div>
              </div>

              <div style={{ width:'90px', height:'90px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={logoImg} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
            </div>

            <div style={{ height:'1px', background:'linear-gradient(90deg,transparent 0%,#1B5E20 30%,#1B5E20 70%,transparent 100%)', margin:'0 48px' }} />

            {/* ── Datos del estudiante ── */}
            <div style={{ padding:'14px 48px 10px', display:'flex', gap:'16px', flexWrap:'wrap', background:'#f8fdf8', borderBottom:'1px solid #e0ece0' }}>
              {[
                { icon:'person',           label:'Nombre',    val: user?.nombre    || '—' },
                { icon:'badge',            label:'Matrícula', val: user?.matricula || '—' },
                { icon:'email',            label:'Correo',    val: user?.email     || '—' },
                { icon:'event_available',  label:'Sesiones asistidas', val: asistencias.length.toString() },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'10.5px', color:'#374151' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'13px', color:'#2E7D32', fontVariationSettings:"'FILL' 1" }}>{icon}</span>
                  <span style={{ fontWeight:700, color:'#6b7280' }}>{label}:</span>
                  <span style={{ fontWeight:600 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* ── Texto de la constancia ── */}
            <div style={{ padding:'28px 48px 16px', textAlign:'center' }}>
              <p style={{ fontSize:'13px', color:'#374151', lineHeight:1.9, margin:0 }}>
                La <strong>Universidad Mexiquense del Bicentenario, Unidad San José del Rincón</strong>, hace constar que el/la estudiante
              </p>
              <p style={{ fontSize:'22px', fontWeight:900, color:'#1B5E20', margin:'10px 0 6px', letterSpacing:'0.01em' }}>
                {user?.nombre || '—'}
              </p>
              {user?.matricula && (
                <p style={{ fontSize:'11px', color:'#6b7280', margin:'0 0 12px' }}>Matrícula: {user.matricula}</p>
              )}
              <p style={{ fontSize:'13px', color:'#374151', lineHeight:1.9, margin:0 }}>
                <strong>participó</strong> en las sesiones académicas de la
                <strong> 12va Jornada Académica y Cultural 2025</strong>,
                confirmando su asistencia en cada una de las sesiones listadas a continuación.
              </p>
            </div>

            {/* ── Tabla de sesiones asistidas ── */}
            <div style={{ padding:'8px 48px 24px' }}>
              {cargando ? (
                <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:'13px' }}>Cargando…</div>
              ) : (
                <div style={{ borderRadius:'8px', overflow:'hidden', border:'1px solid #e5e7eb' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11.5px', fontFamily:'"Segoe UI", system-ui, sans-serif' }}>
                    <thead>
                      <tr style={{ background:'#2E7D32' }}>
                        <th style={{ ...thStyle, width:'32px', textAlign:'center' }}>#</th>
                        <th style={{ ...thStyle, textAlign:'left' }}>Sesión</th>
                        <th style={{ ...thStyle, width:'150px', textAlign:'left' }}>Ponente</th>
                        <th style={{ ...thStyle, width:'130px', textAlign:'center' }}>Fecha</th>
                        <th style={{ ...thStyle, width:'80px', textAlign:'center' }}>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistencias.map((a, i) => (
                        <tr key={a.id} style={{ borderBottom:'1px solid #e5e7eb', background: i % 2 === 0 ? '#f8fdf8' : 'white' }}>
                          <td style={{ padding:'10px 8px', textAlign:'center', fontWeight:800, color:'#1B5E20', fontSize:'12px' }}>{i + 1}</td>
                          <td style={{ padding:'10px 14px', fontWeight:700, color:'#111827', fontSize:'12px', lineHeight:1.4 }}>
                            {a.titulo}
                            {a.categoria && (
                              <span style={{ display:'inline-block', marginLeft:'6px', fontSize:'8px', fontWeight:700, color:'#166534', background:'#dcfce7', borderRadius:'20px', padding:'1px 7px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                                {a.categoria}
                              </span>
                            )}
                          </td>
                          <td style={{ padding:'10px 12px', fontSize:'11px', color:'#374151' }}>
                            {a.ponente ? (
                              <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#e8f5e9', border:'1px solid #c8e6c9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                  <span style={{ fontSize:'9px', fontWeight:800, color:'#166534' }}>{a.ponente.charAt(0).toUpperCase()}</span>
                                </div>
                                <span>{a.ponente}</span>
                              </div>
                            ) : <span style={{ color:'#d1d5db', fontStyle:'italic', fontSize:'10px' }}>—</span>}
                          </td>
                          <td style={{ padding:'10px 8px', textAlign:'center', fontSize:'10.5px', color:'#6b7280' }}>{formatFechaLarga(a.fecha)}</td>
                          <td style={{ padding:'10px 8px', textAlign:'center', fontSize:'10.5px', fontWeight:700, color:'#166534', fontFamily:'monospace' }}>{formatHora(a.hora)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Firmas ── */}
            <div style={{ padding:'10px 80px 32px', display:'flex', justifyContent:'space-around', gap:'40px' }}>
              {[
                { nombre:'Coordinación Académica',   cargo:'UMB San José del Rincón' },
                { nombre:'Dirección del Evento',     cargo:'12va Jornada 2025'       },
              ].map((f, i) => (
                <div key={i} style={{ flex:1, textAlign:'center' }}>
                  <div style={{ borderTop:'1.5px solid #374151', paddingTop:'8px', marginTop:'52px' }}>
                    <p style={{ fontSize:'11px', fontWeight:800, color:'#111827', margin:'0 0 2px' }}>{f.nombre}</p>
                    <p style={{ fontSize:'10px', color:'#6b7280', margin:0 }}>{f.cargo}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pie ── */}
            <div style={{ background:'#f8fafc', borderTop:'2px solid #e0ece0', padding:'20px 48px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px' }}>
                {/* Sello */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'50%', border:'2.5px solid #1B5E20', background:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 4px #e8f5e9' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:'18px', color:'#1B5E20', fontVariationSettings:"'FILL' 1" }}>workspace_premium</span>
                    <span style={{ fontSize:'5.5px', fontWeight:900, color:'#1B5E20', textAlign:'center', lineHeight:1.2, textTransform:'uppercase' }}>CONST<br />UMB</span>
                  </div>
                  <div style={{ lineHeight:1.4 }}>
                    <p style={{ fontSize:'10px', fontWeight:800, color:'#166534', margin:'0 0 1px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Constancia Oficial</p>
                    <p style={{ fontSize:'9px', color:'#6b7280', margin:0 }}>Documento de participación académica</p>
                    <p style={{ fontSize:'7.5px', color:'#9ca3af', margin:'2px 0 0', fontFamily:'monospace' }}>{folio}</p>
                    <p style={{ fontSize:'7.5px', color:'#9ca3af', margin:'1px 0 0' }}>Emitido: {fechaEmision}</p>
                  </div>
                </div>

                {/* Centro */}
                <div style={{ textAlign:'center', flex:1 }}>
                  <p style={{ fontSize:'10.5px', fontWeight:600, fontStyle:'italic', color:'#1B5E20', margin:'0 0 4px', letterSpacing:'0.04em' }}>
                    "Cultura que inspira, conocimiento que transforma"
                  </p>
                  <p style={{ fontSize:'9px', color:'#9ca3af', margin:0 }}>
                    agenda-ues.vercel.app · 12va Jornada Académica y Cultural 2025
                  </p>
                </div>
              </div>
            </div>

            {/* Barra inferior */}
            <div style={{ height:'5px', background:'linear-gradient(90deg,#66BB6A,#2E7D32 50%,#1B5E20)' }} />
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @page { margin: 0; size: letter; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .material-symbols-outlined { font-family: 'Material Symbols Outlined' !important; font-weight: normal !important; font-style: normal !important; display: inline-block !important; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          thead { display: table-header-group; }
        }
        .pdf-viewer::-webkit-scrollbar { width: 8px; height: 8px; }
        .pdf-viewer::-webkit-scrollbar-track { background: #d1d5db; }
        .pdf-viewer::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
        .pdf-viewer::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>
    </div>
  );
};

/* ── Sub-componentes ── */
const Chip = ({ icon, label, mono, destacado }) => (
  <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', background: destacado ? '#e8f5e9' : '#f3f4f6', border:`1px solid ${destacado ? '#c8e6c9' : '#e5e7eb'}`, borderRadius:'20px', padding:'3px 9px' }}>
    <span className="material-symbols-outlined" style={{ fontSize:'11px', color: destacado ? '#2E7D32' : '#6b7280', fontVariationSettings:"'FILL' 1" }}>{icon}</span>
    <span style={{ fontSize:'9.5px', fontWeight:700, color: destacado ? '#1B5E20' : '#374151', fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.03em' : 'normal' }}>{label}</span>
  </div>
);

const navBtn = {
  display:'flex', alignItems:'center', gap:'6px',
  background:'white', border:'1px solid #d1d5db', color:'#374151',
  borderRadius:'7px', padding:'7px 12px', cursor:'pointer',
  fontSize:'12px', fontWeight:600, transition:'background 0.15s',
};
const zoomBtn = {
  background:'transparent', border:'none', color:'#374151',
  padding:'6px 10px', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1,
};
const thStyle = {
  padding:'10px 12px', fontWeight:700, fontSize:'9.5px',
  letterSpacing:'0.08em', textTransform:'uppercase', color:'white',
};

export default ConstanciaPdf;
