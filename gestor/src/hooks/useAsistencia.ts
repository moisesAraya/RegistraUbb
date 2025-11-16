import { useState, useEffect } from 'react';

interface AsistenciaItem {
  fecha: string;
  horaIngreso: string | null;
  horaSalida: string | null;
  horasTrabajadas: number;
  estado: 'presente' | 'ausente' | 'falta';
  observacion?: string;
  tipoMarcaje: string;
  ubicacion: string;
}

interface ResumenAsistencia {
  diasTrabajados: number;
  horasTotales: number;
  horasPromedio: number;
  faltas: number;
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
  
  console.log('🔧 useAsistencia - Hook inicializado, API URL:', API_BASE_URL);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) {
      console.log('❌ useAsistencia - No hay token de autenticación');
      throw new Error('No hay token de autenticación');
    }

    console.log('🔑 useAsistencia - Token encontrado:', token ? '✅' : '❌');

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    console.log('📡 useAsistencia - Respuesta HTTP:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ useAsistencia - Error HTTP response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📄 useAsistencia - Datos JSON recibidos:', data);
    return data;
  };

  const fetchAsistencia = async (mes?: number, anio?: number) => {
    console.log('🔄 useAsistencia - fetchAsistencia iniciado:', { mes, anio });
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes.toString());
      if (anio) params.append('anio', anio.toString());
      
      const endpoint = `asistencia${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 useAsistencia - Llamando endpoint:', `${API_BASE_URL}/${endpoint}`);
      
      const result = await makeApiCall(endpoint);
      console.log('📥 useAsistencia - Respuesta recibida:', result);
      
      if (result.success) {
        console.log('✅ useAsistencia - Datos de asistencia establecidos:', result.data);
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

  const fetchEstadisticas = async (mes?: number, anio?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes.toString());
      if (anio) params.append('anio', anio.toString());

      const endpoint = `asistencia/estadisticas${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await makeApiCall(endpoint);

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
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    location?: string;
    notes?: string;
    activityType?: string;
    id_totem?: number | null;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // El backend espera estos nombres:
      const body = {
        date: data.date,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime || null,
        location: data.location || null,
        notes: data.notes || null,
        activityType: data.activityType || null,
        id_totem: data.id_totem || null,
      };

      console.log("📤 Datos enviados al backend:", body);

      const result = await makeApiCall('asistencia/manual', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (result.success) {
        await fetchAsistencia();
        return { success: true, message: result.message || 'Ingreso registrado' };
      } else {
        throw new Error(result.error || 'Error registrando ingreso manual');
      }
    } catch (err) {
      console.error('❌ Error registrando marcaje manual:', err);
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

  // Cargar datos al montar el hook (mes y año actuales)
  useEffect(() => {
    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();

    fetchAsistencia(mesActual, anioActual);
    fetchEstadisticas(mesActual, anioActual);
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