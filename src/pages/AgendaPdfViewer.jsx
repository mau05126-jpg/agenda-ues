// src/pages/AgendaPdfViewer.jsx
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import logoImg from '../assets/Logo.png';
import umbImg  from '../assets/umbb.png';

/* ── helpers ── */
const calcHoraFin = (hora, duracion) => {
  if (!hora || !duracion) return null;
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + parseInt(duracion);
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
};

const parseFechaLocal = (fechaStr) => {
  if (!fechaStr) return null;
  const parte = fechaStr.split('T')[0];
  const [y, m, d] = parte.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const DIAS_ES  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

const formatFecha = (fechaStr) => {
  const d = parseFechaLocal(fechaStr);
  if (!d) return '';
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
};

/* ── componente principal ── */
const AgendaPdfViewer = ({ setCurrentPage }) => {
  const [zoom, setZoom]       = useState(100);
  const [sesiones, setSesiones] = useState([]);
  const [user, setUser]         = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) { setCurrentPage('loginPage'); return; }
    setUser(currentUser);

    const cargar = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch('/api/inscripciones/mis-inscripciones', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.inscripciones?.length) {
          setSesiones(data.inscripciones.map(s => ({
            id:          s.id,
            titulo:      s.titulo || 'Sin título',
            ponente:     s.ponente || '',
            escenario:   s.escenario || '',
            fecha:       s.fecha,
            hora:        s.hora ? s.hora.substring(0, 5) : '',
            duracion:    s.duracion || 90,
            descripcion: s.descripcion || '',
            categoria:   s.categoria || 'Conferencia',
          })));
        } else {
          // fallback a localStorage
          const stored = localStorage.getItem(`inscripciones_${currentUser.id}`);
          if (stored) setSesiones(JSON.parse(stored));
        }
      } catch (_) {
        const currentUser2 = getCurrentUser();
        const stored = localStorage.getItem(`inscripciones_${currentUser2?.id}`);
        if (stored) setSesiones(JSON.parse(stored));
      } finally { setCargando(false); }
    };
    cargar();
  }, [setCurrentPage]);

  /* Agrupar sesiones por fecha */
  const sesionesPorDia = sesiones.reduce((acc, s) => {
    const key = s.fecha ? s.fecha.split('T')[0] : 'sin-fecha';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const diasOrdenados = Object.keys(sesionesPorDia).sort();

  const today  = new Date();
  const folio  = `AG-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${(user?.matricula || '000').slice(-4)}`;
  const fechaEmision = today.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  return (
    <div
      className="h-screen flex flex-col print:h-auto print:block print:overflow-visible"
      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
    >
      {/* ══════ TOOLBAR ══════ */}
      <div
        className="flex items-center justify-between shrink-0 print:hidden"
        style={{
          background: '#F1F8F1',
          borderBottom: '1px solid rgba(46,125,50,0.18)',
          height: '60px', padding: '0 24px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)', gap: '12px',
        }}
      >
        {/* Izquierda */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', minWidth:'220px' }}>
          <button onClick={() => setCurrentPage('miAgenda')} style={navBtn}>
            <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>arrow_back</span>
            <span style={{ fontSize:'13px', fontWeight:700 }}>Volver</span>
          </button>
          <div style={{ width:'1px', height:'28px', background:'#c8e6c9' }} />
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1.25 }}>
            <span style={{ fontWeight:800, fontSize:'13px', color:'#166534', letterSpacing:'0.04em' }}>
              MI AGENDA
            </span>
            <span style={{ fontSize:'10px', color:'#43A047', letterSpacing:'0.07em' }}>
              Vista de impresión
            </span>
          </div>
        </div>

        {/* Centro */}
        <div style={{ flex:1, textAlign:'center', overflow:'hidden', padding:'0 12px' }}>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#374151', display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            Agenda Personal — {user?.nombre || 'Estudiante'} — Jornada 2025
          </span>
          {cargando && <span style={{ fontSize:'10px', color:'#9ca3af' }}>Cargando sesiones…</span>}
        </div>

        {/* Derecha */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:'220px', justifyContent:'flex-end' }}>
          {/* Zoom */}
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

          {/* Imprimir / Guardar PDF */}
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

          {/* ══════ PÁGINA ══════ */}
          <div className="print:!w-full print:overflow-visible" style={{ width:'816px', background:'white', color:'#111827' }}>

            {/* Barra superior */}
            <div style={{ height:'7px', background:'linear-gradient(90deg,#1B5E20 0%,#2E7D32 50%,#66BB6A 100%)' }} />

            {/* ── Cabecera ── */}
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
                  <span className="material-symbols-outlined" style={{ fontSize:'12px', color:'#2E7D32', fontVariationSettings:"'FILL' 1" }}>school</span>
                  <div style={{ height:'1px', width:'40px', background:'linear-gradient(to left,transparent,#1B5E20)' }} />
                </div>
                <h1 style={{ fontSize:'16px', fontWeight:900, color:'#111827', lineHeight:1.3, margin:'0 0 6px', letterSpacing:'-0.01em' }}>
                  Agenda Personal —{' '}
                  <span style={{ color:'#1B5E20' }}>12va Jornada Académica y Cultural 2025</span>
                </h1>
                <div style={{ display:'flex', justifyContent:'center', gap:'8px', flexWrap:'wrap' }}>
                  <Chip icon="badge"    label={user?.matricula || '—'} mono />
                  <Chip icon="person"   label={user?.nombre    || '—'} />
                  <Chip icon="verified" label="Agenda oficial" destacado />
                </div>
              </div>

              <div style={{ width:'90px', height:'90px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={logoImg} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
            </div>

            <div style={{ height:'1px', background:'linear-gradient(90deg,transparent 0%,#1B5E20 30%,#1B5E20 70%,transparent 100%)', margin:'0 48px' }} />

            {/* ── Info del estudiante ── */}
            <div style={{ padding:'14px 48px 10px', display:'flex', gap:'16px', flexWrap:'wrap', background:'#f8fdf8', borderBottom:'1px solid #e0ece0' }}>
              {[
                { icon:'person',      label:'Nombre',    val: user?.nombre    || '—' },
                { icon:'badge',       label:'Matrícula', val: user?.matricula || '—' },
                { icon:'email',       label:'Correo',    val: user?.email     || '—' },
                { icon:'event_note',  label:'Sesiones inscritas', val: sesiones.length.toString() },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'10.5px', color:'#374151' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'13px', color:'#2E7D32', fontVariationSettings:"'FILL' 1" }}>{icon}</span>
                  <span style={{ fontWeight:700, color:'#6b7280' }}>{label}:</span>
                  <span style={{ fontWeight:600 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* ── Sesiones por día ── */}
            <div style={{ padding:'16px 48px 24px' }}>
              {cargando && sesiones.length === 0 ? (
                <div style={{ padding:'48px', textAlign:'center', color:'#9ca3af', fontSize:'13px' }}>
                  Cargando sesiones…
                </div>
              ) : sesiones.length === 0 ? (
                <div style={{ padding:'48px', textAlign:'center', color:'#9ca3af', fontSize:'13px', fontStyle:'italic' }}>
                  No tienes sesiones inscritas aún.
                </div>
              ) : (
                diasOrdenados.map((fechaKey) => {
                  const fechaLabel = fechaKey !== 'sin-fecha'
                    ? formatFecha(fechaKey)
                    : 'Fecha por confirmar';
                  const sess = sesionesPorDia[fechaKey];

                  return (
                    <div key={fechaKey} style={{ marginBottom:'20px' }}>
                      {/* Encabezado de día */}
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                        <div style={{ width:'4px', height:'18px', background:'linear-gradient(to bottom,#1B5E20,#43A047)', borderRadius:'2px' }} />
                        <span style={{ fontSize:'11px', fontWeight:800, color:'#1B5E20', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                          {fechaLabel}
                        </span>
                        <div style={{ flex:1, height:'1px', background:'#e0ece0' }} />
                        <span style={{ fontSize:'9px', color:'#9ca3af', fontWeight:600 }}>
                          {sess.length} {sess.length === 1 ? 'sesión' : 'sesiones'}
                        </span>
                      </div>

                      {/* Tabla del día */}
                      <div style={{ borderRadius:'8px', overflow:'hidden', border:'1px solid #e5e7eb' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11.5px', fontFamily:'"Segoe UI", system-ui, sans-serif' }}>
                          <thead>
                            <tr style={{ background:'#2E7D32' }}>
                              <th style={{ ...thStyle, width:'100px', textAlign:'center' }}>Horario</th>
                              <th style={{ ...thStyle, textAlign:'left' }}>Sesión / Actividad</th>
                              <th style={{ ...thStyle, width:'150px', textAlign:'left' }}>Ponente</th>
                              <th style={{ ...thStyle, width:'110px', textAlign:'left' }}>Escenario</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sess.map((s, i) => {
                              const horaFin = calcHoraFin(s.hora, s.duracion);
                              const esPar   = i % 2 === 0;
                              return (
                                <tr key={s.id || i} style={{ borderBottom:'1px solid #e5e7eb', background: esPar ? '#f8fdf8' : 'white' }}>
                                  {/* Horario */}
                                  <td style={{ padding:'11px 8px', textAlign:'center', verticalAlign:'middle', borderRight:'2px solid #d1fae5', background: esPar ? '#ecfdf5' : '#f0fdf4', minWidth:'80px' }}>
                                    {s.hora ? (
                                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1px' }}>
                                        <span style={{ fontWeight:800, color:'#166534', fontFamily:'monospace', fontSize:'11.5px', letterSpacing:'0.04em' }}>{s.hora}</span>
                                        {horaFin && (
                                          <>
                                            <span style={{ fontSize:'8px', color:'#9ca3af', lineHeight:1 }}>▼</span>
                                            <span style={{ fontWeight:700, color:'#2E7D32', fontFamily:'monospace', fontSize:'11.5px', letterSpacing:'0.04em' }}>{horaFin}</span>
                                            <span style={{ fontSize:'7.5px', color:'#9ca3af', marginTop:'1px' }}>{s.duracion} min</span>
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <span style={{ color:'#d1d5db', fontStyle:'italic', fontSize:'10px' }}>—</span>
                                    )}
                                  </td>

                                  {/* Sesión */}
                                  <td style={{ padding:'11px 14px', verticalAlign:'top' }}>
                                    <span style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#111827', lineHeight:1.4, marginBottom: s.descripcion ? '4px' : 0 }}>
                                      {s.titulo}
                                    </span>
                                    {s.descripcion?.trim() && (
                                      <span style={{ display:'block', fontSize:'10.5px', color:'#6b7280', lineHeight:1.5, paddingLeft:'8px', borderLeft:'2px solid #c8e6c9', marginTop:'2px' }}>
                                        {s.descripcion.length > 110 ? s.descripcion.substring(0,110)+'…' : s.descripcion}
                                      </span>
                                    )}
                                    {s.categoria && s.categoria !== 'Conferencia' && (
                                      <span style={{ display:'inline-block', marginTop:'4px', fontSize:'8.5px', fontWeight:700, color:'#166534', background:'#dcfce7', borderRadius:'20px', padding:'1px 7px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                                        {s.categoria}
                                      </span>
                                    )}
                                  </td>

                                  {/* Ponente */}
                                  <td style={{ padding:'11px 12px', verticalAlign:'top', color:'#374151', fontSize:'11px', lineHeight:1.4 }}>
                                    {s.ponente ? (
                                      <div style={{ display:'flex', alignItems:'flex-start', gap:'5px' }}>
                                        <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#e8f5e9', border:'1px solid #c8e6c9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
                                          <span style={{ fontSize:'10px', fontWeight:800, color:'#166534' }}>{s.ponente.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <span style={{ paddingTop:'2px' }}>{s.ponente}</span>
                                      </div>
                                    ) : (
                                      <span style={{ color:'#d1d5db', fontStyle:'italic', fontSize:'10px' }}>Sin ponente</span>
                                    )}
                                  </td>

                                  {/* Escenario */}
                                  <td style={{ padding:'11px 12px', verticalAlign:'top' }}>
                                    {s.escenario ? (
                                      <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', background:'#f1f8f1', border:'1px solid #c8e6c9', borderRadius:'6px', padding:'3px 8px', fontSize:'10.5px', fontWeight:600, color:'#2E7D32' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize:'12px' }}>meeting_room</span>
                                        {s.escenario}
                                      </span>
                                    ) : (
                                      <span style={{ color:'#d1d5db', fontSize:'10px', fontStyle:'italic' }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Pie: sello + QR ── */}
            <div style={{ background:'#f8fafc', borderTop:'2px solid #e0ece0', padding:'20px 48px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px' }}>

                {/* Sello oficial */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'50%', border:'2.5px solid #1B5E20', background:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 4px #e8f5e9' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:'18px', color:'#1B5E20', fontVariationSettings:"'FILL' 1" }}>verified</span>
                    <span style={{ fontSize:'5.5px', fontWeight:900, color:'#1B5E20', textAlign:'center', lineHeight:1.2, textTransform:'uppercase' }}>AGENDA<br />UMB</span>
                  </div>
                  <div style={{ lineHeight:1.4 }}>
                    <p style={{ fontSize:'10px', fontWeight:800, color:'#166534', margin:'0 0 1px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Agenda Oficial</p>
                    <p style={{ fontSize:'9px', color:'#6b7280', margin:0 }}>Documento de participación</p>
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
                    Presenta este documento en cada sesión para registrar tu asistencia
                  </p>
                </div>


              </div>
            </div>

            {/* Barra inferior */}
            <div style={{ height:'5px', background:'linear-gradient(90deg,#66BB6A,#2E7D32 50%,#1B5E20)' }} />
          </div>
        </div>
      </div>

      {/* ══════ ESTILOS DE IMPRESIÓN ══════ */}
      <style>{`
        @page { margin: 0; size: letter; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .material-symbols-outlined { font-family: 'Material Symbols Outlined' !important; font-weight: normal !important; font-style: normal !important; display: inline-block !important; }
          tr  { page-break-inside: avoid; break-inside: avoid; }
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

/* ── Estilos compartidos ── */
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

export default AgendaPdfViewer;
