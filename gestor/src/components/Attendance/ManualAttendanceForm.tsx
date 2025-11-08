import React, { useState } from 'react';
import { Clock, MapPin, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface ManualAttendanceFormProps {
  onSubmit: (data: {
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    activityType: string;
    location?: string;
    notes?: string;
    justificationReason: string;
  }) => Promise<{ success: boolean }>;
}

const ManualAttendanceForm: React.FC<ManualAttendanceFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    activityType: 'teaching',
    location: '',
    notes: '',
    justificationReason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await onSubmit(formData);
      if (result.success) {
        setIsSuccess(true);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          checkInTime: '',
          checkOutTime: '',
          activityType: 'teaching',
          location: '',
          notes: '',
          justificationReason: ''
        });
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error al registrar asistencia manual:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            ¡Asistencia Manual Registrada!
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Su solicitud de registro manual ha sido enviada y está pendiente de aprobación por parte de la dirección.
          </p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Recibirá una notificación una vez que su solicitud sea revisada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Registro Manual de Asistencia</h3>
          <p className="text-sm text-slate-600">Solicitud excepcional de registro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hora entrada *
            </label>
            <input
              type="time"
              value={formData.checkInTime}
              onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hora salida
            </label>
            <input
              type="time"
              value={formData.checkOutTime}
              onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Actividad *
            </label>
            <select
              value={formData.activityType}
              onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              required
            >
              <option value="teaching">Docencia</option>
              <option value="research">Investigación</option>
              <option value="management">Gestión</option>
              <option value="other">Otra</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ubicación
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Sala 101, Lab Química"
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describa la actividad realizada"
              rows={2}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Justificación *
          </label>
          <div className="relative">
            <AlertTriangle className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <textarea
              value={formData.justificationReason}
              onChange={(e) => setFormData({ ...formData, justificationReason: e.target.value })}
              placeholder="Explique por qué no pudo usar el sistema QR normal"
              rows={3}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm resize-none"
              required
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Será revisada por la dirección del departamento
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 transform
              ${isSubmitting 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-amber-600 hover:bg-amber-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-transparent"></div>
                <span>Enviando solicitud...</span>
              </div>
            ) : (
              'Enviar Solicitud de Registro Manual'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualAttendanceForm;
