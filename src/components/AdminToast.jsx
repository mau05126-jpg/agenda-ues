import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};

const AdminToast = ({ toasts, removeToast, darkMode }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-20 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl shadow-xl border p-4 min-w-[300px] max-w-[380px] pointer-events-auto animate-toast-in ${
            darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'
          }`}
          style={{ borderLeft: `4px solid ${toast.type === 'success' ? '#2E7D32' : '#C62828'}` }}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            toast.type === 'success' ? 'bg-[#E8F5E9]' : 'bg-[#FFEBEE]'
          }`}>
            <span
              className={`material-symbols-outlined text-lg ${toast.type === 'success' ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
          </div>
          <p className={`flex-1 text-sm font-semibold pt-1 leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className={`flex-shrink-0 p-0.5 rounded-lg transition-colors ${
              darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-toast-in { animation: toast-in 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminToast;
