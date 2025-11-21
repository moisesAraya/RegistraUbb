// components/Dashboard/WeeklyAttendanceWidget.tsx
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Edit2,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { useAsistenciaContext } from "../../context/AsistenciaContext";
import TimeInput from "../Common/TimeInput";

interface AsistenciaItem {
  id_marcaje?: number;
  id_justificacion?: number;
  fecha: string;
  horaIngreso: string | null;
  horaSalida: string | null;
  horasTrabajadas: number;
  estado: string;
  observacion?: string | null;
  justificacion?: {
    motivo: string;
    descripcion: string | null;
    es_justificada: boolean;
    horas_compensadas: number;
  } | null;
  tipoMarcaje?: string | null;
  ubicacion?: string | null;
  colacion?: boolean;
  es_manual?: boolean;
}

interface DiaSemana {
  date: Date;
  key: string; // YYYY-MM-DD
  label: string;
  marcajes: AsistenciaItem[];
  totalHoras: number;
  status:
    | "success"
    | "warning"
    | "error"
    | "justified"
    | "unjustified"
    | "none";
}

type TipoEvento = "entrada" | "salida" | "justificacion";

interface EventoSlot {
  marcaje: AsistenciaItem;
  tipo: TipoEvento;
  displayTime: string | null;
}

const dayNamesShort = [
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

const normalizeFecha = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value.substring(0, 10);
  if (value instanceof Date) return value.toISOString().substring(0, 10);
  return null;
};

const getStatusFromDay = (
  totalHoras: number,
  marcajes: AsistenciaItem[]
): DiaSemana["status"] => {
  const just = marcajes.find((m) => m.justificacion);
  if (just && just.justificacion) {
    return just.justificacion.es_justificada ? "justified" : "unjustified";
  }

  if (totalHoras >= 7) return "success";
  if (totalHoras >= 4) return "warning";
  if (totalHoras > 0) return "error";
  return "none";
};

const getStatusIcon = (status: DiaSemana["status"]) => {
  switch (status) {
    case "success":
      return <CheckCircle className="w-3 h-3 text-green-600" />;
    case "warning":
      return <AlertTriangle className="w-3 h-3 text-yellow-600" />;
    case "error":
      return <XCircle className="w-3 h-3 text-red-600" />;
    case "justified":
      return <Shield className="w-3 h-3 text-green-600" />;
    case "unjustified":
      return <Shield className="w-3 h-3 text-red-600" />;
    default:
      return null;
  }
};

