import React, { useState } from 'react';
import { Clock, AlertCircle, Minus } from 'lucide-react';
import { useOpenMarcaje } from '../../hooks/useOpenMarcaje';
import { AddExitModal } from './AddExitModal';

export const OpenMarcajeNotification: React.FC = () => {
  const { openMarcaje, checkForOpenMarcaje } = useOpenMarcaje();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAddExitModal, setShowAddExitModal] = useState(false);

  // No mostrar si no hay marcaje abierto
  if (!openMarcaje) return null;

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Si viene como HH:MM:SS, tomar solo HH:MM
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getTimeElapsed = (ingresoTime: string) => {
    console.log('🔍 Calculando tiempo para:', ingresoTime);
    
    if (!ingresoTime) {
      console.log('❌ No hay hora de ingreso');
      return { hours: 0, minutes: 0, totalHours: 0, formatted: '0m' };
    }

    try {
      const now = new Date();
      console.log('⏰ Hora actual:', now.toLocaleString());
      
      // Detectar formato de hora
      let fechaIngreso: Date;
      
      if (ingresoTime.includes('T') || ingresoTime.includes('-')) {
        // Es un timestamp completo (ISO) - caso anterior para compatibilidad
        fechaIngreso = new Date(ingresoTime);
        console.log('📅 Parseando como timestamp ISO');
      } else {
        // Es hora en formato HH:MM:SS.mmm o HH:MM
        const timeParts = ingresoTime.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const secondsPart = timeParts[2] || '0';
        const seconds = parseInt(secondsPart.split('.')[0], 10);
        
        if (isNaN(hours) || isNaN(minutes)) {
          console.log('❌ Error parseando hora');
          return { hours: 0, minutes: 0, totalHours: 0, formatted: '0m' };
        }
        
        // Crear fecha de hoy con la hora de ingreso
        fechaIngreso = new Date();
        fechaIngreso.setHours(hours, minutes, seconds, 0);
        console.log('📅 Parseando como hora HH:MM:SS');
      }
      
      console.log('📅 Fecha ingreso construida:', fechaIngreso.toLocaleString());
      
      // Validar que la fecha sea válida
      if (isNaN(fechaIngreso.getTime())) {
        console.log('❌ Fecha de ingreso inválida');
        return { hours: 0, minutes: 0, totalHours: 0, formatted: '0m' };
      }
      
      const diffMs = now.getTime() - fechaIngreso.getTime();
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(totalMinutes / 60);
      const diffMinutes = totalMinutes % 60;
      const totalHours = diffMs / (1000 * 60 * 60);
      
      console.log('⚡ Diferencias calculadas:', {
        diffMs,
        totalMinutes,
        diffHours,
        diffMinutes,
        totalHours
      });
      
      return {
        hours: Math.max(0, diffHours),
        minutes: Math.max(0, diffMinutes),
        totalHours: Math.max(0, totalHours),
        formatted: diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`
      };
    } catch (error) {
      console.error('❌ Error calculando tiempo:', error);
      return { hours: 0, minutes: 0, totalHours: 0, formatted: '0m' };
    }
  };

  const handleAddExit = () => {
    setShowAddExitModal(true);
  };

  const handleExitSuccess = () => {
    // Actualizar los datos del marcaje
    checkForOpenMarcaje();
  };

  const timeElapsed = getTimeElapsed(openMarcaje.hora_ingreso);
  const isOvertime = timeElapsed.totalHours > 9;
  
  // Debug: mostrar información en consola
  console.log('🕐 Debug Marcaje:', {
    hora_ingreso: openMarcaje.hora_ingreso,
    ahora: new Date().toLocaleTimeString(),
    tiempo_transcurrido: timeElapsed,
    es_overtime: isOvertime,
    condicion_render: timeElapsed.hours > 0 ? 'mostrar_horas' : timeElapsed.minutes > 0 ? 'mostrar_minutos' : 'menos_1_minuto'
  });

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`text-white rounded-full p-3 shadow-2xl hover:scale-105 transition-transform animate-slideInBottom ${
            isOvertime 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : 'bg-gradient-to-r from-orange-500 to-amber-500'
          }`}
          title="Expandir notificación de marcaje"
        >
          <div className="relative">
            <Clock className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slideInBottom">
      <div 
        className={`text-white rounded-lg shadow-2xl border p-4 transition-all ${
          isOvertime 
            ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-200 cursor-pointer hover:shadow-3xl hover:scale-105' 
            : 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-200'
        }`}
        onClick={isOvertime ? handleAddExit : undefined}
        title={isOvertime ? 'Haz clic para agregar hora de salida' : undefined}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="relative">
                <Clock className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {isOvertime ? '¿Se te olvidó marcar la salida?' : 'Marcaje Activo'}
                </span>
              </div>
              <p className="text-sm opacity-90">
                <span className="capitalize">{formatDate(openMarcaje.fecha)}</span> a las{' '}
                <span className="font-bold">{formatTime(openMarcaje.hora_ingreso)}</span>
              </p>
              <p className="text-xs opacity-75 mt-1">
                Tiempo transcurrido: <span className="font-medium">
                  {timeElapsed.hours > 0 
                    ? `${timeElapsed.hours} horas${timeElapsed.minutes > 0 ? ` y ${timeElapsed.minutes} minutos` : ''}`
                    : timeElapsed.minutes > 0 
                      ? `${timeElapsed.minutes} minutos`
                      : 'Menos de 1 minuto'
                  }
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Minimizar"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="opacity-90">
                {isOvertime ? 'Parece que olvidaste marcar la salida' : 'Recuerda marcar tu salida cuando termines'}
              </span>
            </div>
            {isOvertime ? (
              <div className="text-xs font-medium opacity-90">
                👆 Haz clic aquí
              </div>
            ) : (
              <button
                onClick={() => setIsMinimized(true)}
                className="text-xs opacity-75 hover:opacity-100 transition-opacity underline"
              >
                Minimizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar salida */}
      {showAddExitModal && openMarcaje && (
        <AddExitModal
          isOpen={showAddExitModal}
          onClose={() => setShowAddExitModal(false)}
          marcaje={{
            id_marcaje: openMarcaje.id_marcaje,
            fecha: openMarcaje.fecha,
            hora_ingreso: openMarcaje.hora_ingreso
          }}
          onSuccess={handleExitSuccess}
        />
      )}
    </div>
  );
};