import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL; // Ajusta según tu configuración

interface PendingApproval {
  id: string;
  type: 'justification' | 'manual_attendance';
  userId: string;
  userName: string;
  date: Date;
  submittedAt: Date;
  reason: string;
  details?: {
    checkInTime?: string;
    checkOutTime?: string;
    activityType?: string;
    location?: string;
    notes?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const useApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener token del localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Headers con autenticación
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Obtener aprobaciones pendientes
  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/approvals/pending`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<PendingApproval[]> = await response.json();
      
      if (data.success) {
        // Convertir strings de fecha a objetos Date
        const approvalsWithDates = data.data.map(approval => ({
          ...approval,
          date: new Date(approval.date),
          submittedAt: new Date(approval.submittedAt)
        }));
        
        setPendingApprovals(approvalsWithDates);
      } else {
        setError(data.message || 'Error al cargar las aprobaciones');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      console.error('Error fetching pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Aprobar solicitud
  const approveRequest = async (approvalId: string, reviewNotes: string = '') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reviewNotes })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      
      if (data.success) {
        // Remover la aprobación de la lista local
        setPendingApprovals(prev => 
          prev.filter(approval => approval.id !== approvalId)
        );
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Error al aprobar la solicitud');
        return { success: false, message: data.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Rechazar solicitud
  const rejectRequest = async (approvalId: string, reviewNotes: string) => {
    if (!reviewNotes.trim()) {
      setError('Las observaciones son obligatorias para rechazar una solicitud');
      return { success: false, message: 'Las observaciones son obligatorias' };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reviewNotes })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      
      if (data.success) {
        // Remover la aprobación de la lista local
        setPendingApprovals(prev => 
          prev.filter(approval => approval.id !== approvalId)
        );
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Error al rechazar la solicitud');
        return { success: false, message: data.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  return {
    pendingApprovals,
    loading,
    error,
    fetchPendingApprovals,
    approveRequest,
    rejectRequest,
    refetch: fetchPendingApprovals
  };
};