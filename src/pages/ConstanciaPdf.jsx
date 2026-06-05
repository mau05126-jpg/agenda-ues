import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentUser } from '../services/authService';
import logoImg from '../assets/Logo.png';
import umbImg  from '../assets/umbb.png';

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

const ConstanciaPdf = ({ setCurrentPage }) => {
  const [zoom, setZoom]               = useState(90);
  const [user]                        = useState(getCurrentUser);
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando]       = useState(true);

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
      const data = await res.json();
      if (data.success) setAsistencias(data.asistencias);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const today        = new Date();
  const dia          = today.getDate();
  const mes          = MESES_ES[today.getMonth()];
  const anio         = today.getFullYear();
  const fechaEmision = `${dia} de ${mes} de ${anio}`;
  const folio        = `CONST-${anio}${String(today.getMonth()+1).padStart(2,'0')}${String(dia).padStart(2,'0')}-${(user?.matricula||'0000').slice(-4)}`;
  // Usar id numérico como identificador primario (siempre presente tras login)
  const qrUrl        = user?.id
    ? `https://agenda-ues.vercel.app/?verificar=${user.id}`
    : `https://agenda-ues.vercel.app/?verificar=${user?.matricula}`;

  /* ── Pantalla de requisito mínimo ── */
  if (!cargando && asistencias.length < 5) {
    return (
      <div style={{ minHeight:'100vh', background:'#f0f4f0', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'"Segoe UI",system-ui,sans-serif' }}>
        <div style={{ background:'white', borderRadius:'20px', overflow:'hidden', maxWidth:'380px', width:'100%', boxShadow:'0 8px 40px rgba(0,0,0,0.12)' }}>
          <div style={{ height:'6px', background:'linear-gradient(90deg,#1B5E20,#43A047)' }} />
          <div style={{ padding:'36px', textAlign:'center' }}>
            <div style={{ fontSize:'52px', marginBottom:'16px' }}>🏆</div>
            <h2 style={{ fontSize:'20px', fontWeight:900, color:'#111827', margin:'0 0 8px' }}>Constancia no disponible</h2>
            <p style={{ fontSize:'14px', color:'#6b7280', margin:'0 0 16px', lineHeight:1.6 }}>
              Necesitas confirmar tu asistencia a al menos <strong style={{color:'#1B5E20'}}>5 sesiones</strong> mediante el escáner QR.
            </p>
            <div style={{ background:'#f0fdf4', border:'1px solid #c8e6c9', borderRadius:'12px', padding:'16px', margin:'0 0 20px' }}>
              <p style={{ fontSize:'28px', fontWeight:900, color:'#1B5E20', margin:0 }}>
                {asistencias.length} <span style={{fontSize:'14px', fontWeight:600, color:'#6b7280'}}>/ 5</span>
              </p>
              <p style={{ fontSize:'12px', color:'#2E7D32', fontWeight:700, margin:'4px 0 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>sesiones confirmadas</p>
            </div>
            <button onClick={() => setCurrentPage('miAgenda')} style={{ width:'100%', background:'#1B5E20', color:'white', fontWeight:700, padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'13px' }}>
              Volver a Mi Agenda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col print:h-auto print:block" style={{ fontFamily:'"Segoe UI",system-ui,sans-serif' }}>

      {/* ══ TOOLBAR ══ */}
      <div className="flex items-center justify-between shrink-0 print:hidden"
        style={{ background:'#F1F8F1', borderBottom:'1px solid rgba(46,125,50,0.18)', height:'60px', padding:'0 24px', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', minWidth:'220px' }}>
          <button onClick={() => setCurrentPage('miAgenda')} style={navBtn}>
            <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>arrow_back</span>
            <span style={{ fontSize:'13px', fontWeight:700 }}>Volver</span>
          </button>
          <div style={{ width:'1px', height:'28px', background:'#c8e6c9' }} />
          <div style={{ lineHeight:1.25 }}>
            <span style={{ fontWeight:800, fontSize:'13px', color:'#166534', letterSpacing:'0.04em', display:'block' }}>CONSTANCIA</span>
            <span style={{ fontSize:'10px', color:'#43A047', letterSpacing:'0.07em' }}>Horizontal · Vista de impresión</span>
          </div>
        </div>
        <div style={{ flex:1, textAlign:'center' }}>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#374151' }}>
            Constancia de Participación — {user?.nombre || 'Estudiante'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:'220px', justifyContent:'flex-end' }}>
          <div style={{ display:'flex', alignItems:'center', border:'1px solid #d1d5db', borderRadius:'8px', overflow:'hidden', background:'white' }}>
            <button onClick={() => setZoom(z => Math.max(z-10, 40))} style={zoomBtn}>
              <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>remove</span>
            </button>
            <span style={{ padding:'0 10px', fontSize:'12px', fontWeight:700, color:'#374151', borderLeft:'1px solid #e5e7eb', borderRight:'1px solid #e5e7eb', userSelect:'none' }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(z+10, 150))} style={zoomBtn}>
              <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>add</span>
            </button>
          </div>
          <div style={{ width:'1px', height:'28px', background:'#e5e7eb' }} />
          <button onClick={() => window.print()} style={{ ...navBtn, background:'#1B5E20', color:'white', border:'1px solid #166534', padding:'7px 14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'16px' }}>picture_as_pdf</span>
            <span style={{ fontSize:'12px', fontWeight:700 }}>Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* ══ ZONA DEL DOCUMENTO ══ */}
      <div className="pdf-viewer flex-1 overflow-auto pt-8 px-6 pb-12 bg-[#dde3ea] flex justify-center items-start print:block print:p-0 print:bg-white print:overflow-visible">
        <div className="inline-block print:block print:!w-full print:![zoom:1]" style={{ zoom:`${zoom}%` }}>

          {/* ══ HOJA HORIZONTAL (letter landscape: 11" × 8.5") ══ */}
          <div style={{ width:'1056px', height:'816px', background:'white', color:'#111827', position:'relative', boxSizing:'border-box', overflow:'hidden' }}>

            {/* ── Bordes ornamentales ── */}
            <div style={{ position:'absolute', inset:'9px',  border:'2.5px solid #1B5E20', pointerEvents:'none', zIndex:3 }} />
            <div style={{ position:'absolute', inset:'14px', border:'0.75px solid #81C784', opacity:0.6, pointerEvents:'none', zIndex:3 }} />

            {/* ── Marca de agua UMB diagonal ── */}
            <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:1 }}>
              {['-15%','18%','50%'].map((top, i) => (
                <div key={i} style={{ position:'absolute', top, left:'-20%', width:'140%', transform:'rotate(-30deg)', display:'flex', gap:'100px', opacity:0.04 }}>
                  {[0,1,2,3].map(j => (
                    <span key={j} style={{ fontSize:'100px', fontWeight:900, color:'#1B5E20', letterSpacing:'14px', whiteSpace:'nowrap', userSelect:'none', fontFamily:'Arial Black,sans-serif' }}>
                      UMB
                    </span>
                  ))}
                </div>
              ))}
            </div>

            {/* ── Contenido ── */}
            <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', height:'100%', padding:'22px 48px 18px' }}>

              {/* Barra superior */}
              <div style={{ height:'6px', background:'linear-gradient(90deg,#1B5E20 0%,#2E7D32 60%,#66BB6A 100%)', borderRadius:'2px', marginBottom:'16px' }} />

              {/* ── Cabecera ── */}
              <div style={{ display:'flex', alignItems:'center', gap:'18px', marginBottom:'10px' }}>
                <img src={umbImg} alt="UMB" style={{ width:'72px', height:'72px', objectFit:'contain', flexShrink:0 }} />

                <div style={{ flex:1, textAlign:'center' }}>
                  <p style={{ fontSize:'8px', fontWeight:700, color:'#2E7D32', letterSpacing:'0.22em', textTransform:'uppercase', margin:'0 0 1px' }}>
                    Universidad Mexiquense del Bicentenario
                  </p>
                  <p style={{ fontSize:'7px', fontWeight:600, color:'#9ca3af', letterSpacing:'0.12em', textTransform:'uppercase', margin:'0 0 8px' }}>
                    Unidad de Estudios Superiores San José del Rincón
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', justifyContent:'center', margin:'0 0 8px' }}>
                    <div style={{ height:'1px', flex:1, background:'linear-gradient(to right,transparent,#1B5E20 80%)' }} />
                    <span style={{ color:'#1B5E20', fontSize:'14px', lineHeight:1 }}>★</span>
                    <div style={{ height:'1px', flex:1, background:'linear-gradient(to left,transparent,#1B5E20 80%)' }} />
                  </div>
                  <h1 style={{ fontSize:'24px', fontWeight:900, color:'#1B5E20', letterSpacing:'0.18em', textTransform:'uppercase', margin:0, lineHeight:1.1 }}>
                    Constancia de Participación
                  </h1>
                </div>

                <img src={logoImg} alt="Logo" style={{ width:'72px', height:'72px', objectFit:'contain', flexShrink:0 }} />
              </div>

              {/* Línea divisoria */}
              <div style={{ height:'1.5px', background:'linear-gradient(90deg,transparent,#1B5E20 12%,#1B5E20 88%,transparent)', marginBottom:'18px' }} />

              {/* ── Cuerpo — centrado verticalmente ── */}
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'14px', width:'100%' }}>

                  <p style={{ fontSize:'12px', color:'#374151', margin:0, lineHeight:1.8 }}>
                    La <strong>Universidad Mexiquense del Bicentenario, Unidad de Estudios Superiores San José del Rincón</strong>,
                  </p>

                  {/* HACE CONSTAR QUE */}
                  <div style={{ border:'1.5px solid #1B5E20', borderRadius:'4px', padding:'6px 40px', background:'#f0fdf4' }}>
                    <p style={{ fontSize:'13px', fontWeight:900, color:'#1B5E20', letterSpacing:'0.22em', textTransform:'uppercase', margin:0 }}>
                      Hace Constar Que:
                    </p>
                  </div>

                  {/* Nombre y matrícula */}
                  <div style={{ padding:'12px 0', borderBottom:'1.5px solid #e5e7eb', borderTop:'1.5px solid #e5e7eb', width:'100%' }}>
                    <p style={{ fontSize:'36px', fontWeight:900, color:'#1B5E20', margin:'0 0 5px', letterSpacing:'0.02em', lineHeight:1.1 }}>
                      {user?.nombre || '—'}
                    </p>
                    {user?.matricula && (
                      <p style={{ fontSize:'12px', color:'#6b7280', margin:0 }}>
                        con Matrícula: <strong style={{ color:'#374151', letterSpacing:'0.08em' }}>{user.matricula}</strong>
                      </p>
                    )}
                  </div>

                  {/* Texto de participación */}
                  <p style={{ fontSize:'13px', color:'#374151', margin:0, lineHeight:2.1, maxWidth:'640px' }}>
                    participó como <strong>asistente</strong> en la{' '}
                    <strong style={{ fontSize:'14px', color:'#111827' }}>12va Jornada Académica y Cultural 2025</strong><br/>
                    organizada por la Universidad Mexiquense del Bicentenario,<br/>
                    confirmando su asistencia a{' '}
                    <strong style={{ color:'#1B5E20', fontSize:'20px', letterSpacing:'0.04em' }}>{asistencias.length}</strong>
                    {' '}{asistencias.length === 1 ? 'sesión académica' : 'sesiones académicas'}.
                  </p>

                  {/* Fecha */}
                  <p style={{ fontSize:'11px', color:'#6b7280', fontStyle:'italic', margin:0, lineHeight:1.7 }}>
                    La presente constancia se expide a petición del interesado el día{' '}
                    <strong style={{color:'#374151'}}>{fechaEmision}</strong>.
                  </p>

                  {/* Firma */}
                  <div style={{ display:'flex', justifyContent:'center', width:'100%', marginTop:'12px' }}>
                    <div style={{ width:'260px', textAlign:'center' }}>
                      <div style={{ borderTop:'1.5px solid #374151', paddingTop:'7px', marginTop:'32px' }}>
                        <p style={{ fontSize:'10px', fontWeight:800, color:'#111827', margin:'0 0 1px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Coordinación Académica</p>
                        <p style={{ fontSize:'9.5px', color:'#6b7280', margin:0 }}>UMB San José del Rincón</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Pie: sello + lema + QR ── */}
              <div style={{ borderTop:'1.5px solid #c8e6c9', background:'#f8fcf8', padding:'10px 0 8px', marginTop:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>

                  {/* Sello circular — igual que los demás reportes */}
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
                    <div style={{ width:'54px', height:'54px', borderRadius:'50%', border:'2.5px solid #1B5E20', background:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 4px #e8f5e9', flexShrink:0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'20px', color:'#1B5E20', fontVariationSettings:"'FILL' 1" }}>verified</span>
                      <span style={{ fontSize:'5.5px', fontWeight:900, color:'#1B5E20', textAlign:'center', lineHeight:1.2, textTransform:'uppercase' }}>VÁLIDO<br/>UMB</span>
                    </div>
                    <div>
                      <p style={{ fontSize:'9.5px', fontWeight:800, color:'#166534', margin:'0 0 1px', textTransform:'uppercase', letterSpacing:'0.07em' }}>Sello Oficial</p>
                      <p style={{ fontSize:'8px', color:'#6b7280', margin:'0 0 2px' }}>Validez institucional garantizada</p>
                      <p style={{ fontSize:'7px', color:'#9ca3af', fontFamily:'monospace', margin:0 }}>{folio}</p>
                    </div>
                  </div>

                  {/* Lema */}
                  <div style={{ flex:1, textAlign:'center' }}>
                    <p style={{ fontSize:'10px', fontWeight:600, fontStyle:'italic', color:'#1B5E20', margin:'0 0 3px', lineHeight:1.5 }}>
                      "Cultura que inspira, conocimiento que transforma"
                    </p>
                    <p style={{ fontSize:'7.5px', color:'#9ca3af', margin:0 }}>agenda-ues.vercel.app · 12va Jornada 2025</p>
                  </div>

                  {/* QR */}
                  <div style={{ flexShrink:0, textAlign:'center' }}>
                    <div style={{ background:'white', border:'1.5px solid #c8e6c9', borderRadius:'8px', padding:'6px', display:'inline-block', boxShadow:'0 2px 6px rgba(27,94,32,0.10)' }}>
                      <QRCodeSVG value={qrUrl} size={80} level="M" fgColor="#1B5E20" />
                    </div>
                    <p style={{ fontSize:'7px', color:'#6b7280', margin:'4px 0 0', lineHeight:1.5 }}>
                      Escanea para ver<br/>sesiones confirmadas
                    </p>
                  </div>

                </div>
              </div>

              {/* Barra inferior */}
              <div style={{ height:'6px', background:'linear-gradient(90deg,#66BB6A,#2E7D32 50%,#1B5E20)', borderRadius:'2px', marginTop:'8px' }} />

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @page { margin: 0; size: letter landscape; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .material-symbols-outlined { font-family:'Material Symbols Outlined' !important; font-weight:normal !important; font-style:normal !important; display:inline-block !important; }
        }
        .pdf-viewer::-webkit-scrollbar { width:8px; height:8px; }
        .pdf-viewer::-webkit-scrollbar-track { background:#d1d5db; }
        .pdf-viewer::-webkit-scrollbar-thumb { background:#9ca3af; border-radius:4px; }
      `}</style>
    </div>
  );
};

const navBtn  = { display:'flex', alignItems:'center', gap:'6px', background:'white', border:'1px solid #d1d5db', color:'#374151', borderRadius:'7px', padding:'7px 12px', cursor:'pointer', fontSize:'12px', fontWeight:600 };
const zoomBtn = { background:'transparent', border:'none', color:'#374151', padding:'6px 10px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' };

export default ConstanciaPdf;
