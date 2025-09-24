import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, FileText, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';


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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ApprovalManager: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Obtener token del localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  // Configurar axios con interceptores para manejo de autenticación
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para agregar token a las requests
  apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Obtener aprobaciones pendientes
  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/api/approvals/pending');
      
      if (response.data.success) {
        // Convertir strings de fecha a objetos Date si es necesario
        const approvalsWithDates = response.data.data.map((approval: any) => ({
          ...approval,
          date: new Date(approval.date),
          submittedAt: new Date(approval.submittedAt)
        }));
        
        setPendingApprovals(approvalsWithDates);
      } else {
        setError(response.data.message || 'Error al cargar las aprobaciones');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      console.error('Error fetching pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Aprobar solicitud
  const approveRequest = async (approvalId: string, reviewNotes: string = '') => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(`/api/approvals/${approvalId}/approve`, {
        reviewNotes
      });

      if (response.data.success) {
        // Remover la aprobación de la lista local
        setPendingApprovals(prev => 
          prev.filter(approval => approval.id !== approvalId)
        );
        return { success: true, message: response.data.message };
      } else {
        setError(response.data.message || 'Error al aprobar la solicitud');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar solicitud
  const rejectRequest = async (approvalId: string, reviewNotes: string) => {
    if (!reviewNotes.trim()) {
      setError('Las observaciones son obligatorias para rechazar una solicitud');
      return { success: false, message: 'Las observaciones son obligatorias' };
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post(`/api/approvals/${approvalId}/reject`, {
        reviewNotes
      });

      if (response.data.success) {
        // Remover la aprobación de la lista local
        setPendingApprovals(prev => 
          prev.filter(approval => approval.id !== approvalId)
        );
        return { success: true, message: response.data.message };
      } else {
        setError(response.data.message || 'Error al rechazar la solicitud');
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setActionLoading(false);
    }
  };

  // Función para refrescar datos
  const refetch = fetchPendingApprovals;

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'justification': return 'Justificación';
      case 'manual_attendance': return 'Registro Manual';
      default: return type;
    }
  };

  const getActivityTypeLabel = (type?: string) => {
    if (!type) return '';
    switch (type) {
      case 'teaching': return 'Docencia';
      case 'research': return 'Investigación';
      case 'management': return 'Gestión';
      default: return 'Otro';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleApprove = async (approvalId: string) => {
    setActionLoading(true);
    try {
      const result = await approveRequest(approvalId, reviewNotes);
      if (result.success) {
        setSelectedApproval(null);
        setReviewNotes('');
        // Mostrar mensaje de éxito
        alert('Solicitud aprobada exitosamente');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      alert('Error al procesar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!reviewNotes.trim()) {
      alert('Debe proporcionar una razón para el rechazo');
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await rejectRequest(approvalId, reviewNotes);
      if (result.success) {
        setSelectedApproval(null);
        setReviewNotes('');
        // Mostrar mensaje de éxito
        alert('Solicitud rechazada exitosamente');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      alert('Error al procesar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Aprobaciones Pendientes
            </h3>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Revise cuidadosamente cada solicitud antes de aprobar o rechazar. 
            Las decisiones quedarán registradas en el historial del usuario.
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Total Pendientes</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingApprovals.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Justificaciones</p>
              <p className="text-2xl font-bold text-blue-900">
                {pendingApprovals.filter((a: PendingApproval) => a.type === 'justification').length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Registros Manuales</p>
              <p className="text-2xl font-bold text-purple-900">
                {pendingApprovals.filter((a: PendingApproval) => a.type === 'manual_attendance').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Lista de aprobaciones pendientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Solicitudes Pendientes ({pendingApprovals.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {pendingApprovals.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p>No hay aprobaciones pendientes.</p>
              <p className="text-sm">¡Excelente trabajo manteniendo todo al día!</p>
            </div>
          ) : (
            pendingApprovals.map((approval: PendingApproval) => (
              <div key={approval.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {approval.userName}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        approval.type === 'justification' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {getTypeLabel(approval.type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(approval.date)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Motivo:</strong> {approval.reason}
                    </p>
                    
                    {approval.details && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Detalles del Registro:</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>Entrada: {approval.details.checkInTime}</div>
                          <div>Salida: {approval.details.checkOutTime || 'No registrada'}</div>
                          <div>Actividad: {getActivityTypeLabel(approval.details.activityType)}</div>
                          <div>Ubicación: {approval.details.location || 'No especificada'}</div>
                        </div>
                        {approval.details.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Notas:</strong> {approval.details.notes}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Enviada: {formatDateTime(approval.submittedAt)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedApproval(approval)}
                      disabled={loading || actionLoading}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Revisar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de revisión */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Revisar {getTypeLabel(selectedApproval.type)}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Usuario:</strong> {selectedApproval.userName}
                </div>
                <div>
                  <strong>Fecha:</strong> {formatDate(selectedApproval.date)}
                </div>
                <div>
                  <strong>Tipo:</strong> {getTypeLabel(selectedApproval.type)}
                </div>
                <div>
                  <strong>Enviada:</strong> {formatDateTime(selectedApproval.submittedAt)}
                </div>
              </div>
              
              <div>
                <strong>Motivo:</strong>
                <p className="mt-1 text-gray-700">{selectedApproval.reason}</p>
              </div>
              
              {selectedApproval.details && (
                <div>
                  <strong>Detalles del Registro:</strong>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Entrada: {selectedApproval.details.checkInTime}</div>
                      <div>Salida: {selectedApproval.details.checkOutTime || 'No registrada'}</div>
                      <div>Actividad: {getActivityTypeLabel(selectedApproval.details.activityType)}</div>
                      <div>Ubicación: {selectedApproval.details.location || 'No especificada'}</div>
                    </div>
                    {selectedApproval.details.notes && (
                      <div className="mt-2 text-sm">
                        <strong>Notas:</strong> {selectedApproval.details.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones de la Revisión
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Agregue sus observaciones sobre esta solicitud..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setReviewNotes('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(selectedApproval.id)}
                disabled={actionLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{actionLoading ? 'Procesando...' : 'Rechazar'}</span>
              </button>
              <button
                onClick={() => handleApprove(selectedApproval.id)}
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{actionLoading ? 'Procesando...' : 'Aprobar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalManager;