import { useState } from 'react';

interface AddExitParams {
  id_marcaje: number;
  hora_salida: string;
  fecha: string;
}

interface UseAddExitResult {
  isLoading: boolean;
  error: string | null;
  addExit: (params: AddExitParams) => Promise<boolean>;
}

/**
 * Hook para agregar salida a un marcaje pendiente
 */
export function useAddExit(): UseAddExitResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExit = async (params: AddExitParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${baseURL}/asistencia/agregar-salida`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_marcaje: params.id_marcaje,
          hora_salida: params.hora_salida,
          fecha: params.fecha
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return true;
        } else {
          setError(data.message || 'Error agregando salida');
          return false;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Error en la petición');
        return false;
      }
    } catch (err) {
      console.error('Error agregando salida:', err);
      setError('Error de conexión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    addExit
  };
}