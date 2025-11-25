import React, { createContext, useContext, useState, ReactNode } from 'react';

interface JustificacionItem {
  motivo: string;
  descripcion: string | null;
  es_justificada: boolean;
  horas_compensadas: number;
}

interface AsistenciaItem {
  id_marcaje?: number;
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
  es_manual?: boolean;
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
  [key: string]: any;
}

interface AsistenciaContextType {
  asistenciaData: AsistenciaData | null;
  estadisticas: EstadisticasAsistencia | null;
  isLoading: boolean;
  error: string | null;
  fetchAsistencia: (mes?: number, anio?: number) => Promise<void>;
  fetchEstadisticas: (mes?: number, anio?: number) => Promise<void>;
  registrarMarcajeManual: (data: any) => Promise<{ success: boolean; message?: string }>;
  editarMarcaje: (data: any) => Promise<{ success: boolean; message?: string }>;
  eliminarMarcaje: (id: number) => Promise<{ success: boolean; message?: string }>;
  isSemanaCerrada: (fechaInicio: string, fechaFin: string) => Promise<boolean>;
}

const AsistenciaContext = createContext<AsistenciaContextType | undefined>(undefined);

export const AsistenciaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [asistenciaData, setAsistenciaData] = useState<AsistenciaData | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAsistencia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const getAuthToken = () => localStorage.getItem('token');

  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) throw new Error('No hay token de autenticación');

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(text);
        if (parsed?.error || parsed?.message) {
          errorMessage = parsed.error || parsed.message;
        }
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage);
    }

    return await response.json();
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

  const registrarMarcajeManual = async (data: any) => {
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

      const result = await makeApiCall('asistencia/manual', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (result.success) {
        if (asistenciaData?.periodo) {
          await fetchAsistencia(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
        } else {
          await fetchAsistencia();
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

  const editarMarcaje = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const body = {
        date: data.date,
        campo: data.campo,       // 'entrada' | 'salida'
        time: data.time,         // 'HH:MM'
        notes: data.notes || null,
      };

      const result = await makeApiCall(`asistencia/manual/${data.id_marcaje}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      if (result.success) {
        if (asistenciaData?.periodo) {
          await fetchAsistencia(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
        } else {
          await fetchAsistencia();
        }
        return { success: true, message: result.message || 'Marcaje actualizado' };
      }
      throw new Error(result.error);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error editando marcaje:', err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const eliminarMarcaje = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await makeApiCall(`asistencia/manual/${id}`, {
        method: 'DELETE',
      });

      if (result.success) {
        if (asistenciaData?.periodo) {
          await fetchAsistencia(asistenciaData.periodo.mes, asistenciaData.periodo.anio);
        }
        return { success: true, message: result.message };
      }
      throw new Error(result.error);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 NUEVO: consulta al backend si una semana está cerrada (reporte generado)
  const isSemanaCerrada = async (fechaInicio: string, fechaFin: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams();
      params.append('fecha_inicio', fechaInicio);
      params.append('fecha_fin', fechaFin);

      const endpoint = `asistencia/estado-semana?${params.toString()}`;
      const result = await makeApiCall(endpoint);

      // Esperamos algo como { success: true, data: { cerrada: true/false } }
      if (result?.data && typeof result.data.cerrada !== 'undefined') {
        return !!result.data.cerrada;
      }

      if (typeof result.cerrada !== 'undefined') {
        return !!result.cerrada;
      }

      return false;
    } catch (err) {
      console.error('❌ Error consultando estado de semana:', err);
      // Ante error NO bloqueamos, pero lo dejamos registrado
      return false;
    }
  };

  return (
    <AsistenciaContext.Provider
      value={{
        asistenciaData,
        estadisticas,
        isLoading,
        error,
        fetchAsistencia,
        fetchEstadisticas,
        registrarMarcajeManual,
        editarMarcaje,
        eliminarMarcaje,
        isSemanaCerrada,
      }}
    >
      {children}
    </AsistenciaContext.Provider>
  );
};

export const useAsistenciaContext = () => {
  const context = useContext(AsistenciaContext);
  if (context === undefined) {
    throw new Error('useAsistenciaContext debe usarse dentro de un AsistenciaProvider');
  }
  return context;
};
