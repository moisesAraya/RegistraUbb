import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({ 
  value, 
  onChange, 
  required = false, 
  disabled = false,
  className = ''
}) => {
  const [supportsTimeInput, setSupportsTimeInput] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detectar si el navegador soporta input type="time" REALMENTE
    const input = document.createElement('input');
    input.setAttribute('type', 'time');
    input.setAttribute('value', 'a');
    
    // Firefox a veces dice que soporta time pero no muestra el widget
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const actuallySupports = input.type === 'time' && input.value !== 'a';
    
    // Si es Firefox, SIEMPRE usar el selector personalizado
    setSupportsTimeInput(!isFirefox && actuallySupports);

    // Parsear el valor inicial
    if (value) {
      const [h, m] = value.split(':');
      setSelectedHour(h || '');
      setSelectedMinute(m || '00');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    const newTime = `${hour.padStart(2, '0')}:${selectedMinute.padStart(2, '0')}`;
    onChange(newTime);
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    if (selectedHour) {
      const newTime = `${selectedHour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      onChange(newTime);
      setShowPicker(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Permitir solo números y el carácter ':'
    val = val.replace(/[^\d:]/g, '');
    
    // Auto-formatear mientras escribe
    if (val.length === 2 && !val.includes(':')) {
      val = val + ':';
    }
    
    // Limitar longitud a HH:MM (5 caracteres)
    if (val.length > 5) {
      val = val.slice(0, 5);
    }
    
    // Actualizar el valor inmediatamente mientras escribe
    onChange(val);
    
    // Si tiene formato completo, validar y actualizar estados
    if (val.length === 5 && val.includes(':')) {
      const [h, m] = val.split(':');
      const hour = parseInt(h);
      const minute = parseInt(m);
      
      if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        setSelectedHour(h.padStart(2, '0'));
        setSelectedMinute(m.padStart(2, '0'));
      }
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setShowPicker(!showPicker);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Si el navegador soporta input type="time", usarlo
  if (supportsTimeInput) {
    return (
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className || "w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"}
        step="60"
        required={required}
        disabled={disabled}
      />
    );
  }

  // Fallback para navegadores que no soportan input type="time"
  return (
    <div className="relative" ref={pickerRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="HH:MM"
          maxLength={5}
          disabled={disabled}
          required={required}
          className={`w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all bg-white ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
          }`}
        />
        <button
          type="button"
          onClick={handleInputClick}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showPicker && !disabled && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden">
          <div className="flex">
            {/* Columna de horas */}
            <div className="w-20 max-h-60 overflow-y-auto border-r border-slate-200">
              <div className="sticky top-0 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200">
                Hora
              </div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  onClick={() => handleHourSelect(hour)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-amber-50 ${
                    selectedHour === hour ? 'bg-amber-100 font-semibold' : ''
                  }`}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Columna de minutos */}
            <div className="w-20 max-h-60 overflow-y-auto">
              <div className="sticky top-0 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200">
                Min
              </div>
              {minutes.map((minute) => (
                <div
                  key={minute}
                  onClick={() => handleMinuteSelect(minute)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-amber-50 ${
                    selectedMinute === minute ? 'bg-amber-100 font-semibold' : ''
                  }`}
                >
                  {minute}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeInput;
