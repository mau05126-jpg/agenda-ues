// src/pages/AdminPdfViewer.jsx
import { useState, useEffect } from 'react';
import logoImg from '../assets/Logo.png';
import umbImg from '../assets/umbb.png';

/* Calcula la hora de fin a partir de hora inicio (HH:MM) + duración en minutos */
const calcHoraFin = (hora, duracion) => {
  if (!hora || hora === 'N/A' || !duracion) return null;
  const partes = hora.split(':');
  if (partes.length < 2) return null;
  const [h, m] = partes.map(Number);
  const total = h * 60 + m + parseInt(duracion);
  const hF = Math.floor(total / 60) % 24;
  const mF = total % 60;
  return `${String(hF).padStart(2, '0')}:${String(mF).padStart(2, '0')}`;
};

const AdminPdfViewer = ({ setCurrentPage }) => {
  const [zoom, setZoom] = useState(100);
  const [sesiones, setSesiones] = useState(() => {
    const cached = localStorage.getItem('admin_sesiones_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [cargando, setCargando] = useState(false);

  /* Refrescar datos reales de la API para obtener duracion y descripcion */
  useEffect(() => {
    const refrescar = async () => {
      setCargando(true);
      try {
        const res = await fetch('/api/sesiones/listar');
        const data = await res.json();
        if (data.success && data.sesiones) {
          const formateadas = data.sesiones.map(s => ({
            id: s.id,
            nombre: s.titulo || 'Sin título',
            ponente: s.ponente || '',
            escenario: s.escenario || '',
            fecha: s.fecha,
            hora: s.hora ? s.hora.substring(0, 5) : '',
            duracion: s.duracion || 90,
            descripcion: s.descripcion || '',
          }));
          setSesiones(formateadas);
          localStorage.setItem('admin_sesiones_cache', JSON.stringify(formateadas));
        }
      } catch (_) { /* mantener datos del cache */ }
      finally { setCargando(false); }
    };
    refrescar();
  }, []);

  const formatFechaDia = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    const d = new Date(fechaStr + 'T12:00:00');
    const str = d.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const sesionesOrdenadas = [...sesiones].sort((a, b) => {
    if ((a.fecha || '') !== (b.fecha || '')) return (a.fecha || '').localeCompare(b.fecha || '');
    return (a.hora || '').localeCompare(b.hora || '');
  });

  const sesionesConDia = {};
  sesionesOrdenadas.forEach(s => {
    const key = s.fecha || 'sin-fecha';
    if (!sesionesConDia[key]) sesionesConDia[key] = [];
    sesionesConDia[key].push(s);
  });
  const dias = Object.keys(sesionesConDia).sort();

  const today = new Date();
  const fechaEmision = today.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const folio = `UMB-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-001`;

  const zoomIn  = () => setZoom(z => Math.min(z + 10, 160));
  const zoomOut = () => setZoom(z => Math.max(z - 10, 50));

  return (
    <div className="h-screen flex flex-col print:h-auto print:block print:overflow-visible" style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* ══════════════ TOOLBAR (estilo Navbar pública) ══════════════ */}
      <div className="flex items-center justify-between shrink-0 print:hidden" style={{
        background: '#F1F8F1',
        borderBottom: '1px solid rgba(46,125,50,0.18)',
        height: '60px',
        padding: '0 24px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        gap: '12px',
      }}>

        {/* Izquierda: brand + volver */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
          <button
            onClick={() => setCurrentPage('adminReportes')}
            style={navBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Volver</span>
          </button>

          <div style={{ width: '1px', height: '28px', background: '#c8e6c9' }} />

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontWeight: 800, fontSize: '13px', color: '#166534', letterSpacing: '0.04em' }}>
              REPOSITORIO UMB
            </span>
            <span style={{ fontSize: '10px', color: '#43A047', letterSpacing: '0.07em' }}>
              Documentos Oficiales
            </span>
          </div>
        </div>

        {/* Centro: título */}
        <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden', padding: '0 12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            Programa — 12va Jornada Académica y Cultural 2025
          </span>
          {cargando && (
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Actualizando datos…</span>
          )}
        </div>

        {/* Derecha: zoom + imprimir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px', justifyContent: 'flex-end' }}>
          {/* Zoom group */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
            <button onClick={zoomOut} style={zoomBtn} title="Reducir">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
            </button>
            <span style={{ padding: '0 10px', fontSize: '12px', fontWeight: 700, color: '#374151', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', userSelect: 'none' }}>
              {zoom}%
            </span>
            <button onClick={zoomIn} style={zoomBtn} title="Ampliar">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />

          {/* Imprimir */}
          <button
            onClick={() => window.print()}
            style={{ ...navBtn, background: '#1B5E20', color: 'white', border: '1px solid #166534', padding: '7px 14px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Imprimir</span>
          </button>

        </div>
      </div>

      {/* ══════════════ ZONA DEL DOCUMENTO ══════════════ */}
      <div className="pdf-viewer flex-1 overflow-auto pt-9 px-6 pb-14 bg-[#dde3ea] flex justify-center items-start print:block print:p-[2cm] print:bg-white print:overflow-visible print:h-auto print:flex-none">
        <div className="inline-block print:block print:!w-full print:![zoom:1]" style={{ zoom: `${zoom}%` }}>

          {/* ══════════════ PÁGINA DEL DOCUMENTO ══════════════ */}
          <div className="print:!w-full print:overflow-visible" style={{
            width: '816px',
            background: 'white',
            overflow: 'hidden',
            color: '#111827',
          }}>

            {/* Barra superior verde con degradado */}
            <div style={{ height: '7px', background: 'linear-gradient(90deg, #1B5E20 0%, #2E7D32 50%, #66BB6A 100%)' }} />

            {/* ── Cabecera del documento ── */}
            <div style={{ padding: '28px 40px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>

              {/* Logo izquierdo — umb.png */}
              <div style={{ width: '110px', height: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={umbImg} alt="Logo UMB" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              {/* Texto central */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#2E7D32', letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Universidad Mexiquense del Bicenteario — San José del Rincón
                </p>

                {/* Línea decorativa */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', justifyContent: 'center' }}>
                  <div style={{ height: '1px', width: '50px', background: 'linear-gradient(to right, transparent, #1B5E20)' }} />
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#2E7D32', fontVariationSettings: "'FILL' 1" }}>school</span>
                  <div style={{ height: '1px', width: '50px', background: 'linear-gradient(to left, transparent, #1B5E20)' }} />
                </div>

                <h1 style={{ fontSize: '17px', fontWeight: 900, color: '#111827', lineHeight: 1.3, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                  Reporte Oficial — Programa de la{' '}
                  <span style={{ color: '#1B5E20' }}>12va Jornada Académica y Cultural 2025</span>
                </h1>

                {/* Documento oficial */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <MetaChip icon="verified" label="Documento oficial" destacado />
                </div>
              </div>

              {/* Logo derecho — Logo.png */}
              <div style={{ width: '110px', height: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>

            {/* Línea divisoria elegante centrada */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, #1B5E20 30%, #1B5E20 70%, transparent 100%)', margin: '0 48px' }} />

            {/* ── Encabezado de sección ── */}
            <div style={{ padding: '16px 48px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '20px', background: 'linear-gradient(to bottom, #1B5E20, #43A047)', borderRadius: '2px' }} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1B5E20', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Programa de Sesiones y Actividades
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#2E7D32', background: '#f1f8f1', border: '1px solid #c8e6c9', borderRadius: '20px', padding: '3px 12px' }}>
                  Jornada 2025
                </span>
                {cargando && (
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>actualizando…</span>
                )}
              </div>
            </div>

            {/* ── Sesiones agrupadas por día ── */}
            <div style={{ padding: '0 48px 32px' }}>
              {cargando && sesiones.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  Cargando sesiones…
                </div>
              ) : dias.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' }}>
                  No hay sesiones registradas
                </div>
              ) : (
                dias.map((fecha, diaIndex) => (
                  <div key={fecha} className={diaIndex > 0 ? 'dia-nueva-pagina' : ''} style={{ marginBottom: diaIndex < dias.length - 1 ? '36px' : 0 }}>
                    {/* Encabezado del día */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #1B5E20' }}>
                      <div style={{ width: '4px', height: '22px', background: 'linear-gradient(to bottom, #1B5E20, #43A047)', borderRadius: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1B5E20', letterSpacing: '0.01em' }}>
                        {formatFechaDia(fecha)}
                      </span>
                    </div>

                    {/* Tabla del día */}
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
                        <thead>
                          <tr className="pdf-th-row" style={{ background: '#1B5E20' }}>
                            <th style={{ ...thStyle, width: '110px', textAlign: 'center' }}>Horario</th>
                            <th style={{ ...thStyle, textAlign: 'left' }}>Sesión / Actividad</th>
                            <th style={{ ...thStyle, width: '160px', textAlign: 'left' }}>Ponente</th>
                            <th style={{ ...thStyle, width: '120px', textAlign: 'left' }}>Escenario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sesionesConDia[fecha].map((s, i) => {
                            const horaFin = calcHoraFin(s.hora, s.duracion);
                            const esPar = i % 2 === 0;
                            return (
                              <tr key={s.id || i} style={{ borderBottom: '1px solid #e5e7eb', background: esPar ? '#f8fdf8' : 'white' }}>
                                {/* Horario */}
                                <td style={{
                                  padding: '13px 8px',
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                  borderRight: '2px solid #d1fae5',
                                  background: esPar ? '#ecfdf5' : '#f0fdf4',
                                  minWidth: '90px',
                                }}>
                                  {s.hora ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                                      <span style={{ fontWeight: 800, color: '#166534', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.04em' }}>
                                        {s.hora}
                                      </span>
                                      {horaFin && (
                                        <>
                                          <span style={{ fontSize: '9px', color: '#9ca3af', lineHeight: 1 }}>▼</span>
                                          <span style={{ fontWeight: 700, color: '#2E7D32', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.04em' }}>
                                            {horaFin}
                                          </span>
                                          <span style={{ fontSize: '8px', color: '#9ca3af', marginTop: '2px', letterSpacing: '0.04em' }}>
                                            {s.duracion} min
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontStyle: 'italic', fontSize: '11px' }}>—</span>
                                  )}
                                </td>

                                {/* Sesión + descripción */}
                                <td style={{ padding: '13px 16px', verticalAlign: 'top' }}>
                                  <span style={{ display: 'block', fontWeight: 700, fontSize: '12.5px', color: '#111827', lineHeight: 1.4, marginBottom: s.descripcion ? '5px' : 0 }}>
                                    {s.nombre || '—'}
                                  </span>
                                  {s.descripcion && s.descripcion.trim() && (
                                    <span style={{
                                      display: 'block',
                                      fontSize: '11px',
                                      color: '#6b7280',
                                      lineHeight: 1.55,
                                      paddingLeft: '9px',
                                      borderLeft: '2px solid #c8e6c9',
                                      marginTop: '1px',
                                    }}>
                                      {s.descripcion.length > 130 ? s.descripcion.substring(0, 130) + '…' : s.descripcion}
                                    </span>
                                  )}
                                  {s.tipo && s.tipo !== 'Conferencia' && (
                                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '9px', fontWeight: 700, color: '#166534', background: '#dcfce7', borderRadius: '20px', padding: '1px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                      {s.tipo}
                                    </span>
                                  )}
                                </td>

                                {/* Ponente */}
                                <td style={{ padding: '13px 14px', verticalAlign: 'top', color: '#374151', fontSize: '11.5px', lineHeight: 1.4 }}>
                                  {s.ponente
                                    ? (
                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e8f5e9', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>
                                            {s.ponente.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <span style={{ paddingTop: '2px' }}>{s.ponente}</span>
                                      </div>
                                    )
                                    : <span style={{ color: '#d1d5db', fontStyle: 'italic', fontSize: '11px' }}>Sin ponente</span>
                                  }
                                </td>

                                {/* Escenario */}
                                <td style={{ padding: '13px 14px', verticalAlign: 'top' }}>
                                  {s.escenario && s.escenario !== 'No asignado'
                                    ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f8f1', border: '1px solid #c8e6c9', borderRadius: '6px', padding: '4px 9px', fontSize: '11px', fontWeight: 600, color: '#2E7D32' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>meeting_room</span>
                                        {s.escenario}
                                      </span>
                                    )
                                    : <span style={{ color: '#d1d5db', fontSize: '11px', fontStyle: 'italic' }}>—</span>
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Pie del documento ── */}
            <div style={{ background: '#f8fafc', borderTop: '2px solid #e0ece0', padding: '20px 48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>

                {/* Sello mejorado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{
                    width: '54px', height: '54px', borderRadius: '50%',
                    border: '2.5px solid #1B5E20',
                    background: 'white',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 4px #e8f5e9',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1B5E20', fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span style={{ fontSize: '6px', fontWeight: 900, color: '#1B5E20', textAlign: 'center', lineHeight: 1.2, textTransform: 'uppercase' }}>
                      VÁLIDO<br />UMB
                    </span>
                  </div>
                  <div style={{ lineHeight: 1.4 }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: '#166534', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sello Oficial</p>
                    <p style={{ fontSize: '9px', color: '#6b7280', margin: 0 }}>Validez institucional garantizada</p>
                    <p style={{ fontSize: '8px', color: '#9ca3af', margin: '2px 0 0', fontFamily: 'monospace' }}>{folio}</p>
                  </div>
                </div>

                {/* Centro */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, fontStyle: 'italic', color: '#1B5E20', margin: 0, letterSpacing: '0.06em' }}>
                    "Cultura que inspira, conocimiento que transforma"
                  </p>
                </div>

              </div>
            </div>

            {/* Barra inferior verde */}
            <div style={{ height: '5px', background: 'linear-gradient(90deg, #66BB6A, #2E7D32 50%, #1B5E20)' }} />
          </div>
        </div>
      </div>

      {/* ══════════════ ESTILOS DE IMPRESIÓN ══════════════ */}
      <style>{`
        @page { margin: 0; size: letter; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          .material-symbols-outlined { font-family: 'Material Symbols Outlined' !important; font-weight: normal !important; font-style: normal !important; display: inline-block !important; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          thead { display: table-header-group; }
          .dia-nueva-pagina { page-break-before: always; break-before: page; padding-top: 24px; }
        }
        .pdf-viewer::-webkit-scrollbar { width: 8px; height: 8px; }
        .pdf-viewer::-webkit-scrollbar-track { background: #d1d5db; }
        .pdf-viewer::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
        .pdf-viewer::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>
    </div>
  );
};

/* ── Sub-componentes inline ── */
const MetaChip = ({ icon, label, mono, destacado }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: destacado ? '#e8f5e9' : '#f3f4f6',
    border: `1px solid ${destacado ? '#c8e6c9' : '#e5e7eb'}`,
    borderRadius: '20px',
    padding: '4px 10px',
  }}>
    <span className="material-symbols-outlined" style={{ fontSize: '12px', color: destacado ? '#2E7D32' : '#6b7280', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    <span style={{ fontSize: '10px', fontWeight: 700, color: destacado ? '#1B5E20' : '#374151', fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.03em' : 'inherit' }}>
      {label}
    </span>
  </div>
);

/* ── Estilos compartidos ── */
const navBtn = {
  display: 'flex', alignItems: 'center', gap: '6px',
  background: 'white',
  border: '1px solid #d1d5db',
  color: '#374151',
  borderRadius: '7px',
  padding: '7px 12px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
  transition: 'background 0.15s',
};

const zoomBtn = {
  background: 'transparent',
  border: 'none',
  color: '#374151',
  padding: '6px 10px',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1,
};

const thStyle = {
  padding: '11px 14px',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'white',
};

const badgeStyle = {
  fontSize: '9px',
  fontWeight: 700,
  color: '#2E7D32',
  background: '#f1f8f1',
  border: '1px solid #c8e6c9',
  borderRadius: '20px',
  padding: '2px 9px',
  letterSpacing: '0.04em',
};

export default AdminPdfViewer;
