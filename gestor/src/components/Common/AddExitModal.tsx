import React, { useState } from 'react';
import { Clock, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAddExit } from '../../hooks/useAddExit';

interface AddExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  marcaje: {
    id_marcaje: number;
    fecha: string;
    hora_ingreso: string;
  };
  onSuccess: () => void;
}

export const AddExitModal: React.FC<AddExitModalProps> = ({ 
  isOpen, 
  onClose, 
  marcaje, 
  onSuccess 
}) => {
  const [horaSalida, setHoraSalida] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { isLoading, error, addExit } = useAddExit();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!horaSalida) {
      return;
    }

    const success = await addExit({
      id_marcaje: marcaje.id_marcaje,
      hora_salida: horaSalida,
      fecha: marcaje.fecha
    });

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setShowSuccess(false);
        setHoraSalida('');
      }, 1500);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-CL', options);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">¡Salida Registrada!</h3>
          <p className="text-slate-600">Tu marcaje ha sido completado exitosamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md mx-4 w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Agregar Salida</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-slate-900 mb-2">Información del Marcaje</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <p><span className="font-medium">Fecha:</span> {formatDate(marcaje.fecha)}</p>
                <p><span className="font-medium">Hora de Ingreso:</span> {marcaje.hora_ingreso}</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hora de Salida
            </label>
            <div className="relative">
              <input
                type="time"
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setHoraSalida(getCurrentTime())}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                Ahora
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hora actual: {getCurrentTime()}
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                📅 <span className="font-medium">Nota:</span> La salida se guardará en el mismo día que el ingreso ({formatDate(marcaje.fecha)}).
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !horaSalida}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Registrar Salida'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};