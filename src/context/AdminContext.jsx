// src/context/AdminContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  // Estados con datos de caché INSTANTÁNEOS
  const [sesiones, setSesiones] = useState(() => {
    const cached = localStorage.getItem('admin_sesiones_cache');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('admin_dashboard_stats');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Limpiar caché corrupto si distribución tiene datos incorrectos
      const dist = parsed.distribucion;
      const soloLunes = dist && dist.LUN?.valor > 0 && dist.MAR?.valor === 0 && dist.MIE?.valor === 0 && dist.JUE?.valor === 0 && dist.VIE?.valor === 0;
      if (parsed.estudiantes === 45 || !parsed.distribucion || soloLunes) {
        localStorage.removeItem('admin_dashboard_stats');
        return {
          sesiones: 0,
          ponentes: 0,
          escenarios: 0,
          estudiantes: 0,
          distribucion: {
            LUN: { valor: 0, altura: '0%' },
            MAR: { valor: 0, altura: '0%' },
            MIE: { valor: 0, altura: '0%' },
            JUE: { valor: 0, altura: '0%' },
            VIE: { valor: 0, altura: '0%' }
          }
        };
      }
      return parsed;
    }
    return {
      sesiones: 0,
      ponentes: 0,
      escenarios: 0,
      estudiantes: 0,
      distribucion: {
        LUN: { valor: 0, altura: '0%' },
        MAR: { valor: 0, altura: '0%' },
        MIE: { valor: 0, altura: '0%' },
        JUE: { valor: 0, altura: '0%' },
        VIE: { valor: 0, altura: '0%' }
      }
    };
  });

  // Función para recalcular estadísticas de sesiones
  const recalcularStats = (sesionesData) => {
    const distribucionRaw = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    sesionesData.forEach(s => {
      const fecha = s.fechaOriginal || s.fecha;
      if (fecha) {
        const dia = new Date(String(fecha).substring(0, 10) + 'T12:00:00').getDay();
        if (dia >= 1 && dia <= 5) distribucionRaw[dia]++;
      }
    });
    
    const valores = Object.values(distribucionRaw);
    const maxValor = Math.max(...valores, 1);
    const escalar = (valor) => `${(valor / maxValor) * 90}%`;
    
    return {
      sesiones: sesionesData.length,
      ponentes: new Set(sesionesData.map(s => s.ponente)).size,
      escenarios: new Set(sesionesData.map(s => s.escenario)).size,
      estudiantes: stats.estudiantes,
      distribucion: {
        LUN: { valor: distribucionRaw[1], altura: escalar(distribucionRaw[1]) },
        MAR: { valor: distribucionRaw[2], altura: escalar(distribucionRaw[2]) },
        MIE: { valor: distribucionRaw[3], altura: escalar(distribucionRaw[3]) },
        JUE: { valor: distribucionRaw[4], altura: escalar(distribucionRaw[4]) },
        VIE: { valor: distribucionRaw[5], altura: escalar(distribucionRaw[5]) }
      }
    };
  };

  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 1. Obtener estudiantes reales desde usuarios API
      let estudiantesReales = 0;
      try {
        const usuariosRes = await fetch('/api/admin/usuarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usuariosData = await usuariosRes.json();
        if (usuariosData.success && usuariosData.usuarios) {
          estudiantesReales = usuariosData.usuarios.filter(u => u.rol === 'estudiante' && u.activo !== false).length;
        }
      } catch (err) {
        console.error('Error obteniendo estudiantes:', err);
      }
      
      // 2. Obtener estadísticas de sesiones
      const sesionesRes = await fetch('/api/sesiones/listar');
      const sesionesData = await sesionesRes.json();
      
      let sesionesCount = 0;
      let ponentesCount = 0;
      let escenariosCount = 0;
      let sesionesArray = [];
      
      if (sesionesData.success && sesionesData.sesiones) {
        sesionesCount = sesionesData.sesiones.length;
        ponentesCount = new Set(sesionesData.sesiones.map(s => s.ponente)).size;
        escenariosCount = new Set(sesionesData.sesiones.map(s => s.escenario)).size;
        sesionesArray = sesionesData.sesiones;
      }
      
      // 3. Calcular distribución por día de la semana
      const distribucionRaw = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      sesionesArray.forEach(s => {
        const fecha = s.fechaOriginal || s.fecha;
        if (fecha) {
          const dia = new Date(String(fecha).substring(0, 10) + 'T12:00:00').getDay();
          if (dia >= 1 && dia <= 5) distribucionRaw[dia]++;
        }
      });
      
      const valores = Object.values(distribucionRaw);
      const maxValor = Math.max(...valores, 1);
      const escalar = (valor) => `${(valor / maxValor) * 90}%`;
      
      const distribucion = {
        LUN: { valor: distribucionRaw[1], altura: escalar(distribucionRaw[1]) },
        MAR: { valor: distribucionRaw[2], altura: escalar(distribucionRaw[2]) },
        MIE: { valor: distribucionRaw[3], altura: escalar(distribucionRaw[3]) },
        JUE: { valor: distribucionRaw[4], altura: escalar(distribucionRaw[4]) },
        VIE: { valor: distribucionRaw[5], altura: escalar(distribucionRaw[5]) }
      };
      
      // 4. Actualizar estado CON distribución incluida
      const nuevosStats = {
        sesiones: sesionesCount,
        ponentes: ponentesCount,
        escenarios: escenariosCount,
        estudiantes: estudiantesReales,
        distribucion
      };
      
      setStats(nuevosStats);
      
      // 5. Guardar en caché solo si el valor de estudiantes es correcto (no 45)
      if (estudiantesReales !== 45) {
        localStorage.setItem('admin_dashboard_stats', JSON.stringify(nuevosStats));
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Eliminar una sesión
  const eliminarSesion = (id) => {
    console.log('Eliminando sesión ID:', id);
    const nuevasSesiones = sesiones.filter(s => s.id !== id);
    setSesiones(nuevasSesiones);
    
    const nuevosStats = recalcularStats(nuevasSesiones);
    setStats(nuevosStats);
    
    localStorage.setItem('admin_sesiones_cache', JSON.stringify(nuevasSesiones));
    localStorage.setItem('admin_dashboard_stats', JSON.stringify(nuevosStats));
  };

  // Actualizar una sesión
  const actualizarSesion = (sesionActualizada) => {
    console.log('Actualizando sesión:', sesionActualizada.id);
    const nuevasSesiones = sesiones.map(s => 
      s.id === sesionActualizada.id ? sesionActualizada : s
    );
    setSesiones(nuevasSesiones);
    
    const nuevosStats = recalcularStats(nuevasSesiones);
    setStats(nuevosStats);
    
    localStorage.setItem('admin_sesiones_cache', JSON.stringify(nuevasSesiones));
    localStorage.setItem('admin_dashboard_stats', JSON.stringify(nuevosStats));
  };

  // Agregar una nueva sesión
  const agregarSesion = (nuevaSesion) => {
    const nuevasSesiones = [nuevaSesion, ...sesiones];
    setSesiones(nuevasSesiones);
    const nuevosStats = recalcularStats(nuevasSesiones);
    setStats(nuevosStats);
    localStorage.setItem('admin_sesiones_cache', JSON.stringify(nuevasSesiones));
    localStorage.setItem('admin_dashboard_stats', JSON.stringify(nuevosStats));
  };

  // Cargar datos desde la API
  const cargarDatosDesdeAPI = async () => {
    try {
      // Cargar sesiones
      const response = await fetch('/api/sesiones/listar');
      const data = await response.json();
      
      if (data.success && data.sesiones) {
        const sesionesFormateadas = data.sesiones.map(s => ({
          id: s.id,
          tipo: s.categoria || 'Conferencia',
          nombre: s.titulo || 'Sin título',
          eje: s.ponente_especialidad || 'General',
          ponente: s.ponente || 'Desconocido',
          ponenteIniciales: s.ponente ? s.ponente.charAt(0) + (s.ponente.charAt(1) || '') : '??',
          fecha: s.fecha ? new Date(String(s.fecha).substring(0, 10) + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
          fechaOriginal: s.fecha,
          hora: s.hora ? s.hora.substring(0, 5) : 'N/A',
          duracion: s.duracion || 90,
          escenario: s.escenario || 'No asignado',
          publico: Array.isArray(s.publico_objetivo) ? s.publico_objetivo.join(', ') : (s.publico_objetivo || 'General'),
          descripcion: s.descripcion || '',
          colorTipo: 'bg-[#E8F5E9] text-[#2E7D32]'
        }));
        
        setSesiones(sesionesFormateadas);
        
        // Cargar estadísticas reales desde la API (incluye distribución)
        await cargarEstadisticas();
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    cargarDatosDesdeAPI();
  }, []);

  return (
    <AdminContext.Provider value={{
      sesiones,
      stats,
      actualizarSesion,
      eliminarSesion,
      agregarSesion,
      refreshData: cargarDatosDesdeAPI
    }}>
      {children}
    </AdminContext.Provider>
  );
};