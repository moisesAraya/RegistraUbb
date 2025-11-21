import React, { useState, useEffect, useMemo } from 'react';
import { FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
import TimeInput from '../Common/TimeInput';
import { useAsistenciaContext } from '../../context/AsistenciaContext';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    location?: string;
    notes?: string;
    justificationReason: string;
    registroTipo: string;
  }) => Promise<{ success: boolean }>;
}

const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const { asistenciaData, fetchAsistencia } = useAsistenciaContext();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    location: '',
    notes: '',
    justificationReason: '',
    registroTipo: 'entrada_manana'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Función para calcular las horas entre dos tiempos
  const calculateHoursDifference = (time1: string, time2: string): number => {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return Math.abs(minutes2 - minutes1) / 60;
  };

  // Obtener los marcajes del día seleccionado
  const marcajesDelDia = useMemo(() => {
    if (!asistenciaData?.asistencias || !formData.date) return [];
    
    const marcajes = asistenciaData.asistencias.filter((marcaje: any) => {
      const fechaMarcaje = new Date(marcaje.fecha).toISOString().split('T')[0];
      return fechaMarcaje === formData.date;
    });
    
    console.log('📅 Fecha seleccionada:', formData.date);
    console.log('📊 Total asistencias:', asistenciaData.asistencias.length);
    console.log('🔍 Marcajes del día:', marcajes);
    console.log('🎯 Tipos de marcaje del día:', marcajes.map((m: any) => m.tipoMarcaje));
    
    return marcajes;
  }, [asistenciaData, formData.date]);

  // Determinar qué opciones de tipo de marcaje están disponibles
  const availableTipoMarcaje = useMemo(() => {
    const allOptions = [
      { value: 'entrada_manana', label: 'Entrada Mañana' },
      { value: 'salida_almuerzo', label: 'Salida Almuerzo' },
      { value: 'entrada_tarde', label: 'Entrada Tarde' },
      { value: 'salida_dia', label: 'Salida fin de jornada' }
    ];

    if (marcajesDelDia.length === 0) {
      // Si no hay marcajes, solo permitir entrada_manana
      return allOptions.filter(opt => opt.value === 'entrada_manana');
    }

    const tiposExistentes = marcajesDelDia.map((m: any) => m.tipoMarcaje);
    
    // Verificar si hay una entrada sin salida (entrada_manana sin salida_almuerzo)
    const hayEntradaMañana = tiposExistentes.includes('entrada_manana');
    const haySalidaAlmuerzo = tiposExistentes.includes('salida_almuerzo');
    const hayEntradaTarde = tiposExistentes.includes('entrada_tarde');
    const haySalidaDia = tiposExistentes.includes('salida_dia');

    // Si hay entrada de mañana sin salida a almuerzo, solo permitir salida_almuerzo
    if (hayEntradaMañana && !haySalidaAlmuerzo) {
      return allOptions.filter(opt => opt.value === 'salida_almuerzo');
    }

    // Si hay entrada de tarde sin salida de día, solo permitir salida_dia
    if (hayEntradaTarde && !haySalidaDia) {
      return allOptions.filter(opt => opt.value === 'salida_dia');
    }

    // Si ya existe entrada_manana con salida_almuerzo, verificar las horas
    if (hayEntradaMañana && haySalidaAlmuerzo) {
      const entradaMañana = marcajesDelDia.find((m: any) => m.tipoMarcaje === 'entrada_manana');
      const salidaAlmuerzo = marcajesDelDia.find((m: any) => m.tipoMarcaje === 'salida_almuerzo');
      
      if (entradaMañana && salidaAlmuerzo) {
        const horaEntrada = entradaMañana.horaIngreso;
        const horaSalida = salidaAlmuerzo.horaSalida;
        
        if (horaEntrada && horaSalida) {
          const horas = calculateHoursDifference(horaEntrada, horaSalida);
          
          if (horas < 6) {
            // Si fue menos de 6 horas, forzar entrada_tarde
            if (hayEntradaTarde) {
              // Ya existe entrada_tarde, permitir solo salida_dia
              return allOptions.filter(opt => opt.value === 'salida_dia');
            }
            return allOptions.filter(opt => opt.value === 'entrada_tarde');
          } else {
            // Si fue 6 o más horas, permitir solo salida_dia
            return allOptions.filter(opt => opt.value === 'salida_dia');
          }
        }
      }
    }
    
    // Filtrar las opciones según lo que ya existe
    return allOptions.filter(opt => !tiposExistentes.includes(opt.value));
  }, [marcajesDelDia]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      checkInTime: '',
      checkOutTime: '',
      location: '',
      notes: '',
      justificationReason: '',
      registroTipo: 'entrada_manana'
    });
    setIsSubmitting(false);
    setIsSuccess(false);
    setIsClosing(false);
  };

  const handleClose = React.useCallback(() => {
    if (!isSubmitting) {
      setIsClosing(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 200);
    }
  }, [isSubmitting, onClose]);

  // Actualizar el tipo de marcaje cuando cambien las opciones disponibles
  useEffect(() => {
    if (availableTipoMarcaje.length > 0) {
      const currentValueAvailable = availableTipoMarcaje.some(
        opt => opt.value === formData.registroTipo
      );
      
      if (!currentValueAvailable) {
        setFormData(prev => ({
          ...prev,
          registroTipo: availableTipoMarcaje[0].value
        }));
      }
    }
  }, [availableTipoMarcaje, formData.registroTipo]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, handleClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que la fecha no sea futura (usando fecha local, no UTC)
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    const fechaHoyLocal = `${year}-${month}-${day}`;
    
    if (formData.date > fechaHoyLocal) {
      alert('No puedes registrar marcajes para fechas futuras. Por favor selecciona la fecha de hoy o una fecha pasada.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log('📝 Enviando datos del modal (marcaje manual):', formData);
      const result = await onSubmit(formData);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error al registrar marcaje manual:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header del Modal */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900">Marcaje Manual</h3>
              <p className="text-sm text-amber-700">Complete los datos requeridos</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 text-amber-700" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                ¡Marcaje registrado!
              </h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                El marcaje se registró correctamente y ya aparece en tu historial.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 inline-block">
                <p className="text-sm text-green-800">
                  <strong>Confirmado:</strong> Marcaje procesado exitosamente
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Alerta informativa */}
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 mb-1">Importante</p>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Usa esta opción solo cuando no puedas usar el código QR</li>
                      <li>• Verifica que la fecha y hora sean correctas</li>
                      <li>• El marcaje será guardado inmediatamente</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Fecha y Hora del marcaje */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      max={(() => {
                        const hoy = new Date();
                        const year = hoy.getFullYear();
                        const month = String(hoy.getMonth() + 1).padStart(2, '0');
                        const day = String(hoy.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
                      required
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Tipo de marcaje */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tipo de marcaje *
                  </label>
                  <select
                    value={formData.registroTipo}
                    onChange={(e) => setFormData({ ...formData, registroTipo: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
                    required
                    disabled={isSubmitting}
                  >
                    {availableTipoMarcaje.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {availableTipoMarcaje.length === 1 && availableTipoMarcaje[0].value === 'entrada_tarde' && (
                    <p className="mt-1 text-xs text-amber-600">
                      ℹ️ La jornada de mañana fue menor a 6 horas, debe registrar entrada de tarde
                    </p>
                  )}
                  {availableTipoMarcaje.length === 1 && availableTipoMarcaje[0].value === 'salida_dia' && (
                    <p className="mt-1 text-xs text-blue-600">
                      ℹ️ Solo puede registrar salida de jornada
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Descripción del registro (opcional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Describa brevemente el detalle del marcaje manual"
                      rows={3}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`
                      flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200
                      ${isSubmitting 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
                      }
                    `}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      'Registrar Marcaje'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;
