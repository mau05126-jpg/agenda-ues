import { useState, useEffect } from 'react';

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(0,30,10,0.75) 0%, rgba(0,0,0,0.65) 100%)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(74,222,128,0.25)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const TITLE_LINES  = ['12va Jornada', 'Académica y', 'Cultural 2025'];
const TITLE_FULL   = TITLE_LINES.join('\n');
const SUBTITLE     = 'Cultura que Inspira, Conocimiento que Transforma.';
const CARD_TARGETS = [5, 14, 20];
const CARD_SUFFIX  = ['', '+', '+'];
const CARD_ICONS   = ['calendar_month', 'mic', 'school'];
const CARD_LABELS  = ['Días de Evento', 'Conferencistas', 'Sesiones Académicas'];

const HeroSection = () => {
  const [titleTyped,    setTitleTyped]    = useState('');
  const [subtitleTyped, setSubtitleTyped] = useState('');
  // 0=escribiendo título  1=pausa tras título  2=escribiendo subtítulo  3=pausa tras subtítulo  4=done
  const [phase,         setPhase]         = useState(0);
  const [counts,        setCounts]        = useState([0, 0, 0]);
  const [showExtras,    setShowExtras]    = useState(false);
  const [cursorOpacity, setCursorOpacity] = useState(1);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const isWritingTitle    = phase === 0;
  const isWritingSubtitle = phase === 2;
  const showTitleCursor    = phase <= 1;
  const showSubtitleCursor = phase === 2 || phase === 3;

  /* ── Fase 0: escribe el título ── */
  useEffect(() => {
    let iv;
    let i = 0;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        i++;
        setTitleTyped(TITLE_FULL.slice(0, i));
        if (i >= TITLE_FULL.length) {
          clearInterval(iv);
          // Fase 1: pausa con cursor parpadeante
          setPhase(1);
          // En móvil el subtítulo no se ve → saltar directo a fase 4
          setTimeout(() => {
            if (isMobile) { setCursorOpacity(0); setTimeout(() => { setPhase(4); setShowExtras(true); }, 300); }
            else setPhase(2);
          }, 380);
        }
      }, 22);
    }, 280);
    return () => { clearTimeout(start); clearInterval(iv); };
  }, []);

  /* ── Fase 2: escribe el subtítulo ── */
  useEffect(() => {
    if (phase !== 2) return;
    let iv;
    let i = 0;
    iv = setInterval(() => {
      i++;
      setSubtitleTyped(SUBTITLE.slice(0, i));
      if (i >= SUBTITLE.length) {
        clearInterval(iv);
        // Fase 3: pausa con cursor parpadeante
        setPhase(3);
        setTimeout(() => {
          // Cursor desaparece con fade
          setCursorOpacity(0);
          setTimeout(() => { setPhase(4); setShowExtras(true); }, 350);
        }, 420);
      }
    }, 17);
    return () => clearInterval(iv);
  }, [phase]);

  /* ── Fase 4: contadores de tarjetas — todos terminan en ~650ms ── */
  useEffect(() => {
    if (phase !== 4) return;
    const DURATION  = 650; // ms totales para cada contador
    const timers    = [];
    const intervals = [];
    CARD_TARGETS.forEach((target, idx) => {
      let cur = 0;
      const stepMs = Math.max(16, Math.round(DURATION / target));
      const t = setTimeout(() => {
        const iv = setInterval(() => {
          cur++;
          setCounts(prev => { const n = [...prev]; n[idx] = cur; return n; });
          if (cur >= target) clearInterval(iv);
        }, stepMs);
        intervals.push(iv);
      }, idx * 130);
      timers.push(t);
    });
    return () => { timers.forEach(clearTimeout); intervals.forEach(clearInterval); };
  }, [phase]);

  /* ── Helpers de render ── */
  const typedLines = titleTyped.split('\n');

  // Cursor: sólido mientras escribe, parpadea en las pausas
  const cursorClass = (isWritingTitle || isWritingSubtitle) ? 'hero-cursor-solid' : 'hero-cursor-blink';

  const titleJSX = (className) => (
    <h1 className={className}>
      {TITLE_LINES.map((_, i) => (
        <span key={i} style={{ display: 'block' }}>
          {typedLines[i] !== undefined ? typedLines[i] : ''}
          {showTitleCursor && i === typedLines.length - 1 && (
            <span className={cursorClass} style={{ opacity: cursorOpacity, transition: 'opacity 0.35s ease' }}>|</span>
          )}
        </span>
      ))}
    </h1>
  );

  const fadeIn = (delay = 0) => ({
    opacity:    showExtras ? 1 : 0,
    transform:  showExtras ? 'translateY(0)' : 'translateY(14px)',
    transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
  });

  return (
    <section className="relative w-full pt-16 flex flex-col" style={{ minHeight: '100svh' }}>

      <style>{`
        @keyframes blink-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes badge-drop    { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .hero-cursor-solid { color:#4ade80; font-weight:200; }
        .hero-cursor-blink { color:#4ade80; font-weight:200; animation: blink-cursor 0.5s step-end infinite; }
      `}</style>

      {/* Fondo — solo fade, sin zoom */}
      <div className="absolute inset-0 pt-16">
        <img
          src="/hero-bg.png"
          alt="Edificio UES"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/85 lg:bg-gradient-to-r lg:from-black/40 lg:via-transparent lg:to-transparent" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between sm:justify-end px-4 sm:px-8 pt-4 sm:pt-0 pb-10 sm:pb-10 max-w-[1280px] mx-auto w-full">

        {/* ── MÓVIL: badge arriba ── */}
        <div
          className="sm:hidden inline-flex items-center gap-2 bg-green-400/20 border border-green-400/40 rounded-full px-3 py-1.5 w-fit backdrop-blur-sm"
          style={{ animation: 'badge-drop 0.5s ease 0.2s both' }}
        >
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-300 text-[10px] font-bold tracking-wider uppercase">Edición 2025</span>
        </div>

        {/* ── MÓVIL: título + info ── */}
        <div className="sm:hidden">
          {titleJSX('text-white text-[2.4rem] font-extrabold leading-[1.0] tracking-tight mb-4 drop-shadow-lg')}
          <div className="flex flex-col gap-2" style={fadeIn(0)}>
            <span className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
              <span className="material-symbols-outlined text-green-400 text-[18px] leading-none flex-shrink-0">calendar_today</span>
              <span className="text-white text-[13px] font-semibold">1 al 5 de diciembre de 2025</span>
            </span>
            <span className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
              <span className="material-symbols-outlined text-green-400 text-[18px] leading-none flex-shrink-0">location_on</span>
              <span className="text-white text-[13px] font-semibold">UES San José del Rincón</span>
            </span>
          </div>
        </div>

        {/* ── Bloque inferior: texto desktop + tarjetas ── */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-4 lg:gap-8">

          {/* Texto — solo desktop */}
          <div className="hidden sm:block max-w-lg w-full">
            <div
              className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 mb-3 w-fit backdrop-blur-sm"
              style={{ animation: 'badge-drop 0.5s ease 0.2s both' }}
            >
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-white/90 text-[10px] font-bold tracking-wider uppercase">Edición 2025</span>
            </div>

            {titleJSX('text-white text-5xl font-extrabold leading-[1.05] tracking-tight mb-3 drop-shadow-lg')}

            {/* Subtítulo con cursor */}
            <p className="text-gray-200 text-lg font-medium mb-4 drop-shadow-md" style={{ minHeight: '1.75rem' }}>
              {subtitleTyped}
              {showSubtitleCursor && (
                <span className={cursorClass} style={{ opacity: cursorOpacity, transition: 'opacity 0.35s ease' }}>|</span>
              )}
            </p>

            {/* Fecha y ubicación */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-200 mb-6" style={fadeIn(0.1)}>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-400">calendar_today</span>
                1 al 5 de diciembre de 2025
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-400">location_on</span>
                UES San José del Rincón
              </span>
            </div>
          </div>

          {/* Tarjetas con contador */}
          <div className="flex gap-2 sm:gap-3 w-full lg:w-auto lg:flex-none">
            {CARD_TARGETS.map((target, idx) => (
              <div
                key={idx}
                className="flex-1 lg:flex-none lg:w-44 h-[100px] sm:h-32 lg:h-44 rounded-2xl flex flex-col items-center justify-center text-white"
                style={{
                  ...cardStyle,
                  opacity:    showExtras ? 1 : 0,
                  transform:  showExtras ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
                  transition: `opacity 0.5s ease ${idx * 0.14}s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.14}s`,
                }}
              >
                <span className="material-symbols-outlined text-green-400 text-2xl lg:text-3xl mb-1 lg:mb-3">
                  {CARD_ICONS[idx]}
                </span>
                <div className="text-4xl lg:text-5xl font-extrabold mb-0.5 lg:mb-1">
                  {counts[idx]}{counts[idx] >= target ? CARD_SUFFIX[idx] : ''}
                </div>
                <div className="text-[9px] lg:text-[10px] font-bold tracking-[0.10em] uppercase text-green-300 text-center px-1">
                  {CARD_LABELS[idx]}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
