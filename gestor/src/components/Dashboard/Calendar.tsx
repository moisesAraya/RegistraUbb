import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  Shield
} from 'lucide-react';
import { useAsistencia } from '../../hooks/useAsistencia';

interface DayData {
  date: Date;
  hours: number;
  status: 'success' | 'warning' | 'error' | 'justified' | 'unjustified' | 'none';
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  attendance?: {
    horaIngreso: string | null;
    horaSalida: string | null;
    horasTrabajadas: number;
    estado: string;
    observacion?: string;
    justificacion?: {
      motivo: string;
      descripcion: string;
      es_justificada: boolean;
      horas_compensadas: number;
    };
  };
}

const AttendanceCalendar: React.FC = () => {
  const { asistenciaData, isLoading, fetchAsistencia } = useAsistencia();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const monthNames = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  useEffect(() => {
    const mes = currentDate.getMonth() + 1;
    const anio = currentDate.getFullYear();
    fetchAsistencia(mes, anio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // ---------- HELPERS ----------

  const normalizeFecha = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value.substring(0, 10);
    if (value instanceof Date) return value.toISOString().substring(0, 10);
    return null;
  };

  const getStatusFromHours = (
    hours: number,
    justificacion?: any
  ): 'success' | 'warning' | 'error' | 'justified' | 'unjustified' | 'none' => {
    // ✅ Prioridad absoluta a justificaciones
    if (justificacion) {
      return justificacion.es_justificada ? 'justified' : 'unjustified';
    }

    if (hours >= 7) return 'success';
    if (hours >= 4) return 'warning';
    if (hours > 0) return 'error';
    return 'none';
  };

  const getStatusColor = (
    status: 'success' | 'warning' | 'error' | 'justified' | 'unjustified' | 'none'
  ) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'justified': return 'bg-green-500';
      case 'unjustified': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (
    status: 'success' | 'warning' | 'error' | 'justified' | 'unjustified' | 'none'
  ) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'justified': return <Shield className="w-4 h-4 text-green-600" />;
      case 'unjustified': return <Shield className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusShape = (
    status: 'success' | 'warning' | 'error' | 'justified' | 'unjustified' | 'none'
  ) => {
    // ✅ Triángulos para justificaciones, círculos para asistencias normales
    if (status === 'justified' || status === 'unjustified') {
      return 'triangle';
    }
    return 'circle';
  };

  // ---------- MERGE ASISTENCIAS + JUSTIFICACIONES PARA EL CALENDARIO ----------

  const rawAsistencias: any[] = asistenciaData?.asistencias || [];
  const rawJustificaciones: any[] =
    (asistenciaData as any)?.justificaciones ||
    (asistenciaData as any)?.faltas ||
    [];

  // Mapa por fecha YYYY-MM-DD
  const registrosPorFecha: Record<string, any> = {};

  // 1) Asistencias normales
  rawAsistencias.forEach(a => {
    const fecha = normalizeFecha(a.fecha);
    if (!fecha) return;

    registrosPorFecha[fecha] = {
      ...a,
      fecha,
      horasTrabajadas: a.horasTrabajadas ?? a.horas_diarias ?? 0,
      estado: a.estado || 'presente',
      justificacion: a.justificacion // si el backend ya la trae aquí
    };
  });

  // 2) Justificaciones puras (sin asistencia)
  rawJustificaciones.forEach(j => {
    const fecha =
      normalizeFecha(j.fecha) ||
      normalizeFecha(j.fecha_justificacion);
    if (!fecha) return;

    const base = registrosPorFecha[fecha] || {};

    registrosPorFecha[fecha] = {
      ...base,
      fecha,
      // si ya había horasTrabajadas, las mantenemos;
      // si no, usamos horas_compensadas o 0
      horasTrabajadas: base.horasTrabajadas ?? j.horas_compensadas ?? 0,
      estado: j.es_justificada ? 'justificada' : 'no_justificada',
      justificacion: {
        motivo: j.motivo,
        descripcion: j.descripcion,
        es_justificada: !!j.es_justificada,
        horas_compensadas: j.horas_compensadas || 0
      }
    };
  });

  // ---------- GENERAR DÍAS DEL CALENDARIO ----------

  const generateCalendarDays = (): DayData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Días del mes anterior para completar la grilla
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        hours: 0,
        status: 'none',
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      const attendance = registrosPorFecha[dateString];

      const horas = attendance?.horasTrabajadas ?? attendance?.horas_diarias ?? 0;
      const justificacion = attendance?.justificacion;

      const status = isWeekend
        ? 'none'
        : getStatusFromHours(horas, justificacion);

      days.push({
        date,
        hours: horas,
        status,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isWeekend,
        attendance: attendance
          ? {
              horaIngreso: attendance.horaIngreso || null,
              horaSalida: attendance.horaSalida || null,
              horasTrabajadas: horas,
              estado: attendance.estado || status,
              observacion: attendance.observacion,
              justificacion
            }
          : undefined
      });
    }

    // Días del mes siguiente para completar 6 filas (42 celdas)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        hours: 0,
        status: 'none',
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  // ---------- RENDER ----------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando calendario...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendario principal */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Hoy
            </button>

            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-3 mb-3 p-2 bg-slate-50 rounded-lg text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-slate-700">≥7h</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-slate-700">4-6h</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-slate-700">&lt;4h</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-green-500"></div>
            <span className="text-slate-700">Justificada</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-500"></div>
            <span className="text-slate-700">No justificada</span>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-600 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayData, index) => {
            const isSelected = selectedDay?.date.getTime() === dayData.date.getTime();
            const shape = getStatusShape(dayData.status);

            return (
              <button
                key={index}
                onClick={() => dayData.isCurrentMonth ? setSelectedDay(dayData) : null}
                disabled={!dayData.isCurrentMonth}
                className={`
                  relative aspect-square p-1 rounded-lg text-xs font-medium transition-all
                  ${!dayData.isCurrentMonth ? 'text-slate-300 cursor-not-allowed' : ''}
                  ${dayData.isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-50 shadow-md scale-105' : 'hover:bg-slate-50'}
                  ${dayData.isWeekend && dayData.isCurrentMonth ? 'bg-slate-50' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span
                    className={`
                      ${dayData.isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}
                      ${dayData.isToday ? 'font-bold' : ''}
                    `}
                  >
                    {dayData.date.getDate()}
                  </span>

                  {dayData.isCurrentMonth && dayData.status !== 'none' && (
                    shape === 'triangle' ? (
                      <div
                        className={`
                          w-0 h-0 mt-0.5
                          border-l-[4px] border-l-transparent
                          border-r-[4px] border-r-transparent
                          border-b-[6px]
                          ${dayData.status === 'justified'
                            ? 'border-b-green-500'
                            : 'border-b-red-500'}
                        `}
                      ></div>
                    ) : (
                      <div
                        className={`
                          w-1.5 h-1.5 rounded-full mt-0.5
                          ${getStatusColor(dayData.status)}
                        `}
                      ></div>
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel lateral */}
      <div className="space-y-4">
        {/* Detalles del día seleccionado */}
        {selectedDay && selectedDay.attendance ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedDay.status)}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedDay.date.toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </h3>
                  <p className="text-xs text-slate-600">Detalles</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Justificación si existe */}
            {selectedDay.attendance.justificacion ? (
              <div
                className={`mb-3 p-3 rounded-lg border-2 ${
                  selectedDay.attendance.justificacion.es_justificada
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Shield
                    className={`w-4 h-4 ${
                      selectedDay.attendance.justificacion.es_justificada
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  />
                <span
                    className={`text-xs font-bold uppercase ${
                      selectedDay.attendance.justificacion.es_justificada
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}
                  >
                    Falta{' '}
                    {selectedDay.attendance.justificacion.es_justificada
                      ? 'Justificada'
                      : 'No Justificada'}
                  </span>
                </div>
                <p
                  className={`text-xs font-semibold ${
                    selectedDay.attendance.justificacion.es_justificada
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}
                >
                  Motivo: {selectedDay.attendance.justificacion.motivo}
                </p>
                {selectedDay.attendance.justificacion.descripcion && (
                  <p
                    className={`text-xs mt-1 ${
                      selectedDay.attendance.justificacion.es_justificada
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {selectedDay.attendance.justificacion.descripcion}
                  </p>
                )}
                {selectedDay.attendance.justificacion.es_justificada && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    ✓ Compensadas: {selectedDay.attendance.justificacion.horas_compensadas}h
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Ingreso</span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedDay.attendance.horaIngreso?.substring(0, 5) || '-'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Salida</span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedDay.attendance.horaSalida?.substring(0, 5) || '-'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Total</span>
                    <span
                      className={`text-sm font-bold ${
                        selectedDay.hours >= 7
                          ? 'text-green-600'
                          : selectedDay.hours >= 4
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {selectedDay.hours}h
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedDay.attendance.observacion && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Observación:</p>
                <p className="text-xs text-blue-800">{selectedDay.attendance.observacion}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center text-slate-400 py-6">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Selecciona un día para ver detalles</p>
            </div>
          </div>
        )}

        {/* Resumen del mes */}
        {asistenciaData?.resumen && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
              Resumen del Mes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-blue-600">
                  {asistenciaData.resumen.diasTrabajados}
                </p>
                <p className="text-xs text-slate-600">Días</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-green-600">
                  {asistenciaData.resumen.horasTotales}h
                </p>
                <p className="text-xs text-slate-600">Horas</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-purple-600">
                  {asistenciaData.resumen.horasPromedio}h
                </p>
                <p className="text-xs text-slate-600">Promedio</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-red-600">
                  {asistenciaData.resumen.faltas}
                </p>
                <p className="text-xs text-slate-600">Faltas</p>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas adicionales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Estado Actual</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Cumplimiento</span>
              <span className="font-bold text-slate-900">
                {asistenciaData?.resumen
                  ? Math.round(
                      (asistenciaData.resumen.diasTrabajados /
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          0
                        ).getDate()) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    asistenciaData?.resumen
                      ? Math.round(
                          (asistenciaData.resumen.diasTrabajados /
                            new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth() + 1,
                              0
                            ).getDate()) * 100
                        )
                      : 0
                  }%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
