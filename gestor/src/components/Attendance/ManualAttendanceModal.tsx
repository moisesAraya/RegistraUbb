import React, { useState, useEffect } from 'react';
import { Clock, MapPin, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
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

  // ✅ Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      checkInTime: '',
      checkOutTime: '',
      activityType: 'teaching',
      location: '',
      notes: '',
      justificationReason: ''
    });
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  // ✅ Cerrar al hacer clic en el backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('📝 Enviando datos del modal:', formData); // Debug
      const result = await onSubmit(formData);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2500);
      }
    } catch (error) {
      console.error('Error al registrar asistencia manual:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registro Manual de Asistencia</h3>
              <p className="text-sm text-slate-600">Solicitud excepcional</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                ¡Solicitud Enviada Exitosamente!
              </h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Su solicitud de registro manual ha sido enviada y está pendiente de aprobación.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Nota:</strong> Recibirá una notificación una vez que sea revisada.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Alerta informativa */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Requisitos importantes</p>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Requiere justificación obligatoria</li>
                      <li>• Debe ser aprobado por la dirección</li>
                      <li>• Solo para casos excepcionales</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Será revisada por la dirección del departamento
                  </p>
                </div>

                {/* Botones del Modal */}
                <div className="flex space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`
                      flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
                      ${isSubmitting 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg'
                      }
                    `}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-transparent"></div>
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      'Enviar Solicitud'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95) translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ManualAttendanceModal;