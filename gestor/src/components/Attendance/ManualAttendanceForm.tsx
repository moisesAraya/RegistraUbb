import React, { useState } from 'react';
import { Clock, MapPin, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
import TimeInput from '../Common/TimeInput';

interface ManualAttendanceFormProps {
  onSubmit: (data: {
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    activityType: string;
    location?: string;
    notes?: string;
    justificationReason: string;
    registroTipo: string;
  }) => Promise<{ success: boolean }>;
  onClose?: () => void;
}

const ManualAttendanceForm: React.FC<ManualAttendanceFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '', // seguirá yendo vacío, pero ya no se muestra en el formulario
    activityType: 'Docencia',
    location: '',
    notes: '',
    justificationReason: '',
    registroTipo: 'entrada_manana'
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
          activityType: 'Docencia',
          location: '',
          notes: '',
          justificationReason: '',
          registroTipo: 'entrada_manana'
        });
        
        setTimeout(() => {
          setIsSuccess(false);
          onClose?.();
        }, 2500);
      }
    } catch (error) {
      console.error('Error al registrar marcaje manual:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            ¡Marcaje registrado!
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Tu marcaje manual ha sido registrado correctamente en el sistema.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Confirmación:</strong> El marcaje ya aparece en tu historial de asistencia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header del formulario */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900">Marcaje Manual</h3>
              <p className="text-sm text-amber-700">Complete los datos requeridos</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-amber-600 hover:text-amber-800 transition-colors p-1 hover:bg-amber-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Alerta informativa */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>Importante:</strong> Este marcaje se usa solo cuando no puedas utilizar el sistema QR normal.
          </p>
        </div>

        {/* Fecha y hora del marcaje */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Hora del marcaje *
            </label>
            <TimeInput
              value={formData.checkInTime}
              onChange={(value) => setFormData({ ...formData, checkInTime: value })}
              required
            />
          </div>
        </div>

        {/* Tipo de marcaje y actividad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de marcaje *
            </label>
            <select
              value={formData.registroTipo}
              onChange={(e) => setFormData({ ...formData, registroTipo: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
              required
            >
              <option value="entrada_manana">Entrada mañana</option>
              <option value="salida_almuerzo">Salida a colación</option>
              <option value="entrada_tarde">Entrada después de colación</option>
              <option value="salida_dia">Salida fin de jornada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de actividad *
            </label>
            <select
              value={formData.activityType}
              onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
              required
            >
              <option value="Docencia">Docencia</option>
              <option value="research">Investigación</option>
              <option value="management">Gestión Administrativa</option>
              <option value="other">Otra actividad</option>
            </select>
          </div>
        </div>

        {/* Ubicación */}
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
              placeholder="Ej: Sala 101, Laboratorio de Química"
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Descripción de la actividad (opcional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describa brevemente la actividad realizada"
              rows={3}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none transition-all"
            />
          </div>
        </div>


        {/* Botón de envío */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-3.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200
              ${isSubmitting 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Procesando marcaje...</span>
              </div>
            ) : (
              'Registrar Marcaje Manual'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualAttendanceForm;
