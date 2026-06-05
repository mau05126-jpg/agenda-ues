import { useState, useEffect } from 'react';
import logoImg from '../assets/Logo.png';
import umbImg  from '../assets/umbb.png';

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

const formatFecha = (f) => {
  if (!f) return '';
  const [y, m, d] = String(f).split('T')[0].split('-').map(Number);
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const fecha = new Date(y, m - 1, d);
  return `${dias[fecha.getDay()]} ${d} de ${MESES_ES[m - 1]}`;
};

const formatHora = (h) => {
  if (!h) return '';
  const [hh, mm] = h.substring(0, 5).split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${(hh % 12 || 12).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
};

const categoriaBadge = (cat) => {
  const mapa = {
    'Conferencia':          { bg:'#dcfce7', color:'#166534', label:'Conferencia' },
    'Conferencia Magistral':{ bg:'#dcfce7', color:'#166534', label:'Conferencia' },
    'Taller Práctico':      { bg:'#ffedd5', color:'#9a3412', label:'Taller' },
    'Taller':               { bg:'#ffedd5', color:'#9a3412', label:'Taller' },
    'Ponencia':             { bg:'#dbeafe', color:'#1e40af', label:'Ponencia' },
    'Estudiantes':          { bg:'#f3e8ff', color:'#6b21a8', label:'Estudiantes' },
    'Inicio de actividades':{ bg:'#f1f5f9', color:'#475569', label:'Apertura' },
  };
  return mapa[cat] || { bg:'#f1f5f9', color:'#374151', label: cat || 'Sesión' };
};

const VerificarConstancia = ({ uid: uidProp }) => {
  const [estado, setEstado] = useState('cargando');
  const [data, setData]     = useState(null);

  useEffect(() => {
    const uid = uidProp || sessionStorage.getItem('verif_uid');
    if (!uid || uid === 'undefined' || uid === 'null') {
      setEstado('error');
      return;
    }
    sessionStorage.removeItem('verif_uid');
    setEstado('cargando');
    fetch(`/api/verificar?uid=${encodeURIComponent(uid.trim())}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setData(d); setEstado('ok'); }
        else setEstado('error');
      })
      .catch(() => setEstado('error'));
  }, [uidProp]);

  return (
    <div style={{ minHeight:'100vh', background:'#f4f6f8', fontFamily:'"Segoe UI",system-ui,sans-serif', overflowX:'hidden' }}>

      {/* ── Banner superior ── */}
      <div style={{ background:'white', borderBottom:'3px solid #1B5E20', padding:'20px 16px 18px' }}>
        <div style={{ maxWidth:'560px', margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
          {/* Logos a los lados + texto centrado */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%' }}>
            <img src={umbImg} alt="UMB" className="vc-logo" style={{ width:'52px', height:'52px', objectFit:'contain', flexShrink:0 }} />
            <div style={{ flex:1, textAlign:'center', minWidth:0 }}>
              <p className="vc-inst" style={{ fontSize:'9.5px', fontWeight:700, color:'#2E7D32', letterSpacing:'0.16em', textTransform:'uppercase', margin:'0 0 4px', lineHeight:1.3 }}>
                Universidad Mexiquense del Bicentenario
              </p>
              <h1 className="vc-title" style={{ fontSize:'18px', fontWeight:900, color:'#111827', margin:'0 0 3px', lineHeight:1.2 }}>
                Verificación de Constancia
              </h1>
              <p className="vc-sub" style={{ fontSize:'11px', color:'#6b7280', margin:0 }}>
                12va Jornada Académica y Cultural 2025
              </p>
            </div>
            <img src={logoImg} alt="Logo" className="vc-logo" style={{ width:'52px', height:'52px', objectFit:'contain', flexShrink:0 }} />
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'0 12px 40px' }}>

        {/* Cargando */}
        {estado === 'cargando' && (
          <div style={{ background:'white', borderRadius:'16px', padding:'52px 24px', textAlign:'center', marginTop:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ width:'40px', height:'40px', border:'4px solid #1B5E20', borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto 16px', animation:'spin 0.8s linear infinite' }} />
            <p style={{ color:'#6b7280', fontSize:'14px', margin:0 }}>Verificando constancia...</p>
          </div>
        )}

        {/* Error */}
        {estado === 'error' && (
          <div style={{ background:'white', borderRadius:'16px', padding:'48px 24px', textAlign:'center', marginTop:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#fef2f2', border:'2px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'28px' }}>❌</div>
            <h2 style={{ fontSize:'17px', fontWeight:800, color:'#111827', margin:'0 0 8px' }}>Constancia no válida</h2>
            <p style={{ color:'#6b7280', fontSize:'13px', margin:0, lineHeight:1.6 }}>
              Este código QR no corresponde a ninguna constancia registrada.
            </p>
          </div>
        )}

        {/* Resultado OK */}
        {estado === 'ok' && data && (
          <>
            {/* Tarjeta del estudiante */}
            <div style={{ background:'white', borderRadius:'20px', marginTop:'0', boxShadow:'0 8px 32px rgba(0,0,0,0.10)', overflow:'hidden' }}>

              {/* Verificado banner */}
              <div style={{ background:'#f0fdf4', borderBottom:'1px solid #d1fae5', padding:'10px 20px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'16px' }}>✅</span>
                <p style={{ fontSize:'12px', fontWeight:700, color:'#166534', margin:0 }}>
                  Constancia verificada correctamente
                </p>
              </div>

              <div style={{ padding:'20px' }}>
                {/* Avatar + nombre */}
                <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
                  <div className="vc-avatar" style={{ width:'54px', height:'54px', borderRadius:'50%', background:'linear-gradient(135deg,#1B5E20,#43A047)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:900, color:'white', flexShrink:0 }}>
                    {data.estudiante.nombre?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p className="vc-nombre" style={{ fontSize:'18px', fontWeight:900, color:'#111827', margin:'0 0 3px', lineHeight:1.2, wordBreak:'break-word' }}>
                      {data.estudiante.nombre}
                    </p>
                    {data.estudiante.matricula && (
                      <p style={{ fontSize:'12px', color:'#6b7280', margin:0 }}>
                        Matrícula: <strong style={{color:'#374151'}}>{data.estudiante.matricula}</strong>
                      </p>
                    )}
                  </div>
                  {/* Badge sesiones */}
                  <div className="vc-badge" style={{ flexShrink:0, background:'linear-gradient(135deg,#1B5E20,#2E7D32)', borderRadius:'14px', padding:'10px 14px', textAlign:'center', minWidth:'52px' }}>
                    <p className="vc-badge-num" style={{ fontSize:'24px', fontWeight:900, color:'white', margin:0, lineHeight:1 }}>
                      {data.asistencias.length}
                    </p>
                    <p style={{ fontSize:'8px', fontWeight:700, color:'#a7f3d0', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {data.asistencias.length === 1 ? 'sesión' : 'sesiones'}
                    </p>
                  </div>
                </div>

                {/* Texto certificación */}
                <div style={{ background:'#f0fdf4', borderRadius:'12px', padding:'14px 16px', border:'1px solid #d1fae5' }}>
                  <p style={{ fontSize:'13px', color:'#374151', margin:0, lineHeight:1.75, textAlign:'justify' }}>
                    Se certifica que <strong style={{color:'#111827'}}>{data.estudiante.nombre}</strong> participó
                    como asistente en la <strong>12va Jornada Académica y Cultural 2025</strong> de la
                    Universidad Mexiquense del Bicentenario, San José del Rincón, confirmando asistencia a{' '}
                    <strong style={{color:'#1B5E20'}}>{data.asistencias.length} {data.asistencias.length === 1 ? 'sesión' : 'sesiones'}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de sesiones */}
            {data.asistencias.length > 0 && (
              <div style={{ marginTop:'14px' }}>
                <p style={{ fontSize:'11px', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 4px 10px', paddingLeft:'4px' }}>
                  Sesiones confirmadas · {data.asistencias.length}
                </p>

                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {data.asistencias.map((a, i) => {
                    const badge = categoriaBadge(a.categoria);
                    return (
                      <div key={i} className="vc-card-pad" style={{ background:'white', borderRadius:'14px', padding:'14px 16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', gap:'12px', alignItems:'flex-start' }}>

                        {/* Número */}
                        <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#f0fdf4', border:'1.5px solid #d1fae5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
                          <span style={{ fontSize:'11px', fontWeight:800, color:'#1B5E20' }}>{i + 1}</span>
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          {/* Badge categoría */}
                          <span style={{ display:'inline-block', fontSize:'9px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:badge.bg, color:badge.color, borderRadius:'6px', padding:'2px 8px', marginBottom:'5px' }}>
                            {badge.label}
                          </span>

                          {/* Título */}
                          <p style={{ fontSize:'13.5px', fontWeight:700, color:'#111827', margin:'0 0 5px', lineHeight:1.35, wordBreak:'break-word' }}>
                            {a.titulo}
                          </p>

                          {/* Ponente */}
                          {a.ponente && (
                            <p style={{ fontSize:'11.5px', color:'#374151', margin:'0 0 4px', display:'flex', alignItems:'flex-start', gap:'5px', wordBreak:'break-word' }}>
                              <span style={{ color:'#6b7280', flexShrink:0 }}>👤</span>
                              <span>{a.ponente}</span>
                            </p>
                          )}

                          {/* Fecha + hora + escenario */}
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'2px' }}>
                            {a.fecha && (
                              <span style={{ fontSize:'10.5px', color:'#6b7280', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'2px 8px' }}>
                                📅 {formatFecha(a.fecha)}
                              </span>
                            )}
                            {a.hora && (
                              <span style={{ fontSize:'10.5px', color:'#6b7280', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'2px 8px' }}>
                                🕐 {formatHora(a.hora)}
                              </span>
                            )}
                            {a.escenario && (
                              <span style={{ fontSize:'10.5px', color:'#6b7280', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'2px 8px' }}>
                                📍 {a.escenario}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop:'28px' }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Pantallas muy pequeñas (≤ 360px) */
        @media (max-width: 360px) {
          .vc-logo { width: 40px !important; height: 40px !important; }
          .vc-title { font-size: 15px !important; }
          .vc-inst  { font-size: 8px !important; }
          .vc-sub   { font-size: 10px !important; }
          .vc-nombre { font-size: 15px !important; }
          .vc-avatar { width: 44px !important; height: 44px !important; font-size: 18px !important; }
          .vc-badge  { min-width: 44px !important; padding: 8px 10px !important; }
          .vc-badge-num { font-size: 20px !important; }
          .vc-card-pad { padding: 12px !important; }
        }

        /* Pantallas medianas (361–480px) */
        @media (min-width: 361px) and (max-width: 480px) {
          .vc-logo  { width: 48px !important; height: 48px !important; }
          .vc-title { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default VerificarConstancia;
