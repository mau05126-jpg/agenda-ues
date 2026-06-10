import { useState, useEffect, useRef } from 'react';

/**
 * Escribe el texto letra por letra cuando el elemento entra en la vista.
 * Props:
 *   text       — texto a escribir
 *   tag        — elemento HTML ('h1','h2','p', etc.)  default: 'span'
 *   className  — clases CSS del elemento
 *   speed      — ms por carácter                      default: 28
 *   delay      — ms de espera antes de empezar        default: 0
 *   showCursor — mostrar cursor parpadeante            default: true
 */
const TypewriterText = ({
  text,
  tag: Tag = 'span',
  className = '',
  speed = 28,
  delay = 0,
  showCursor = true,
}) => {
  const [displayed, setDisplayed] = useState('');
  const [done,      setDone]      = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        let iv;
        const start = setTimeout(() => {
          let i = 0;
          iv = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
              clearInterval(iv);
              setDone(true);
            }
          }, speed);
        }, delay);

        return () => { clearTimeout(start); clearInterval(iv); };
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {displayed}
      {showCursor && !done && <span className="tw-cursor">|</span>}
    </Tag>
  );
};

export default TypewriterText;
