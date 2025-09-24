import React, { useState } from 'react';
import { Clock, MapPin, FileText, CheckCircle } from 'lucide-react';

interface AttendanceFormProps {
  onSubmit: (data: {
    activityType: string;
    location?: string;
    notes?: string;
  }) => Promise<{ success: boolean }>;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    activityType: 'teaching',
    location: '',
    notes: ''
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
        setFormData({ activityType: 'teaching', location: '', notes: '' });
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¡Asistencia Registrada!
          </h3>
          <p className="text-gray-600">
            Tu asistencia ha sido registrada exitosamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Registrar Asistencia
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Actividad
          </label>
          <select
            value={formData.activityType}
            onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="teaching">Docencia</option>
            <option value="research">Investigación</option>
            <option value="management">Gestión</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación (Opcional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Sala 101, Laboratorio A, etc."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas (Opcional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Descripción de la actividad..."
              rows={3}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Asistencia'}
        </button>
      </form>
    </div>
  );
};

export default AttendanceForm;