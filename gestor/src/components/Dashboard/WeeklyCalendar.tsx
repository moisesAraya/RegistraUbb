import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  Shield,
} from "lucide-react";
import { useAsistenciaContext } from '../../context/AsistenciaContext';

interface DayData {
  date: Date;
  hours: number;
  status:
    | "success"
    | "warning"
    | "error"
    | "justified"
    | "unjustified"
    | "none";
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

const dayNamesFull = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WeeklyAttendanceWidget: React.FC = () => {
  const { asistenciaData, isLoading, fetchAsistencia } = useAsistenciaContext();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // ---------- HELPERS ----------

  const normalizeFecha = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value.substring(0, 10);
    if (value instanceof Date) return value.toISOString().substring(0, 10);
    return null;
  };

  const getWeekRange = (date: Date) => {
    // Semana desde domingo a sábado (igual que tu calendario mensual)
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay(); // 0 = domingo
    start.setDate(start.getDate() - day);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const getStatusFromHours = (
    hours: number,
    justificacion?: any
  ): "success" | "warning" | "error" | "justified" | "unjustified" | "none" => {
    // ✅ Prioridad a justificación
    if (justificacion) {
      return justificacion.es_justificada ? "justified" : "unjustified";
    }

    if (hours >= 7) return "success";
    if (hours >= 4) return "warning";
    if (hours > 0) return "error";
    return "none";
  };

  const getStatusColor = (
    status:
      | "success"
      | "warning"
      | "error"
      | "justified"
      | "unjustified"
      | "none"
  ) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      case "justified":
        return "bg-green-500";
      case "unjustified":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusIcon = (
    status:
      | "success"
      | "warning"
      | "error"
      | "justified"
      | "unjustified"
      | "none"
  ) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "justified":
        return <Shield className="w-4 h-4 text-green-600" />;
      case "unjustified":
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  // ---------- MERGE ASISTENCIAS + JUSTIFICACIONES (igual que tu calendario) ----------

  const rawAsistencias: any[] = asistenciaData?.asistencias || [];
  const rawJustificaciones: any[] =
    (asistenciaData as any)?.justificaciones ||
    (asistenciaData as any)?.faltas ||
    [];

  const registrosPorFecha: Record<string, any> = {};

  rawAsistencias.forEach((a) => {
    const fecha = normalizeFecha(a.fecha);
    if (!fecha) return;

    registrosPorFecha[fecha] = {
      ...a,
      fecha,
      horasTrabajadas: a.horasTrabajadas ?? a.horas_diarias ?? 0,
      estado: a.estado || "presente",
      justificacion: a.justificacion,
    };
  });

  rawJustificaciones.forEach((j) => {
    const fecha =
      normalizeFecha(j.fecha) || normalizeFecha(j.fecha_justificacion);
    if (!fecha) return;

    const base = registrosPorFecha[fecha] || {};

    registrosPorFecha[fecha] = {
      ...base,
      fecha,
      horasTrabajadas: base.horasTrabajadas ?? j.horas_compensadas ?? 0,
      estado: j.es_justificada ? "justificada" : "no_justificada",
      justificacion: {
        motivo: j.motivo,
        descripcion: j.descripcion,
        es_justificada: !!j.es_justificada,
        horas_compensadas: j.horas_compensadas || 0,
      },
    };
  });

  // ---------- GENERAR DÍAS DE LA SEMANA ----------

  const generateWeekDays = (): DayData[] => {
    const { start } = getWeekRange(referenceDate);
    const days: DayData[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];

      const attendance = registrosPorFecha[dateKey];
      const horas =
        attendance?.horasTrabajadas ?? attendance?.horas_diarias ?? 0;
      const justificacion = attendance?.justificacion;

      const status = getStatusFromHours(horas, justificacion);

      days.push({
        date,
        hours: horas,
        status,
        attendance: attendance
          ? {
              horaIngreso: attendance.horaIngreso || null,
              horaSalida: attendance.horaSalida || null,
              horasTrabajadas: horas,
              estado: attendance.estado || status,
              observacion: attendance.observacion,
              justificacion,
            }
          : undefined,
      });
    }

    return days;
  };

  const weekDays = generateWeekDays();
  const { start: weekStart, end: weekEnd } = getWeekRange(referenceDate);

  // 👇 Calculamos la semana actual (del hoy real)
  const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange(
    new Date()
  );

  const isCurrentWeek =
    weekStart.toDateString() === currentWeekStart.toDateString() &&
    weekEnd.toDateString() === currentWeekEnd.toDateString();

  // ---------- EFFECT: pedir datos al backend ----------

