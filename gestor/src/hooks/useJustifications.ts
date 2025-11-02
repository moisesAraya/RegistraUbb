import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

interface Justificacion {
  id_justificacion: number;
  rut_usuario: string;
  fecha_justificacion: string;
  motivo: string;
  descripcion: string;
  tipo_justificacion: string;
  estado_aprobacion: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  fecha_solicitud: string;
  fecha_respuesta?: string;
  rut_aprobador?: string;
  observaciones_aprobador?: string;
  documento_adjunto?: string;
}

interface EstadisticasJustificaciones {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
}

interface MotivoJustificacion {
  id: string;
  label: string;
  requiere_documento: boolean;
}

interface FiltrosJustificaciones {
  estado?: string;
  mes?: number;
  anio?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
}

const API_URL = import.meta.env.VITE_API_URL;

export const useJustificaciones = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [justificaciones, setJustificaciones] = useState<Justificacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasJustificaciones | null>(null);
  const [motivos, setMotivos] = useState<MotivoJustificacion[]>([]);

  // ✅ OBTENER JUSTIFICACIONES
  const obtenerJustificaciones = async (filtros: FiltrosJustificaciones = {}) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.mes) params.append('mes', filtros.mes.toString());
      if (filtros.anio) params.append('anio', filtros.anio.toString());
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      if (filtros.limit) params.append('limit', filtros.limit.toString());

      const response = await fetch(
        `${API_URL}/justificaciones?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setJustificaciones(data.data.justificaciones);
        setEstadisticas(data.data.estadisticas);
        return data.data;
      } else {
        throw new Error(data.error || 'Error obteniendo justificaciones');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo justificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREAR JUSTIFICACIÓN
  const crearJustificacion = async (datosJustificacion: Partial<Justificacion>) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/justificaciones`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datosJustificacion),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Actualizar lista
        await obtenerJustificaciones();
        return data.data;
      } else {
        throw new Error(data.error || 'Error creando justificación');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error creando justificación:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACTUALIZAR JUSTIFICACIÓN
  const actualizarJustificacion = async (id: number, datos: Partial<Justificacion>) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/justificaciones/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datos),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Actualizar lista
        await obtenerJustificaciones();
        return data.data;
      } else {
        throw new Error(data.error || 'Error actualizando justificación');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error actualizando justificación:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ CANCELAR JUSTIFICACIÓN
  const cancelarJustificacion = async (id: number) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/justificaciones/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Actualizar lista
        await obtenerJustificaciones();
        return data.data;
      } else {
        throw new Error(data.error || 'Error cancelando justificación');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error cancelando justificación:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ OBTENER MOTIVOS
  const obtenerMotivos = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/justificaciones/motivos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMotivos(data.data);
        return data.data;
      } else {
        throw new Error(data.error || 'Error obteniendo motivos');
      }
    } catch (err) {
      console.error('Error obteniendo motivos:', err);
    }
  };

  // ✅ CARGAR DATOS INICIALES
  useEffect(() => {
    if (token) {
      obtenerJustificaciones();
      obtenerMotivos();
    }
  }, [token]);

  return {
    // Estados
    loading,
    error,
    justificaciones,
    estadisticas,
    motivos,

    // Funciones
    obtenerJustificaciones,
    crearJustificacion,
    actualizarJustificacion,
    cancelarJustificacion,
    obtenerMotivos,

    // Utils
    clearError: () => setError(null),
    refresh: () => obtenerJustificaciones()
  };
};