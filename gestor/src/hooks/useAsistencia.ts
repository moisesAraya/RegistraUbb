import { useState, useEffect } from 'react';

interface AsistenciaItem {
  fecha: string;
  horaIngreso: string | null;
  horaSalida: string | null;
  horasTrabajadas: number;
  estado: 'presente' | 'ausente' | 'tarde';
  observacion?: string;
  tipoMarcaje: string;
  ubicacion: string;
}

interface ResumenAsistencia {
  diasTrabajados: number;
  horasTotales: number;
  horasPromedio: number;
  ausentismos: number;
  llegadasTarde: number;
}

interface EstadisticasAsistencia {
  horasObjetivo: number;
  horasReales: number;
  porcentajeCumplimiento: number;
  tendenciaSemanal: Array<{
    semana: string;
    horas: number;
    dias: number;
  }>;
  diasMasProductivos: Array<{
    fecha: string;
    horas: number;
    horaIngreso: string;
  }>;
  promedioHoraIngreso: string;
}

interface AsistenciaData {
  asistencias: AsistenciaItem[];
  resumen: ResumenAsistencia;
  periodo: {
    mes: number;
    anio: number;
    fechaInicio: string;
    fechaFin: string;
  };
}

export const useAsistencia = () => {
  const [asistenciaData, setAsistenciaData] = useState<AsistenciaData | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAsistencia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const fetchAsistencia = async (mes?: number, anio?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes.toString());
      if (anio) params.append('anio', anio.toString());
      
      const endpoint = `asistencia${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await makeApiCall(endpoint);
      
      if (result.success) {
        setAsistenciaData(result.data);
      } else {
        throw new Error(result.error || 'Error obteniendo asistencia');
      }
    } catch (err) {
      console.error('❌ Error obteniendo asistencia:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await makeApiCall('asistencia/estadisticas');
      
      if (result.success) {
        setEstadisticas(result.data);
      } else {
        throw new Error(result.error || 'Error obteniendo estadísticas');
      }
    } catch (err) {
      console.error('❌ Error obteniendo estadísticas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const registrarMarcajeManual = async (data: {
    activityType: string;
    location?: string;
    notes?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await makeApiCall('asistencia/marcaje-manual', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (result.success) {
        // Refrescar datos después del marcaje
        await fetchAsistencia();
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Error registrando marcaje');
      }
    } catch (err) {
      console.error('❌ Error registrando marcaje:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const solicitarJustificacion = async (data: {
    fecha: string;
    motivo: string;
    descripcion: string;
    tipo?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await makeApiCall('asistencia/justificacion', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error || 'Error enviando justificación');
      }
    } catch (err) {
      console.error('❌ Error enviando justificación:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el hook
  useEffect(() => {
    fetchAsistencia();
    fetchEstadisticas();
  }, []);

  return {
    asistenciaData,
    estadisticas,
    isLoading,
    error,
    fetchAsistencia,
    fetchEstadisticas,
    registrarMarcajeManual,
    solicitarJustificacion,
    refetch: () => {
      fetchAsistencia();
      fetchEstadisticas();
    }
  };
};