  useEffect(() => {
    const mes = referenceDate.getMonth() + 1;
    const anio = referenceDate.getFullYear();

    // Solo pedir al backend si:
    //  - aún no hay datos, o
    //  - los datos actuales son de otro mes/año distinto al que estamos viendo
    if (
      !asistenciaData ||
      asistenciaData.periodo.mes !== mes ||
      asistenciaData.periodo.anio !== anio
    ) {
      fetchAsistencia(mes, anio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceDate, asistenciaData]);

  // ---------- HANDLERS ----------

  const goToPreviousWeek = () => {
    const newDate = new Date(referenceDate);
    newDate.setDate(referenceDate.getDate() - 7);
    setReferenceDate(newDate);
    setSelectedDay(null);
  };

  const goToNextWeek = () => {
    const newDate = new Date(referenceDate);
    newDate.setDate(referenceDate.getDate() + 7);
    setReferenceDate(newDate);
    setSelectedDay(null);
  };

  const goToCurrentWeek = () => {
    setReferenceDate(new Date());
    setSelectedDay(null);
  };

  // ---------- RENDER ----------

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 text-sm">
          Cargando asistencia semanal...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              Semana del {weekStart.getDate()} de{" "}
              {monthNames[weekStart.getMonth()]} al {weekEnd.getDate()} de{" "}
              {monthNames[weekEnd.getMonth()]}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Vista rápida de tu asistencia semanal
          </p>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={goToPreviousWeek}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={goToCurrentWeek}
            disabled={isCurrentWeek}
            className={
              isCurrentWeek
                ? "px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-medium cursor-default"
                : "px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            }
          >
            {isCurrentWeek ? "Semana actual" : "Ir a semana actual"}
          </button>

          <button
            onClick={goToNextWeek}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Leyenda pequeña */}
      <div className="flex flex-wrap items-center gap-3 mb-3 p-2 bg-slate-50 rounded-lg text-[11px]">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-slate-700">≥7h</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span className="text-slate-700">4-6h</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-slate-700">&lt;4h</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-green-500" />
          <span className="text-slate-700">Justificada</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-500" />
          <span className="text-slate-700">No justificada</span>
        </div>
      </div>

      {/* Tira de 7 días */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day, idx) => {
          const isSelected = selectedDay?.date.getTime() === day.date.getTime();
          const isToday = new Date().toDateString() === day.date.toDateString();
          const hasStatus = day.status !== "none";

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`
                relative rounded-lg px-1.5 py-2 text-center text-[11px] md:text-xs
                transition-all
                ${
                  isSelected
                    ? "bg-blue-50 shadow-sm scale-105"
                    : "hover:bg-slate-50"
                }
                ${isToday ? "ring-2 ring-blue-500" : ""}
              `}
            >
              <span className="block text-[10px] text-slate-500">
                {dayNamesFull[day.date.getDay()].slice(0, 3)}
              </span>
              <span className="block text-sm font-semibold text-slate-900">
                {day.date.getDate()}
              </span>

              {hasStatus && (
                <>
                  {/* círculo o punto de estado */}
                  <div
                    className={`w-2 h-2 rounded-full mx-auto mt-1 ${getStatusColor(
                      day.status
                    )}`}
                  ></div>
                  {/* horas */}
                  <span className="block mt-1 text-[10px] text-slate-600">
                    {day.hours}h
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Detalle del día seleccionado */}
      {selectedDay && selectedDay.attendance ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <div className="md:col-span-2 bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedDay.status)}
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {dayNamesFull[selectedDay.date.getDay()]},{" "}
                    {selectedDay.date.toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Estado: {selectedDay.attendance.estado}
                  </p>
                </div>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            {/* Justificación si existe */}
            {selectedDay.attendance.justificacion ? (
              <div
                className={`mt-2 p-2 rounded-lg border text-[11px] ${
                  selectedDay.attendance.justificacion.es_justificada
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-red-50 border-red-300 text-red-700"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Shield
                    className={`w-3 h-3 ${
                      selectedDay.attendance.justificacion.es_justificada
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                  <span className="font-semibold">
                    Falta{" "}
                    {selectedDay.attendance.justificacion.es_justificada
                      ? "Justificada"
                      : "No Justificada"}
                  </span>
                </div>
                <p>Motivo: {selectedDay.attendance.justificacion.motivo}</p>
                {selectedDay.attendance.justificacion.descripcion && (
                  <p className="mt-1">
                    {selectedDay.attendance.justificacion.descripcion}
                  </p>
                )}
                {selectedDay.attendance.justificacion.es_justificada && (
                  <p className="mt-1 font-medium">
                    ✓ Compensadas:{" "}
                    {selectedDay.attendance.justificacion.horas_compensadas}h
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                <div className="bg-white rounded-lg p-2">
                  <p className="text-slate-500">Ingreso</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedDay.attendance.horaIngreso?.substring(0, 5) || "-"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-slate-500">Salida</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedDay.attendance.horaSalida?.substring(0, 5) || "-"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-slate-500">Total</p>
                  <p
                    className={`text-sm font-semibold ${
                      selectedDay.hours >= 7
                        ? "text-green-600"
                        : selectedDay.hours >= 4
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedDay.hours}h
                  </p>
                </div>
              </div>
            )}

            {selectedDay.attendance.observacion && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px]">
                <p className="font-medium text-blue-900 mb-1">Observación:</p>
                <p className="text-blue-800">
                  {selectedDay.attendance.observacion}
                </p>
              </div>
            )}
          </div>

          {/* Mini resumen semanal */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-[11px]">
            <h3 className="flex items-center text-xs font-semibold text-slate-900 mb-2">
              <BarChart3 className="w-3 h-3 mr-1 text-blue-600" />
              Resumen semanal
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Días con registro</span>
                <span className="font-semibold">
                  {weekDays.filter((d) => d.attendance).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Horas totales</span>
                <span className="font-semibold text-blue-700">
                  {weekDays.reduce((acc, d) => acc + (d.hours || 0), 0)}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Faltas (&lt;4h)</span>
                <span className="font-semibold text-red-600">
                  {weekDays.filter((d) => d.hours > 0 && d.hours < 4).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Justificadas</span>
                <span className="font-semibold text-green-600">
                  {weekDays.filter((d) => d.status === "justified").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500">
          Selecciona un día de la semana para ver el detalle de tu asistencia.
        </p>
      )}
    </div>
  );
};

export default WeeklyAttendanceWidget;
