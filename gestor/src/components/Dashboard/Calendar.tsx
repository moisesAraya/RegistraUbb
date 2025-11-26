import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react';
import { useAsistenciaContext } from '../../context/AsistenciaContext';

interface PermisoAdministrativo {
  horas: number;
  tipo: 'media' | 'completo';
  descripcion?: string;
}

interface Justificacion {
  motivo: string;
  descripcion: string;
  es_justificada: boolean;
  horas_compensadas: number;
  jornada?: string;
  tipo?: string;
}

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
    justificacion?: Justificacion;
    permisoAdministrativo?: PermisoAdministrativo;
  };
}

const AttendanceCalendar: React.FC = () => {
  const { asistenciaData, isLoading, fetchAsistencia } = useAsistenciaContext();
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

  // Detectar permiso administrativo desde la justificación
  const buildPermisoAdministrativo = (
    justificacion?: Justificacion
  ): PermisoAdministrativo | undefined => {
    if (!justificacion) return undefined;

    const motivo = (justificacion.motivo || '').toLowerCase();
    const horas = justificacion.horas_compensadas ?? 0;

    if (!justificacion.es_justificada) return undefined;

    const esPermiso =
      motivo.includes('permiso') || motivo.includes('administrativo');

    if (!esPermiso || horas <= 0) return undefined;

    const tipo: 'media' | 'completo' = horas >= 7 ? 'completo' : 'media';

    return {
      horas,
      tipo,
      descripcion: justificacion.descripcion || ''
    };
  };

  const getStatusFromHours = (
    hours: number,
    justificacion?: Justificacion
  ): 'success' | 'warning' | 'error' | 'justified' | 'unjustified' | 'none' => {
    // Prioridad a justificaciones
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
    // Triángulos para justificaciones, círculos para asistencias normales
    if (status === 'justified' || status === 'unjustified') {
      return 'triangle';
    }
    return 'circle';
  };

  // ---------- MERGE ASISTENCIAS + JUSTIFICACIONES PARA EL CALENDARIO ----------

  const rawAsistencias: any[] = asistenciaData?.asistencias || [];
  const rawJustificaciones: any[] =
    (asistenciaData as any)?.justificaciones ||
    (asistenciaData as any)?.ausencias ||
    [];

  // Mapa por fecha YYYY-MM-DD
  const registrosPorFecha: Record<string, any> = {};

  // 1) Asistencias normales - agregar horas para el mismo día
  rawAsistencias.forEach(a => {
    const fecha = normalizeFecha(a.fecha);
    if (!fecha) return;

    const existente = registrosPorFecha[fecha];
    const horasActuales = a.horasTrabajadas ?? a.horas_diarias ?? 0;

    const permisoDesdeAsistencia = buildPermisoAdministrativo(a.justificacion);

    if (existente) {
      registrosPorFecha[fecha] = {
        ...existente,
        horasTrabajadas: (existente.horasTrabajadas || 0) + horasActuales,
        horaIngreso:
          !existente.horaIngreso ||
          (a.horaIngreso && a.horaIngreso < existente.horaIngreso)
            ? a.horaIngreso
            : existente.horaIngreso,
        horaSalida:
          !existente.horaSalida ||
          (a.horaSalida && a.horaSalida > existente.horaSalida)
            ? a.horaSalida
            : existente.horaSalida,
        observacion: [existente.observacion, a.observacion]
          .filter(Boolean)
          .join(' | ') || null,
        estado: existente.estado || a.estado || 'presente',
        justificacion: existente.justificacion || a.justificacion,
        permisoAdministrativo:
          existente.permisoAdministrativo || permisoDesdeAsistencia
      };
    } else {
      registrosPorFecha[fecha] = {
        ...a,
        fecha,
        horasTrabajadas: horasActuales,
        estado: a.estado || 'presente',
        justificacion: a.justificacion,
        permisoAdministrativo: permisoDesdeAsistencia
      };
    }
  });

  // 2) Justificaciones puras (sin asistencia o complementarias)
  rawJustificaciones.forEach(j => {
    const fecha =
      normalizeFecha(j.fecha) ||
      normalizeFecha(j.fecha_justificacion);
    if (!fecha) return;

    const base = registrosPorFecha[fecha] || {};

    const permisoDesdeJustificacion = buildPermisoAdministrativo(j);

    registrosPorFecha[fecha] = {
      ...base,
      fecha,
      horasTrabajadas:
        (base.horasTrabajadas ?? base.horas_diarias ?? 0) +
        (j.horas_compensadas ?? 0),
      estado: base.estado || (j.es_justificada ? 'justificada' : 'injustificada'),
      justificacion: base.justificacion || {
        motivo: j.motivo,
        descripcion: j.descripcion,
        es_justificada: !!j.es_justificada,
        horas_compensadas: j.horas_compensadas || 0,
        jornada: j.jornada,
        tipo: j.tipo
      },
      permisoAdministrativo:
        base.permisoAdministrativo || permisoDesdeJustificacion
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

      const horas =
        attendance?.horasTrabajadas ?? attendance?.horas_diarias ?? 0;
      const justificacion: Justificacion | undefined =
        attendance?.justificacion;

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
              justificacion,
              permisoAdministrativo: attendance.permisoAdministrativo
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

  // ---------- FUNCIÓN PARA OBTENER MARCAJES INDIVIDUALES DEL DÍA ----------

  const getMarcajesDelDia = (fecha: string) => {
    return rawAsistencias.filter(a => normalizeFecha(a.fecha) === fecha);
  };

  // Marcajes del día seleccionado (ya ordenados)
  let marcajesDelDiaSeleccionado: any[] = [];
  if (selectedDay) {
    const fechaString = selectedDay.date.toISOString().split('T')[0];
    marcajesDelDiaSeleccionado = getMarcajesDelDia(fechaString);

    if (marcajesDelDiaSeleccionado.length === 2) {
      const h1 = marcajesDelDiaSeleccionado[0].horaIngreso;
      if (h1 && parseInt(h1.substring(0, 2)) >= 12) {
        marcajesDelDiaSeleccionado = [
          marcajesDelDiaSeleccionado[1],
          marcajesDelDiaSeleccionado[0],
        ];
      }
    }
  }

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
            <span className="text-slate-700">Injustificada</span>
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

            // Permiso administrativo
            let showTriangle = false;
            let showCircle = false;
            let triangleColor = '#22c55e';
            let circleColor = '#22c55e';

            if (dayData.attendance?.permisoAdministrativo) {
              if (dayData.attendance.permisoAdministrativo.tipo === 'media') {
                showTriangle = true;
                showCircle = true;
              } else if (dayData.attendance.permisoAdministrativo.tipo === 'completo') {
                showTriangle = true;
                showCircle = false;
              }
            }

            const shape = getStatusShape(dayData.status);

            return (
              <button
                key={index}
                onClick={() => dayData.isCurrentMonth ? setSelectedDay(dayData) : null}
                disabled={!dayData.isCurrentMonth}
                className={`
                  relative aspect-square p-1 rounded-lg text-xs font-medium transition-all border border-slate-200
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

                  {/* Permiso administrativo media jornada: triángulo y círculo verde */}
                  {dayData.isCurrentMonth && showTriangle && showCircle ? (
                    <>
                      <div
                        className="w-0 h-0 mt-1"
                        style={{
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderBottom: `12px solid ${triangleColor}`
                        }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full mt-1"
                        style={{ background: circleColor }}
                      ></div>
                    </>
                  ) : dayData.isCurrentMonth && showTriangle ? (
                    <div
                      className="w-0 h-0 mt-1"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: `12px solid ${triangleColor}`
                      }}
                    ></div>
                  ) : dayData.isCurrentMonth && dayData.status !== 'none' ? (
                    shape === 'triangle' ? (
                      <div
                        className="w-0 h-0 mt-1"
                        style={{
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderBottom: dayData.status === 'justified'
                            ? '12px solid #22c55e'
                            : '12px solid #ef4444'
                        }}
                      ></div>
                    ) : (
                      <div
                        className={`w-4 h-4 rounded-full mt-1 ${getStatusColor(dayData.status)}`}
                      ></div>
                    )
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel lateral */}
      <div className="space-y-4">
        {/* Detalles del día seleccionado */}
        {selectedDay && selectedDay.attendance && (
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
                  <p className="text-xs text-slate-600">Detalles del día</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Permiso administrativo media jornada + trabajo */}
            {selectedDay.attendance.permisoAdministrativo &&
              selectedDay.attendance.permisoAdministrativo.tipo === 'media' && (
                <div className="mb-3 p-3 rounded-lg border-2 bg-green-50 border-green-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold uppercase text-green-800">
                      Permiso administrativo (media jornada)
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-green-700">
                    Media jornada ({selectedDay.attendance.permisoAdministrativo.horas}h)
                  </p>
                  {selectedDay.attendance.permisoAdministrativo.descripcion && (
                    <p className="text-xs mt-1 text-green-600">
                      {selectedDay.attendance.permisoAdministrativo.descripcion}
                    </p>
                  )}
                  {marcajesDelDiaSeleccionado.length > 0 && (
                    <p className="text-xs mt-2 text-green-700 font-medium">
                      El resto del día fue trabajado normalmente.
                    </p>
                  )}
                </div>
              )}

            {/* Permiso administrativo jornada completa */}
            {selectedDay.attendance.permisoAdministrativo &&
              selectedDay.attendance.permisoAdministrativo.tipo === 'completo' && (
                <div className="mb-3 p-3 rounded-lg border-2 bg-green-50 border-green-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold uppercase text-green-800">
                      Permiso administrativo
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-green-700">
                    Jornada completa ({selectedDay.attendance.permisoAdministrativo.horas}h)
                  </p>
                  {selectedDay.attendance.permisoAdministrativo.descripcion && (
                    <p className="text-xs mt-1 text-green-600">
                      {selectedDay.attendance.permisoAdministrativo.descripcion}
                    </p>
                  )}
                </div>
              )}

            {/* Justificación normal (solo cuando NO hay permiso administrativo) */}
            {selectedDay.attendance.justificacion &&
             !selectedDay.attendance.permisoAdministrativo && (
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
                    Ausencia{' '}
                    {selectedDay.attendance.justificacion.es_justificada
                      ? 'Justificada'
                      : 'Injustificada'}
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
              </div>
            )}

            {/* Info básica y resumen de horas */}
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

              {/* Marcajes individuales del día */}
              {marcajesDelDiaSeleccionado.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-2">
                    Marcajes Individuales ({marcajesDelDiaSeleccionado.length}):
                  </p>
                  <div className="space-y-2">
                    {marcajesDelDiaSeleccionado.map((marcaje, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-md p-2 border border-blue-100"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-blue-700 font-medium">
                            Marcaje {index + 1}
                          </span>
                          <span className="text-blue-600 font-bold">
                            {marcaje.horasTrabajadas
                              ? marcaje.horasTrabajadas.toFixed(2)
                              : '0.00'}
                            h
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-600 mt-1">
                          <span>{marcaje.horaIngreso?.substring(0, 5) || '-'}</span>
                          <span>→</span>
                          <span>{marcaje.horaSalida?.substring(0, 5) || '-'}</span>
                        </div>

                        {/* Observación normal */}
                        {marcaje.observacion && (
                          <p className="text-xs text-blue-500 mt-1 italic">
                            {marcaje.observacion}
                          </p>
                        )}

                        {/* Detalle de justificación ligada a este marcaje */}
                        {marcaje.justificacion && (
                          <p
                            className={`text-xs mt-1 ${
                              marcaje.justificacion.es_justificada
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {marcaje.justificacion.es_justificada
                              ? 'Ausencia justificada'
                              : 'Ausencia injustificada'}
                            {' · '}
                            {marcaje.justificacion.motivo}
                            {marcaje.justificacion.horas_compensadas
                              ? ` (${marcaje.justificacion.horas_compensadas}h)`
                              : ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Observación general del día */}
            {selectedDay.attendance.observacion && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Observación:</p>
                <p className="text-xs text-blue-800">
                  {selectedDay.attendance.observacion}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AttendanceCalendar;
