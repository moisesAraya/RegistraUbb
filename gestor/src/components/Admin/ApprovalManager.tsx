import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../Context/AuthContext'; // ⭐ Importar useAuth

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PendingApproval {
  id: string;
  type: 'justification' | 'manual_attendance';
  userId: string;
  userName: string;
  date: string;
  submittedAt: string;
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

const ApprovalManager: React.FC = () => {
  const { token } = useAuth(); // ⭐ Obtener token del contexto
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ Headers con autenticación usando token del contexto
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Obtener aprobaciones pendientes
  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/approvals/pending`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<PendingApproval[]> = await response.json();
      
      if (data.success) {
        setPendingApprovals(data.data);
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
  const handleApprove = async (approvalId: string) => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reviewNotes })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      
      if (data.success) {
        setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
        setSelectedApproval(null);
        setReviewNotes('');
        alert('Solicitud aprobada exitosamente');
      } else {
        setError(data.message || 'Error al aprobar la solicitud');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      console.error('Error approving request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar solicitud
  const handleReject = async (approvalId: string) => {
    if (!reviewNotes.trim()) {
      setError('Las observaciones son obligatorias para rechazar una solicitud');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reviewNotes })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      
      if (data.success) {
        setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
        setSelectedApproval(null);
        setReviewNotes('');
        alert('Solicitud rechazada exitosamente');
      } else {
        setError(data.message || 'Error al rechazar la solicitud');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      console.error('Error rejecting request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingApprovals();
    }
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Aprobaciones Pendientes</h1>
            <p className="text-slate-600 mt-1">
              Gestiona las solicitudes de justificaciones pendientes de aprobación
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-semibold">
              <Clock className="w-5 h-5 inline mr-2" />
              {pendingApprovals.length} pendientes
            </div>
            <button
              onClick={fetchPendingApprovals}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando solicitudes pendientes...</p>
        </div>
      ) : pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No hay solicitudes pendientes
          </h3>
          <p className="text-slate-600">
            Todas las solicitudes han sido procesadas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de aprobaciones */}
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedApproval?.id === approval.id
                    ? 'border-blue-500 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedApproval(approval)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{approval.userName}</h3>
                      <p className="text-sm text-slate-500">{approval.userId}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                    {approval.type === 'justification' ? 'Justificación' : 'Marcaje Manual'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Fecha: {formatDate(approval.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Enviado: {formatDateTime(approval.submittedAt)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span className="line-clamp-2">{approval.reason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel de detalles y acciones */}
          {selectedApproval && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6 h-fit">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Detalles de la Solicitud
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-slate-700">Usuario</label>
                  <p className="text-slate-900">{selectedApproval.userName}</p>
                  <p className="text-sm text-slate-500">{selectedApproval.userId}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Fecha</label>
                  <p className="text-slate-900">{formatDate(selectedApproval.date)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Enviado</label>
                  <p className="text-slate-900">{formatDateTime(selectedApproval.submittedAt)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Motivo</label>
                  <p className="text-slate-900">{selectedApproval.reason}</p>
                </div>

                {selectedApproval.details && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                      Detalles Adicionales
                    </label>
                    {selectedApproval.details.checkInTime && (
                      <p className="text-sm text-slate-600">
                        Entrada: {selectedApproval.details.checkInTime}
                      </p>
                    )}
                    {selectedApproval.details.checkOutTime && (
                      <p className="text-sm text-slate-600">
                        Salida: {selectedApproval.details.checkOutTime}
                      </p>
                    )}
                    {selectedApproval.details.location && (
                      <p className="text-sm text-slate-600">
                        Ubicación: {selectedApproval.details.location}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Observaciones del Administrador
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Añade observaciones sobre esta solicitud..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedApproval.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  {actionLoading ? 'Procesando...' : 'Aprobar'}
                </button>
                <button
                  onClick={() => handleReject(selectedApproval.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  {actionLoading ? 'Procesando...' : 'Rechazar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalManager;