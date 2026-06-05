import { useState, useEffect } from 'react';
import logoImg from '../assets/Logo.png';
import umbImg  from '../assets/umbb.png';

const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

const formatFecha = (f) => {
  if (!f) return '';
  const [y, m, d] = String(f).split('T')[0].split('-').map(Number);
  return `${d} de ${MESES_ES[m - 1]}`;
};

const formatHora = (h) => {
  if (!h) return '';
  const [hh, mm] = h.substring(0, 5).split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${(hh % 12 || 12).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
};

const VerificarConstancia = ({ uid: uidProp }) => {
  const [estado, setEstado] = useState('cargando');
  const [data, setData] = useState(null);

  useEffect(() => {
    // Leer uid del prop o del sessionStorage como respaldo
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
    <div style={{ minHeight: '100vh', background: '#f0f4f0', fontFamily: '"Segoe UI", system-ui, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', marginBottom: '16px' }}>
          <div style={{ height: '6px', background: 'linear-gradient(90deg,#1B5E20,#43A047,#66BB6A)' }} />
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={umbImg} alt="UMB" style={{ height: '52px', objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#2E7D32', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                Universidad Mexiquense del Bicentenario
              </p>
              <h1 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', margin: '0 0 2px' }}>
                Verificación de Constancia
              </h1>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                12va Jornada Académica y Cultural 2025
              </p>
            </div>
            <img src={logoImg} alt="Logo" style={{ height: '52px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Cargando */}
        {estado === 'cargando' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ width: '36px', height: '36px', border: '4px solid #1B5E20', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Verificando constancia...</p>
          </div>
        )}

        {/* Error */}
        {estado === 'error' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Constancia no válida</h2>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>El código QR no corresponde a ninguna constancia registrada.</p>
          </div>
        )}

        {/* Resultado */}
        {estado === 'ok' && data && (
          <>
            {/* Info estudiante */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e8f5e9', border: '2px solid #c8e6c9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#1B5E20', flexShrink: 0 }}>
                  {data.estudiante.nombre?.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 2px' }}>{data.estudiante.nombre}</p>
                  {data.estudiante.matricula && (
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Matrícula: {data.estudiante.matricula}</p>
                  )}
                </div>
                <div style={{ marginLeft: 'auto', background: '#f0fdf4', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                  <p style={{ fontSize: '22px', fontWeight: 900, color: '#1B5E20', margin: 0, lineHeight: 1 }}>{data.asistencias.length}</p>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#2E7D32', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>sesiones</p>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', border: '1px solid #c8e6c9' }}>
                <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.7 }}>
                  ✅ Se certifica que el/la estudiante <strong>{data.estudiante.nombre}</strong> participó en la <strong>12va Jornada Académica y Cultural 2025</strong> de la Universidad Mexiquense del Bicentenario, confirmando asistencia a <strong>{data.asistencias.length} {data.asistencias.length === 1 ? 'sesión' : 'sesiones'}</strong>.
                </p>
              </div>
            </div>

            {/* Sesiones */}
            {data.asistencias.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
                  Sesiones confirmadas
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.asistencias.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: i < data.asistencias.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#1B5E20', minWidth: '20px', marginTop: '2px' }}>{i + 1}.</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 2px', lineHeight: 1.3 }}>{a.titulo}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                          {formatFecha(a.fecha)}{a.hora ? ` · ${formatHora(a.hora)}` : ''}{a.escenario ? ` · ${a.escenario}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '20px' }}>
          agenda-ues.vercel.app · Verificación automática de constancias
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerificarConstancia;
