import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

interface ReportePersonal {
  periodo: {
    mes: number;
    anio: number;
    nombre_mes: string;
  };
  resumen_basico: {
    horasTotales: number;
    diasTrabajados: number;
    ausencias: number;
    promedioHorasDia: number;
  };
  asistencias_detalle: any[];
  justificaciones: any[];
  metricas_avanzadas: {
    promedio_horas_dia: number;
      puntualidad: {
      llegadas_tempranas: number;
      puntualidad_score: number;
    };
    consistencia: {
      dias_completos: number;
      dias_incompletos: number;
      consistencia_score: number;
    };
    justificaciones: {
      total: number;
      aprobadas: number;
      pendientes: number;
      rechazadas: number;
    };
  };
  graficos_data: {
    horas_por_fecha: Array<{ fecha: string; horas: number; dia_semana: string }>;
    horas_por_dia_semana: Array<{ dia: string; horas: number }>;
  };
  tendencias: {
    tendencia: 'mejorando' | 'empeorando' | 'estable' | 'insuficientes_datos';
    promedio_inicial: number;
    promedio_final: number;
    cambio_porcentual: number;
  };
  generated_at: string;
}

interface ReporteComparativo {
  periodo_analizado: string;
    reportes_semanales: Array<{
    semana: number;
    anio: number;
    nombre_semana: string;
    horas_totales: number;
    dias_trabajados: number;
    ausencias: number;
    justificaciones: number;
    porcentaje_asistencia: number;
  }>;
  tendencias_generales: {
    horas: string;
    dias: string;
    asistencia: string;
  };
  promedios: {
    horas: number;
    dias: number;
    asistencia: number;
  };
  generated_at: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export const useReportes = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reporteActual, setReporteActual] = useState<ReportePersonal | null>(null);
  const [reporteComparativo, setReporteComparativo] = useState<ReporteComparativo | null>(null);
  const [estadisticasAnuales, setEstadisticasAnuales] = useState<any | null>(null);

  const [rutSeleccionado, setRutSeleccionado] = useState<string | null>("");
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear());

  // ✅ OBTENER REPORTE SEMANAL O POR RANGO DE FECHAS
  const obtenerReporteSemanal = async (
    mes?: number, 
    anio?: number, 
    rut?: string, 
    todos?: boolean,
    fecha_inicio?: string,
    fecha_fin?: string
  ) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      let url = `${API_URL}/reportes/semanal?`;
      
      // Priorizar rango de fechas sobre mes/año
      if (fecha_inicio && fecha_fin) {
        url += `fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;
      } else if (mes && anio) {
        url += `mes=${mes}&anio=${anio}`;
      } else {
        throw new Error('Se requiere mes/año o rango de fechas');
      }
      
      if (rut) url += `&rut=${encodeURIComponent(rut)}`;
      if (todos) url += `&todos=true`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setReporteActual(data.data);
        return data.data;
      } else {
        // Si el backend indica que no hay horas/marcajes para el periodo,
        // tratamos eso como un reporte vacío en vez de propagar un error
        const msg = (data.error || '').toString().toLowerCase();
        if (msg.includes('no presenta') || msg.includes('no hay marcajes') || msg.includes('no hay datos') || msg.includes('sin registros')) {
          const emptyReport: any = {
            periodo: {
              mes: mes || null,
              anio: anio || null,
              nombre_mes: mes ? new Date((anio || new Date().getFullYear()), (mes - 1) || 0).toLocaleDateString('es-CL', { month: 'long' }) : 'Sin período'
            },
            resumen_basico: {
              horasTotales: 0,
              diasTrabajados: 0,
              ausencias: 0,
              promedioHorasDia: 0,
            },
            asistencias_detalle: [],
            justificaciones: [],
            metricas_avanzadas: {},
            graficos_data: { horas_por_fecha: [], horas_por_dia_semana: [] },
            tendencias: { tendencia: 'insuficientes_datos', promedio_inicial: 0, promedio_final: 0, cambio_porcentual: 0 },
            generated_at: new Date().toISOString(),
          };

          setReporteActual(emptyReport);
          return emptyReport;
        }

        throw new Error(data.error || 'Error obteniendo reporte semanal');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo reporte semanal:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ OBTENER REPORTE COMPARATIVO
  const obtenerReporteComparativo = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/reportes/comparativo`,
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
        setReporteComparativo(data.data);
        return data.data;
      } else {
        throw new Error(data.error || 'Error obteniendo reporte comparativo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo reporte comparativo:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ OBTENER ESTADÍSTICAS ANUALES
  const obtenerEstadisticasAnuales = async (anio?: number) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const url = anio 
        ? `${API_URL}/reportes/anual?anio=${anio}`
        : `${API_URL}/reportes/anual`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setEstadisticasAnuales(data.data);
        return data.data;
      } else {
        throw new Error(data.error || 'Error obteniendo estadísticas anuales');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error obteniendo estadísticas anuales:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CARGAR REPORTE ACTUAL AL INICIAR
  useEffect(() => {
    if (token) {
      const fechaActual = new Date();
      const mes = fechaActual.getMonth() + 1;
      const anio = fechaActual.getFullYear();
      
      obtenerReporteSemanal(mes, anio);
    }
  }, [token]);

  return {
    // Estados
    loading,
    error,
    reporteActual,
    reporteComparativo,
    estadisticasAnuales,
    rutSeleccionado,
    mesSeleccionado,
    anioSeleccionado,

    // Setters
    setRutSeleccionado,
    setMesSeleccionado,
    setAnioSeleccionado,

    // Funciones
    obtenerReporteSemanal,
    obtenerReporteComparativo,
    obtenerEstadisticasAnuales,

    // Utils
    clearError: () => setError(null),
    refresh: () => {
      const fechaActual = new Date();
      obtenerReporteSemanal(fechaActual.getMonth() + 1, fechaActual.getFullYear());
    }
  };
};