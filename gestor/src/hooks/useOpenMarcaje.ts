import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

interface OpenMarcaje {
  id_marcaje: number;
  fecha: string;
  hora_ingreso: string;
  hora_salida: null;
  horas_trabajadas: null;
  tipo_marcaje: 'ingreso';
}

interface UseOpenMarcajeResult {
  openMarcaje: OpenMarcaje | null;
  isLoading: boolean;
  error: string | null;
  checkForOpenMarcaje: () => Promise<void>;
}

/**
 * Hook para detectar si el usuario tiene un marcaje abierto (sin cerrar)
 */
export function useOpenMarcaje(): UseOpenMarcajeResult {
  const { user } = useAuth();
  const [openMarcaje, setOpenMarcaje] = useState<OpenMarcaje | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForOpenMarcaje = async () => {
    if (!user?.rut_usuario) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${baseURL}/asistencia/marcaje-abierto/${user.rut_usuario}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.marcaje_abierto) {
          setOpenMarcaje(data.marcaje_abierto);
          console.log('🔓 Marcaje abierto detectado:', data.marcaje_abierto);
        } else {
          setOpenMarcaje(null);
          console.log('✅ No hay marcajes abiertos');
        }
      } else {
        console.error('Error verificando marcaje abierto:', response.status);
        setError('Error verificando estado del marcaje');
      }
    } catch (err) {
      console.error('Error en la petición:', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Verificar inmediatamente al cargar
    checkForOpenMarcaje();

    // Verificar cada 30 segundos
    const interval = setInterval(checkForOpenMarcaje, 30000);

    return () => clearInterval(interval);
  }, [user?.rut_usuario]);

  return {
    openMarcaje,
    isLoading,
    error,
    checkForOpenMarcaje
  };
}