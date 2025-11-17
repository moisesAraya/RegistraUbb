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
    activityType: 'Docencia',
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
        setFormData({ activityType: 'Docencia', location: '', notes: '' });
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityDescription = (type: string) => {
    const descriptions = {
      Docencia: 'Actividades de docencia como clases, tutorías, evaluaciones',
      research: 'Proyectos de investigación, estudios, publicaciones',
      management: 'Tareas administrativas, reuniones, gestión',
      other: 'Otras actividades académicas o profesionales'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            ¡Asistencia Registrada Exitosamente!
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Su asistencia ha sido registrada correctamente en el sistema.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Hora de registro:</strong> {new Date().toLocaleString('es-CL')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Registro de Asistencia</h3>
          <p className="text-sm text-slate-600">Complete la información de su actividad</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Registro automático</p>
            <p className="text-sm text-blue-800">
              La fecha y hora serán registradas automáticamente al enviar el formulario.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tipo de actividad *
          </label>
          <select
            value={formData.activityType}
            onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white transition-colors"
            required
          >
            <option value="Docencia">Docencia</option>
            <option value="research">Investigación</option>
            <option value="management">Gestión Administrativa</option>
            <option value="other">Otra actividad</option>
          </select>
          <p className="mt-2 text-xs text-slate-500">
            {getActivityDescription(formData.activityType)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Ubicación (opcional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Sala 101, Laboratorio de Física, Biblioteca"
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white transition-colors"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Especifique el lugar donde realizará la actividad
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Descripción de la actividad (opcional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describa brevemente la actividad que va a realizar..."
              rows={4}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white transition-colors resize-none"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Información adicional sobre su actividad (opcional pero recomendado)
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
                : 'bg-slate-700 hover:bg-slate-800 text-white hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-transparent"></div>
                <span>Registrando asistencia...</span>
              </div>
            ) : (
              'Registrar Mi Asistencia'
            )}
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Información del registro:</h4>
          <div className="space-y-1 text-xs text-slate-600">
            <p>• <strong>Fecha:</strong> {new Date().toLocaleDateString('es-CL')}</p>
            <p>• <strong>Hora actual:</strong> {new Date().toLocaleTimeString('es-CL')}</p>
            <p>• <strong>Tipo:</strong> Registro manual con código QR</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm;