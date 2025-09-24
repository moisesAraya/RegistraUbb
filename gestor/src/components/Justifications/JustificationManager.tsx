import React, { useState } from 'react';
import { FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';

interface Justification {
  id: string;
  date: Date;
  type: 'absence' | 'late' | 'manual_entry';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

const JustificationManager: React.FC = () => {
  const [justifications, setJustifications] = useState<Justification[]>([
    {
      id: '1',
      date: new Date(2024, 0, 18),
      type: 'late',
      reason: 'Problema de transporte público - metro con retraso',
      status: 'approved',
      submittedAt: new Date(2024, 0, 18, 10, 30),
      reviewedBy: 'Dr. Juan Pérez',
      reviewedAt: new Date(2024, 0, 18, 14, 15),
      reviewNotes: 'Justificación válida, problema conocido del transporte'
    },
    {
      id: '2',
      date: new Date(2024, 0, 22),
      type: 'manual_entry',
      reason: 'Falla en el lector de código QR del edificio',
      status: 'pending',
      submittedAt: new Date(2024, 0, 22, 9, 45)
    },
    {
      id: '3',
      date: new Date(2024, 0, 15),
      type: 'absence',
      reason: 'Cita médica de emergencia',
      status: 'rejected',
      submittedAt: new Date(2024, 0, 15, 16, 20),
      reviewedBy: 'Dr. Juan Pérez',
      reviewedAt: new Date(2024, 0, 16, 9, 30),
      reviewNotes: 'Falta documentación médica de respaldo'
    }
  ]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newJustification, setNewJustification] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'absence' as const,
    reason: ''
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'absence': return 'Ausencia';
      case 'late': return 'Llegada Tardía';
      case 'manual_entry': return 'Registro Manual';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
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

  const handleSubmitJustification = (e: React.FormEvent) => {
    e.preventDefault();
    
    const justification: Justification = {
      id: Date.now().toString(),
      date: new Date(newJustification.date),
      type: newJustification.type,
      reason: newJustification.reason,
      status: 'pending',
      submittedAt: new Date()
    };

    setJustifications(prev => [justification, ...prev]);
    setNewJustification({
      date: new Date().toISOString().split('T')[0],
      type: 'absence',
      reason: ''
    });
    setShowNewForm(false);
  };

  const pendingCount = justifications.filter(j => j.status === 'pending').length;
  const approvedCount = justifications.filter(j => j.status === 'approved').length;
  const rejectedCount = justifications.filter(j => j.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Mis Justificaciones
            </h3>
          </div>
          
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Justificación</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Aprobadas</p>
                <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Rechazadas</p>
                <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Formulario nueva justificación */}
      {showNewForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Nueva Justificación</h4>
          
          <form onSubmit={handleSubmitJustification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={newJustification.date}
                  onChange={(e) => setNewJustification({ ...newJustification, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={newJustification.type}
                  onChange={(e) => setNewJustification({ ...newJustification, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="absence">Ausencia</option>
                  <option value="late">Llegada Tardía</option>
                  <option value="manual_entry">Registro Manual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de la Justificación *
              </label>
              <textarea
                value={newJustification.reason}
                onChange={(e) => setNewJustification({ ...newJustification, reason: e.target.value })}
                placeholder="Explique detalladamente el motivo de su justificación..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enviar Justificación
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de justificaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Justificaciones
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {justifications.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No tienes justificaciones registradas.
            </div>
          ) : (
            justifications.map((justification) => (
              <div key={justification.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(justification.date)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getTypeLabel(justification.type)}
                      </span>
                      {getStatusBadge(justification.status)}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Motivo:</strong> {justification.reason}
                    </p>
                    
                    <div className="text-xs text-gray-500">
                      Enviada: {formatDateTime(justification.submittedAt)}
                    </div>
                    
                    {justification.reviewedAt && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <div className="text-xs text-gray-500 mb-1">
                          Revisada por {justification.reviewedBy} el {formatDateTime(justification.reviewedAt)}
                        </div>
                        {justification.reviewNotes && (
                          <p className="text-sm text-gray-700">
                            <strong>Observaciones:</strong> {justification.reviewNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JustificationManager;