const formatTimeLabel = (timeString: string | null) => {
  if (!timeString) return "-";
  if (timeString.includes("T")) {
    const d = new Date(timeString);
    return d.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  const parts = timeString.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return timeString;
};

const formatTimeForInput = (timeString: string | null): string => {
  if (!timeString) return "";
  if (timeString.includes("T")) {
    const d = new Date(timeString);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  const parts = timeString.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return "";
};

/** Convierte una hora ("HH:MM[:SS]" o ISO) a minutos desde medianoche */
const timeToMinutes = (timeString: string | null): number | null => {
  if (!timeString) return null;

  try {
    if (timeString.includes("T")) {
      const d = new Date(timeString);
      return d.getHours() * 60 + d.getMinutes();
    }
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Construye los "eventos" a mostrar en los 4 slots de un día:
 * - Un evento por hora de entrada
 * - Un evento por hora de salida
 * - Si solo hay justificación (sin horas), un evento de tipo "justificacion"
 */
const buildEventosFromMarcajes = (
  marcajes: AsistenciaItem[]
): EventoSlot[] => {
  const eventos: EventoSlot[] = [];

  marcajes.forEach((m) => {
    const hasIngreso = !!m.horaIngreso;
    const hasSalida = !!m.horaSalida;
    const hasJust = !!m.justificacion;

    // Entradas y salidas normales
    if (hasIngreso) {
      eventos.push({
        marcaje: m,
        tipo: "entrada",
        displayTime: m.horaIngreso,
      });
    }

    if (hasSalida) {
      eventos.push({
        marcaje: m,
        tipo: "salida",
        displayTime: m.horaSalida,
      });
    }

    // Justificación sin marcaje (falta justificada / no justificada)
    if (!hasIngreso && !hasSalida && hasJust) {
      eventos.push({
        marcaje: m,
        tipo: "justificacion",
        displayTime: null,
      });
    }
  });

  // Ordenar por hora (las justificaciones sin hora van al inicio)
  eventos.sort((a, b) => {
    const ta = timeToMinutes(a.displayTime);
    const tb = timeToMinutes(b.displayTime);

    if (ta === null && tb === null) return 0;
    if (ta === null) return -1;
    if (tb === null) return 1;
    return ta - tb;
  });

  // Limitar a 4 eventos máximo
  return eventos.slice(0, 4);
};

const WeeklyAttendanceWidget: React.FC = () => {
  const {
    asistenciaData,
    isLoading,
    fetchAsistencia,
    editarMarcaje,
    eliminarMarcaje,
    registrarMarcajeManual,
  } = useAsistenciaContext();

  const [referenceDate, setReferenceDate] = useState(new Date());

  const [editing, setEditing] = useState<null | {
    id_marcaje: number;
    date: string;
    checkInTime: string;
    checkOutTime: string;
    notes: string;
  }>(null);

  // Parte en null, se abre solo cuando el usuario lo pide
  const [manualModal, setManualModal] = useState<{ date: string } | null>(null);

  // ---------- CALCULAR SEMANA (LUNES–SÁBADO) ----------

  const getWeekRange = (date: Date) => {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    const day = base.getDay(); // 0=Domingo, 1=Lunes,...
    const diffToMonday = (day + 6) % 7; // Lunes=0
    const monday = new Date(base);
    monday.setDate(base.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Lunes + 5 = Sábado
    saturday.setHours(23, 59, 59, 999);

    return { start: monday, end: saturday };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(referenceDate);

  // ---------- EFECTO: CARGAR MES CORRESPONDIENTE ----------

  useEffect(() => {
    const mes = referenceDate.getMonth() + 1;
    const anio = referenceDate.getFullYear();

    if (
      !asistenciaData ||
      asistenciaData.periodo.mes !== mes ||
      asistenciaData.periodo.anio !== anio
    ) {
      fetchAsistencia(mes, anio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceDate, asistenciaData]);

  // ---------- AGRUPAR ASISTENCIAS POR FECHA PARA ESTA SEMANA ----------

  const registros: AsistenciaItem[] = (asistenciaData?.asistencias ||
    []) as AsistenciaItem[];

  const registrosSemana = registros.filter((r) => {
    const fechaKey = normalizeFecha(r.fecha);
    if (!fechaKey) return false;
    const f = new Date(`${fechaKey}T00:00:00`);
    return f >= weekStart && f <= weekEnd;
  });

  const porFecha: Record<string, AsistenciaItem[]> = {};
  registrosSemana.forEach((r) => {
    const key = normalizeFecha(r.fecha);
    if (!key) return;
    if (!porFecha[key]) porFecha[key] = [];
    porFecha[key].push(r);
  });

  const diasSemana: DiaSemana[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const marcajesDia = porFecha[key] || [];

    const totalHoras = marcajesDia.reduce(
      (sum, m) => sum + (m.horasTrabajadas || 0),
      0
    );

    diasSemana.push({
      date: d,
      key,
      label: dayNamesShort[i],
      marcajes: marcajesDia,
      totalHoras: Math.round(totalHoras * 100) / 100,
      status: getStatusFromDay(totalHoras, marcajesDia),
    });
  }

  const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange(
    new Date()
  );
  const isCurrentWeek =
    weekStart.toDateString() === currentWeekStart.toDateString() &&
    weekEnd.toDateString() === currentWeekEnd.toDateString();

  // ---------- HANDLERS SEMANA ----------

  const goToPreviousWeek = () => {
    const newDate = new Date(referenceDate);
    newDate.setDate(referenceDate.getDate() - 7);
    setReferenceDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(referenceDate);
    newDate.setDate(referenceDate.getDate() + 7);
    setReferenceDate(newDate);
  };

  const goToCurrentWeek = () => {
    setReferenceDate(new Date());
  };

  // ---------- HANDLERS MARCAJES ----------

  const handleMarcajeClick = (marcaje: AsistenciaItem) => {
    if (!marcaje.id_marcaje) return; // solo manual/propio

    const fechaNorm = normalizeFecha(marcaje.fecha) || marcaje.fecha;
    setEditing({
      id_marcaje: marcaje.id_marcaje,
      date: fechaNorm,
      checkInTime: formatTimeForInput(marcaje.horaIngreso || marcaje.horaSalida),
      checkOutTime: "",
      notes: marcaje.observacion || "",
    });
  };

  const handleDeleteMarcaje = async (marcaje: AsistenciaItem) => {
    if (!marcaje.id_marcaje) return;
    const ok = window.confirm(
      "¿Seguro que quieres eliminar este marcaje? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    await eliminarMarcaje(marcaje.id_marcaje);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.checkInTime) {
      alert("Debes ingresar la hora de entrada");
      return;
    }

    await editarMarcaje({
      id_marcaje: editing.id_marcaje,
      date: editing.date,
      checkInTime: editing.checkInTime,
      checkOutTime: editing.checkOutTime || undefined,
      notes: editing.notes || undefined,
    });

    setEditing(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualModal) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const date = manualModal.date;
    const checkInTime = (formData.get("checkInTime") as string) || "";
    const checkOutTime = (formData.get("checkOutTime") as string) || "";

    if (!checkInTime) {
      alert("Debes ingresar al menos la hora de entrada");
      return;
    }

    await registrarMarcajeManual({
      date,
      checkInTime,
      checkOutTime: checkOutTime || null,
      notes: (formData.get("notes") as string) || "",
      location: null,
      activityType: null,
      id_totem: null,
    });

    setManualModal(null);
  };

  // ---------- RENDER ----------

  if (isLoading && !asistenciaData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        <span className="ml-2 text-gray-600 text-sm">
          Cargando asistencia semanal...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
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
              Vista semanal de tus marcajes (máx. 4 por día)
            </p>
          </div>

          <div className="flex items-center gap-2">
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

            {/* Botón Ingreso manual */}
            <button
              onClick={() =>
                setManualModal({
                  date: new Date().toISOString().substring(0, 10),
                })
              }
              className="ml-2 hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Ingreso manual
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-3 mb-4 p-2 bg-slate-50 rounded-lg text-[11px]">
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

        {/* Tabla Lunes–Sábado con 4 recuadros + horas totales */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Cabecera días */}
            <div className="grid grid-cols-6 border-b border-slate-200">
              {diasSemana.map((dia) => (
                <div
                  key={dia.key}
                  className="py-2 px-2 text-center font-semibold text-xs border-l border-slate-200 first:border-l-0"
                >
                  {dia.label}
                </div>
              ))}
            </div>

            {/* 4 filas de slots */}
            {[0, 1, 2, 3].map((slotIndex) => (
              <div
                key={slotIndex}
                className="grid grid-cols-6 border-b border-slate-200"
              >
                {diasSemana.map((dia) => {
                  const eventos = buildEventosFromMarcajes(dia.marcajes);
                  const evento = eventos[slotIndex];

                  if (!evento) {
                    return (
                      <div
                        key={dia.key + "-empty-" + slotIndex}
                        className="h-10 md:h-11 py-1 px-2 border-l border-slate-200 first:border-l-0 flex items-center justify-center"
                      >
                        <div className="w-full h-full border border-dashed border-slate-200 rounded-md" />
                      </div>
                    );
                  }

                  const marcaje = evento.marcaje;
                  const isEditable = !!marcaje.id_marcaje;

                  const status: DiaSemana["status"] = marcaje.justificacion
                    ? marcaje.justificacion.es_justificada
                      ? "justified"
                      : "unjustified"
                    : dia.status;

                  // Solo el primer evento de cada marcaje muestra el basurero
                  const isFirstOccurrence =
                    isEditable &&
                    eventos.findIndex(
                      (e) => e.marcaje.id_marcaje === marcaje.id_marcaje
                    ) === slotIndex;

                  let label = "";
                  if (evento.tipo === "justificacion") {
                    label = marcaje.justificacion?.es_justificada
                      ? "Justificada"
                      : "No justificada";
                  } else {
                    label = formatTimeLabel(evento.displayTime);
                  }

                  const bgClass = marcaje.justificacion
                    ? marcaje.justificacion.es_justificada
                      ? "bg-green-50 border border-green-300 text-green-800"
                      : "bg-red-50 border border-red-300 text-red-800"
                    : "bg-slate-50 border border-slate-200 text-slate-700";

                  return (
                    <div
                      key={dia.key + "-slot-" + slotIndex}
                      className="h-10 md:h-11 py-1 px-2 border-l border-slate-200 first:border-l-0"
                    >
                      <div
                        className={`w-full h-full rounded-md flex items-center justify-between px-2 text-[11px] cursor-pointer ${bgClass}`}
                        onClick={() => handleMarcajeClick(marcaje)}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(status)}
                          <span className="font-medium truncate">{label}</span>
                        </div>

                        {isFirstOccurrence && (
                          <button
                            type="button"
                            className="ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMarcaje(marcaje);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Totales por día */}
            <div className="grid grid-cols-6">
              {diasSemana.map((dia) => (
                <div
                  key={dia.key + "-total"}
                  className="py-2 px-2 border-l border-slate-200 first:border-l-0 text-center text-xs font-semibold text-slate-800"
                >
                  {dia.totalHoras > 0 ? `${dia.totalHoras} hrs` : "0 hrs"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal editar marcaje */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Edit2 className="h-4 w-4 mr-2 text-blue-600" />
              Editar marcaje
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) =>
                    setEditing({ ...editing, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora entrada
                  </label>
                  <TimeInput
                    value={editing.checkInTime}
                    onChange={(value) =>
                      setEditing({ ...editing, checkInTime: value })
                    }
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora salida
                  </label>
                  <TimeInput
                    value={editing.checkOutTime}
                    onChange={(value) =>
                      setEditing({ ...editing, checkOutTime: value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Puedes dejarla vacía si aún no quieres cerrar el día.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={editing.notes || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Agrega cualquier observación..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ingreso manual */}
      {manualModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PlusCircle className="h-4 w-4 mr-2 text-orange-600" />
              Ingreso manual
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={manualModal.date}
                  onChange={(e) => setManualModal({ date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora entrada
                  </label>
                  <input
                    name="checkInTime"
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Hora salida
                  </label>
                  <input
                    name="checkOutTime"
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observaciones (opcional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Agrega cualquier observación..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModal(null)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600"
                >
                  Guardar marcaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default WeeklyAttendanceWidget;
