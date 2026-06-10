import { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../services/authService';
import logoDefault from '../assets/Logo.png';
import umbDefault from '../assets/umbb.png';

const MAX_SIZE_MB = 10;

const LOGOS = [
  {
    clave: 'logo_principal',
    titulo: 'Logo principal',
    descripcion: 'Aparece en la barra de navegación pública y en el encabezado derecho del reporte PDF.',
    defaultSrc: logoDefault,
    cacheKey: 'logo_principal_cache',
  },
  {
    clave: 'logo_reporte',
    titulo: 'Logo del reporte (izquierda)',
    descripcion: 'Aparece en el lado izquierdo del encabezado del reporte PDF.',
    defaultSrc: umbDefault,
    cacheKey: 'logo_reporte_cache',
  },
];

const LogoCard = ({ logo, darkMode, onSaved }) => {
  const [preview, setPreview] = useState(() => localStorage.getItem(logo.cacheKey) || null);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    fetch('/api/admin?action=config')
      .then(r => r.json())
      .then(data => {
        const val = data.config?.[logo.clave];
        if (val) {
          setPreview(val);
          localStorage.setItem(logo.cacheKey, val);
        }
      })
      .catch(() => {});
  }, [logo.clave, logo.cacheKey]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMsg({ tipo: 'error', texto: `El archivo supera los ${MAX_SIZE_MB} MB permitidos.` });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setMsg(null);
  };

  const guardar = async () => {
    if (!preview || preview === logo.defaultSrc) return;
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin?action=config', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: logo.clave, valor: preview }),
      });
      const data = await res.json();
      if (data.success) {
        const urlFinal = data.url || preview;
        setPreview(urlFinal);
        localStorage.setItem(logo.cacheKey, urlFinal);
        setMsg({ tipo: 'ok', texto: 'Logo guardado en Cloudinary. Los cambios ya son visibles.' });
        if (onSaved) onSaved(logo.clave, urlFinal);
      } else {
        setMsg({ tipo: 'error', texto: 'Error al guardar.' });
      }
    } catch {
      setMsg({ tipo: 'error', texto: 'Error de conexión.' });
    } finally {
      setGuardando(false);
    }
  };

  const restaurar = async () => {
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin?action=config', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: logo.clave, valor: null }),
      });
      localStorage.removeItem(logo.cacheKey);
      setPreview(null);
      setMsg({ tipo: 'ok', texto: 'Logo restaurado al predeterminado.' });
      if (onSaved) onSaved(logo.clave, null);
    } catch {
      setMsg({ tipo: 'error', texto: 'Error de conexión.' });
    } finally {
      setGuardando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const imagenActual = preview || logo.defaultSrc;
  const esPersonalizado = !!preview;

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="h-1 bg-green-600" />
      <div className="p-6 space-y-4">
        <div>
          <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{logo.titulo}</h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{logo.descripcion}</p>
        </div>

        {/* Preview */}
        <div className={`flex items-center justify-center rounded-xl p-6 border-2 border-dashed ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`} style={{ minHeight: '140px' }}>
          <img
            src={imagenActual}
            alt={logo.titulo}
            className="max-h-24 max-w-full object-contain"
          />
        </div>

        {esPersonalizado && (
          <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'}`}>
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Logo personalizado activo
          </div>
        )}

        {msg && (
          <p className={`text-xs font-semibold ${msg.tipo === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
            {msg.texto}
          </p>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition">
            <span className="material-symbols-outlined text-sm">upload</span>
            Subir imagen
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>

          <button
            onClick={guardar}
            disabled={guardando || !preview}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            {guardando ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            Guardar
          </button>

          {esPersonalizado && (
            <button
              onClick={restaurar}
              disabled={guardando}
              className={`flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Restaurar
            </button>
          )}
        </div>
        <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Formatos: PNG, JPG, SVG, WebP · Máximo {MAX_SIZE_MB} MB
        </p>
      </div>
    </div>
  );
};

const AdminLogos = ({ setCurrentPage }) => {
  const [darkMode] = useState(() => localStorage.getItem('agendaDarkMode') === 'true');
  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.rol !== 'admin') setCurrentPage('loginPage');
  }, []);

  if (!user || user.rol !== 'admin') return null;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 h-16 flex items-center px-6 border-b shadow-sm ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <button onClick={() => setCurrentPage('admin')} className="flex items-center gap-2 mr-6">
          <span className="material-symbols-outlined text-green-600">arrow_back</span>
          <span className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Panel</span>
        </button>
        <h1 className="font-extrabold text-lg">Gestión de Logos</h1>
      </nav>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">

        <div className="mb-8">
          <h2 className="text-3xl font-extrabold">Logos del sistema</h2>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Sube una imagen para reemplazar los logos predeterminados. Los cambios se reflejan en la navegación pública y en los reportes PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LOGOS.map(logo => (
            <LogoCard key={logo.clave} logo={logo} darkMode={darkMode} />
          ))}
        </div>


      </main>
    </div>
  );
};

export default AdminLogos;
