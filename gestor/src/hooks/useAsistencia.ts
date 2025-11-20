// hooks/useAsistencia.ts
import { useState, useEffect } from 'react';

interface JustificacionItem {
  motivo: string;
  descripcion: string | null;
  es_justificada: boolean;
  horas_compensadas: number;
}

interface AsistenciaItem {
  id_marcaje?: number;              // 👈 necesario para editar/borrar
  fecha: string;
  horaIngreso: string | null;
  horaSalida: string | null;
  horasTrabajadas: number;
  estado: 'presente' | 'ausente' | 'falta' | 'justificada' | 'no_justificada';
  observacion?: string | null;
  tipoMarcaje: string;
  ubicacion: string;
  colacion?: boolean;
  justificacion?: JustificacionItem | null;
  es_manual?: boolean;             // 👈 flag para saber si es marcaje manual
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
  // opcionalmente: justificaciones / faltas
  [key: string]: any;
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

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ useAsistencia - Error HTTP response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
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
    registroTipo?: 'entrada_manana' | 'salida_almuerzo' | 'entrada_tarde' | 'salida_dia';
    justificationReason?: string;
    id_totem?: number | null;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const body = {
        date: data.date,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime || null,
        location: data.location || null,
        notes: data.notes || null,
        activityType: data.activityType || null,
        id_totem: data.id_totem || null,
        registroTipo: data.registroTipo || 'entrada_manana',
        justificationReason: data.justificationReason || ''
      };

      console.log("📤 Datos enviados al backend (manual):", body);

      const result = await makeApiCall('asistencia/manual', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (result.success) {
        // Refrescar con el mismo mes / año actual del estado si existe
        if (asistenciaData?.periodo) {
          await fetchAsistencia(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
          await fetchEstadisticas(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
        } else {
          await fetchAsistencia();
          await fetchEstadisticas();
        }
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

  // ✏️ ACTUALIZAR MARCAJE MANUAL
  const updateMarcajeManual = async (
    id_marcaje: number,
    data: {
      date: string;
      checkInTime: string;
      checkOutTime?: string;
      location?: string;
      notes?: string;
      activityType?: string;
      registroTipo?: string;
      justificationReason?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const body = {
        date: data.date,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime || null,
        location: data.location || null,
        notes: data.notes || null,
        activityType: data.activityType || 'other',
        registroTipo: data.registroTipo || 'entrada_otro',
        justificationReason: data.justificationReason || null
      };

      console.log("✏️ [useAsistencia] Actualizando marcaje manual:", { id_marcaje, body });

      const result = await makeApiCall(`asistencia/manual/${id_marcaje}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (result.success) {
        if (asistenciaData?.periodo) {
          await fetchAsistencia(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
          await fetchEstadisticas(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
        } else {
          await fetchAsistencia();
          await fetchEstadisticas();
        }
        return { success: true, message: result.message || 'Marcaje actualizado' };
      } else {
        throw new Error(result.error || 'Error actualizando marcaje manual');
      }
    } catch (err) {
      console.error('❌ Error actualizando marcaje manual:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ ELIMINAR MARCAJE MANUAL
  const deleteMarcajeManual = async (id_marcaje: number) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🗑 [useAsistencia] Eliminando marcaje manual:", id_marcaje);

      const result = await makeApiCall(`asistencia/manual/${id_marcaje}`, {
        method: 'DELETE',
      });

      if (result.success) {
        if (asistenciaData?.periodo) {
          await fetchAsistencia(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
          await fetchEstadisticas(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
        } else {
          await fetchAsistencia();
          await fetchEstadisticas();
        }
        return { success: true, message: result.message || 'Marcaje eliminado' };
      } else {
        throw new Error(result.error || 'Error eliminando marcaje manual');
      }
    } catch (err) {
      console.error('❌ Error eliminando marcaje manual:', err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    updateMarcajeManual,
    deleteMarcajeManual,
    refetch: () => {
      if (asistenciaData?.periodo) {
        fetchAsistencia(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
        fetchEstadisticas(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
      } else {
        fetchAsistencia();
        fetchEstadisticas();
      }
    }
  };
};
