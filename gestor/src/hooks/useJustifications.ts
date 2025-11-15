import { useState, useEffect } from 'react';

interface Motivo {
  id: string;
  nombre: string;
  es_justificada: boolean;
  horas_compensadas: number;
  descripcion: string;
}

interface Justificacion {
  id_justificacion: number;
  rut_usuario: string;
  fecha_justificacion: string;
  motivo: string;
  motivo_nombre?: string;
  motivo_descripcion?: string;
  descripcion: string | null;
  es_justificada: boolean;
  horas_compensadas: number;
  estado: string;
  observaciones: string | null;
  fecha_registro: string;
  createdAt: string;
  updatedAt: string;
}

interface Estadisticas {
  total: number;
  justificadas: number;
  no_justificadas: number;
  horas_compensadas_total: number;
}

interface FiltrosJustificaciones {
  mes?: number;
  anio?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  es_justificada?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useJustificaciones = () => {
  const [justificaciones, setJustificaciones] = useState<Justificacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ OBTENER TOKEN
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // ✅ FUNCIÓN GENÉRICA PARA LLAMADAS API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return response.json();
  };

  // ✅ OBTENER MOTIVOS DISPONIBLES
  const obtenerMotivos = async () => {
    try {
      console.log('📋 [useJustificaciones] Obteniendo motivos...');
      const result = await apiCall('justificaciones/motivos');
      
      if (result.success && result.data) {
        setMotivos(result.data);
        console.log('✅ [useJustificaciones] Motivos obtenidos:', result.data.length);
      }
    } catch (err) {
      console.error('❌ [useJustificaciones] Error obteniendo motivos:', err);
      setError(err instanceof Error ? err.message : 'Error obteniendo motivos');
    }
  };

  // ✅ OBTENER JUSTIFICACIONES
  const obtenerJustificaciones = async (filtros?: FiltrosJustificaciones) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 [useJustificaciones] Obteniendo justificaciones...', filtros);

      // Construir query params
      const params = new URLSearchParams();
      if (filtros?.mes) params.append('mes', filtros.mes.toString());
      if (filtros?.anio) params.append('anio', filtros.anio.toString());
      if (filtros?.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros?.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      if (filtros?.es_justificada !== undefined) {
        params.append('es_justificada', filtros.es_justificada.toString());
      }

      const endpoint = `justificaciones${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiCall(endpoint);

      if (result.success && result.data) {
        setJustificaciones(result.data.justificaciones || []);
        setEstadisticas(result.data.estadisticas || null);
        console.log('✅ [useJustificaciones] Justificaciones obtenidas:', result.data.justificaciones.length);
      }
    } catch (err) {
      console.error('❌ [useJustificaciones] Error:', err);
      setError(err instanceof Error ? err.message : 'Error obteniendo justificaciones');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREAR JUSTIFICACIÓN
  const crearJustificacion = async (datos: {
    fecha_justificacion: string;
    motivo: string;
    descripcion?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 [useJustificaciones] Creando justificación...', datos);

      const result = await apiCall('justificaciones', {
        method: 'POST',
        body: JSON.stringify(datos),
      });

      if (result.success) {
        console.log('✅ [useJustificaciones] Justificación creada');
        // Recargar lista
        await obtenerJustificaciones();
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Error creando justificación');
      }
    } catch (err) {
      console.error('❌ [useJustificaciones] Error creando:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ✅ ELIMINAR JUSTIFICACIÓN
  const eliminarJustificacion = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 [useJustificaciones] Eliminando justificación:', id);

      const result = await apiCall(`justificaciones/${id}`, {
        method: 'DELETE',
      });

      if (result.success) {
        console.log('✅ [useJustificaciones] Justificación eliminada');
        // Recargar lista
        await obtenerJustificaciones();
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Error eliminando justificación');
      }
    } catch (err) {
      console.error('❌ [useJustificaciones] Error eliminando:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ✅ LIMPIAR ERROR
  const clearError = () => {
    setError(null);
  };

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    obtenerMotivos();
    obtenerJustificaciones();
  }, []);

  return {
    justificaciones,
    estadisticas,
    motivos,
    loading,
    error,
    obtenerJustificaciones,
    crearJustificacion,
    eliminarJustificacion,
    clearError,
  };
};