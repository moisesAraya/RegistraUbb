import { useState } from "react";
import { useAuth } from "../components/Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export const useReportes = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporteActual, setReporteActual] = useState<any | null>(null);

  /**
   * ✔ Solo genera reportes semanales o por rango
   * ✔ Rut opcional (solo admin)
   * ✔ `todos=true` para reporte general
   */
  const obtenerReporteSemanal = async (
    fecha_inicio: string,
    fecha_fin: string,
    rut?: string,
    todos?: boolean
  ) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      let url = `${API_URL}/reportes/semanal?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;

      if (rut) url += `&rut=${encodeURIComponent(rut)}`;
      if (todos) url += `&todos=true`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
        throw new Error(data.error || "Error obteniendo reporte semanal");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      console.error("Error obteniendo reporte semanal:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    reporteActual,

    // funciones
    obtenerReporteSemanal,

    // utils
    clearError: () => setError(null),
  };
};
