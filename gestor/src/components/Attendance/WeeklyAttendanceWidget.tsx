// Helper para mostrar horas en formato HH:MM
function formatHorasMinutos(horas: number): string {
  const totalMinutos = Math.round((Number(horas) || 0) * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}
// components/Attendance/WeeklyAttendanceWidget.tsx
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

interface JustificacionItem {
  motivo: string;
  descripcion: string | null;
  es_justificada: boolean;
  horas_compensadas: number;
  tipo?: string;
  jornada?: string;
}

interface AsistenciaItem {
  id_marcaje?: number;
  id_justificacion?: number;
  fecha: string;
  horaIngreso: string | null;
  horaSalida: string | null;
  horasTrabajadas: number;
  estado: string;
  observacion?: string | null;
  justificacion?: JustificacionItem | null;
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
  totalHoras: string;
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

// ----------------- HELPERS -----------------

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
 * Construye los "eventos" a mostrar en los 4 slots de un día
 */
const buildEventosFromMarcajes = (
  marcajes: AsistenciaItem[]
): (EventoSlot | null)[] => {
  // 🔹 CASO ESPECIAL: solo justificación
  const tieneSoloJustificacion =
    marcajes.length > 0 &&
    marcajes.every(
      (m) => !m.horaIngreso && !m.horaSalida && !!m.justificacion
    );

  if (tieneSoloJustificacion) {
    const baseMarcaje = marcajes[0];
    const just = baseMarcaje.justificacion!;
    const horas = just.horas_compensadas ?? 0;
    const esNoJustificada = !just.es_justificada;

    const rawJornada =
      (just.jornada || just.tipo || "").toString().toLowerCase();

    const makeEvt = (): EventoSlot => ({
      marcaje: baseMarcaje,
      tipo: "justificacion",
      displayTime: null,
    });

    const esDiaCompleto =
      horas >= 7 ||
      rawJornada === "completa" ||
      rawJornada === "dia_completo" ||
      rawJornada === "jornada_completa";

    if (esDiaCompleto) {
      return [makeEvt(), makeEvt(), makeEvt(), makeEvt()];
    }

    const esMediaJornada = horas > 0 && horas <= 5;

    if (esMediaJornada) {
      const esTarde =
        rawJornada === "tarde" ||
        rawJornada === "media_tarde" ||
        rawJornada === "jornada_tarde";

      if (esTarde) {
        return [null, null, makeEvt(), makeEvt()];
      } else {
        return [makeEvt(), makeEvt(), null, null];
      }
    }

    if (esNoJustificada && horas === 0) {
      return [makeEvt(), makeEvt(), makeEvt(), makeEvt()];
    }

    return [makeEvt(), null, null, null];
  }

  // 🔹 CASO: justificación + marcajes en el mismo día (media jornada)
  const justMarcaje = marcajes.find((m) => m.justificacion);
  const hayMarcajesConHora = marcajes.some(
    (m) => m.horaIngreso || m.horaSalida
  );

  if (justMarcaje && hayMarcajesConHora && justMarcaje.justificacion) {
    const just = justMarcaje.justificacion;
    const horasJust = just.horas_compensadas ?? 0;
    const rawJornada =
      (just.jornada || just.tipo || "").toString().toLowerCase();

    const esMediaJornada = horasJust > 0 && horasJust <= 5;

    if (esMediaJornada) {
      const esTarde =
        rawJornada === "tarde" ||
        rawJornada === "media_tarde" ||
        rawJornada === "jornada_tarde";

      const slots: (EventoSlot | null)[] = [null, null, null, null];

      // Construimos eventos SOLO para los marcajes con hora
      const eventosMarcajes: EventoSlot[] = [];
      marcajes.forEach((m) => {
        if (m.horaIngreso) {
          eventosMarcajes.push({
            marcaje: m,
            tipo: "entrada",
            displayTime: m.horaIngreso,
          });
        }
        if (m.horaSalida) {
          eventosMarcajes.push({
            marcaje: m,
            tipo: "salida",
            displayTime: m.horaSalida,
          });
        }
      });

      eventosMarcajes.sort((a, b) => {
        const ta = timeToMinutes(a.displayTime);
        const tb = timeToMinutes(b.displayTime);
        if (ta === null && tb === null) return 0;
        if (ta === null) return -1;
        if (tb === null) return 1;
        return ta - tb;
      });

      const makeJustEvt = (): EventoSlot => ({
        marcaje: justMarcaje,
        tipo: "justificacion",
        displayTime: null,
      });

      if (esTarde) {
        // 👉 Mañana trabaja, tarde justificada
        if (eventosMarcajes[0]) slots[0] = eventosMarcajes[0];
        if (eventosMarcajes[1]) slots[1] = eventosMarcajes[1];
        slots[2] = makeJustEvt();
        slots[3] = makeJustEvt();
      } else {
        // 👉 Mañana justificada, tarde trabaja
        slots[0] = makeJustEvt();
        slots[1] = makeJustEvt();
        if (eventosMarcajes[0]) slots[2] = eventosMarcajes[0];
        if (eventosMarcajes[1]) slots[3] = eventosMarcajes[1];
      }

      return slots;
    }
    // Si no es media jornada, cae a lógica normal
  }

  // 🔹 LÓGICA NORMAL (marcajes con o sin justificación residual)
  const eventos: EventoSlot[] = [];

  marcajes.forEach((m) => {
    const hasIngreso = !!m.horaIngreso;
    const hasSalida = !!m.horaSalida;
    const hasJust = !!m.justificacion;

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

    if (!hasIngreso && !hasSalida && hasJust) {
      eventos.push({
        marcaje: m,
        tipo: "justificacion",
        displayTime: null,
      });
    }
  });

  if (eventos.length === 0) {
    return [null, null, null, null];
  }

  eventos.sort((a, b) => {
    const ta = timeToMinutes(a.displayTime);
    const tb = timeToMinutes(b.displayTime);

    if (ta === null && tb === null) return 0;
    if (ta === null) return -1;
    if (tb === null) return 1;
    return ta - tb;
  });

  // REGLA: 2 eventos y > 6h => primer y último recuadro
  if (eventos.length === 2) {
    const t1 = timeToMinutes(eventos[0].displayTime);
    const t2 = timeToMinutes(eventos[1].displayTime);

    if (t1 !== null && t2 !== null) {
      let diffMin = t2 - t1;
      if (diffMin < 0) diffMin += 24 * 60;
      const diffHoras = diffMin / 60;

      if (diffHoras > 6) {
        const slots: (EventoSlot | null)[] = [null, null, null, null];
        slots[0] = eventos[0];
        slots[3] = eventos[1];
        return slots;
      }
    }
  }

  // REGLA: si el primer evento con hora es después de las 12:00 → 3er recuadro
  let offset = 0;
  const firstWithTime = eventos.find((e) => e.displayTime);
  if (firstWithTime) {
    const mins = timeToMinutes(firstWithTime.displayTime);
    if (mins !== null && mins >= 12 * 60) {
      offset = 2;
    }
  }

  const result: (EventoSlot | null)[] = [null, null, null, null];
  let slotIndex = offset;
  for (let i = 0; i < eventos.length && slotIndex < 4; i++, slotIndex++) {
    result[slotIndex] = eventos[i];
  }

  return result;
};

// ----------------- COMPONENTE -----------------

function WeeklyAttendanceWidget() {
  const {
    asistenciaData, // { asistencias, resumen, periodo }
    estadisticas, // no se usa aquí, pero lo dejamos por si luego lo necesitas
    isLoading,
    error,
    fetchAsistencia,
    fetchEstadisticas,
    editarMarcaje,
    eliminarMarcaje,
    registrarMarcajeManual,
    isSemanaCerrada, // 👈 NUEVO: desde el contexto
  } = useAsistenciaContext() as any;

  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isWeekLocked, setIsWeekLocked] = useState(false); // 👈 NUEVO

  const [editing, setEditing] = useState<null | {
    id_marcaje: number;
    date: string;
    time: string;
    notes: string;
    campo: "entrada" | "salida";
  }>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Auto-dismiss del mensaje de error de edición después de unos segundos
  useEffect(() => {
    if (!editError) return;
    const timer = setTimeout(() => setEditError(null), 3000); // 5 segundos
    return () => clearTimeout(timer);
  }, [editError]);


  const [manualModal, setManualModal] = useState<{ date: string } | null>(
    null
  );
  const [manualError, setManualError] = useState<string | null>(null);

  // Auto-dismiss del mensaje de error de ingreso manual
  useEffect(() => {
    if (!manualError) return;
    const timer = setTimeout(() => setManualError(null), 5000);
    return () => clearTimeout(timer);
  }, [manualError]);

  // ---------- Cálculo semana ----------
  const getWeekRange = (date: Date) => {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    const day = base.getDay(); // 0=Domingo, 1=Lunes,...
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(23, 59, 59, 999);

    return { start: monday, end: saturday };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(referenceDate);

  // 🔹 Consultar si la semana está cerrada (reporte generado)
  useEffect(() => {
    const checkLock = async () => {
      try {
        if (!isSemanaCerrada) {
          setIsWeekLocked(false);
          return;
        }
        const inicio = weekStart.toISOString().substring(0, 10);
        const fin = weekEnd.toISOString().substring(0, 10);
        const cerrada = await isSemanaCerrada(inicio, fin);
        setIsWeekLocked(!!cerrada);
      } catch (err) {
        console.error("Error al consultar estado de semana:", err);
        setIsWeekLocked(false);
      }
    };

    checkLock();
  }, [weekStart, weekEnd, isSemanaCerrada]);

  // Cargar asistencia del mes correspondiente a la semana de referencia
  useEffect(() => {
    const mes = referenceDate.getMonth() + 1;
    const anio = referenceDate.getFullYear();

    if (
      !asistenciaData ||
      asistenciaData.periodo?.mes !== mes ||
      asistenciaData.periodo?.anio !== anio
    ) {
      fetchAsistencia(mes, anio);
      fetchEstadisticas?.(mes, anio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceDate]);

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
      totalHoras: formatHorasMinutos(totalHoras),
      status: getStatusFromDay(totalHoras, marcajesDia),
    });
  }

  const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange(
    new Date()
  );
  const isCurrentWeek =
    weekStart.toDateString() === currentWeekStart.toDateString() &&
    weekEnd.toDateString() === currentWeekEnd.toDateString();

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

  const handleRefresh = () => {
    const mes = asistenciaData?.periodo?.mes;
    const anio = asistenciaData?.periodo?.anio;

    if (mes && anio) {
      fetchAsistencia(mes, anio);
      fetchEstadisticas?.(mes, anio);
    } else {
      fetchAsistencia();
      fetchEstadisticas?.();
    }
  };

  // ---------- Handlers marcajes ----------

  const handleMarcajeClick = (
    marcaje: AsistenciaItem,
    tipoEvento: TipoEvento
  ) => {
    // 🔒 Bloqueo por semana cerrada
    if (isWeekLocked) {
      alert(
        "Esta semana ya tiene un reporte generado por el administrador.\nNo se pueden editar marcajes."
      );
      return;
    }

    if (!marcaje.id_marcaje) return;

    const fechaNorm = normalizeFecha(marcaje.fecha) || marcaje.fecha;

    let baseTime: string | null = null;
    let campo: "entrada" | "salida" = "entrada";

    if (tipoEvento === "entrada") {
      baseTime = marcaje.horaIngreso;
      campo = "entrada";
    } else if (tipoEvento === "salida") {
      baseTime = marcaje.horaSalida;
      campo = "salida";
    } else {
      baseTime = marcaje.horaIngreso || marcaje.horaSalida;
      campo = marcaje.horaSalida ? "salida" : "entrada";
    }

    setEditing({
      id_marcaje: marcaje.id_marcaje,
      date: fechaNorm,
      time: formatTimeForInput(baseTime),
      notes: marcaje.observacion || "",
      campo,
    });
  };

  const handleDeleteMarcaje = async (marcaje: AsistenciaItem) => {
    // 🔒 Bloqueo por semana cerrada
    if (isWeekLocked) {
      alert(
        "Esta semana ya tiene un reporte generado por el administrador.\nNo se pueden eliminar marcajes."
      );
      return;
    }

    if (!marcaje.id_marcaje) return;
    const ok = window.confirm(
      "¿Seguro que quieres eliminar este marcaje completo (entrada y salida)?"
    );
    if (!ok) return;
    await eliminarMarcaje(marcaje.id_marcaje);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    // 🔒 Bloqueo por semana cerrada (por si cambió mientras el modal estaba abierto)
    if (isWeekLocked) {
      alert(
        "Esta semana ya tiene un reporte generado por el administrador.\nNo se pueden editar marcajes."
      );
      return;
    }

    if (!editing.time) {
      alert("Debes ingresar la hora");
      return;
    }

    setEditError(null);
    const result = await editarMarcaje({
      id_marcaje: editing.id_marcaje,
      date: editing.date,
      time: editing.time,
      notes: editing.notes || undefined,
      campo: editing.campo,
    });

    if (!result || !result.success) {
      // Mostrar mensaje de error devuelto por el backend
      setEditError(result?.message || 'Error editando marcaje');
      return; // mantener modal abierto para que el usuario corrija
    }

    // Éxito
    setEditError(null);
    setEditing(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualModal) return;

    // 🔒 Bloqueo por semana cerrada
    if (isWeekLocked) {
      alert(
        "Esta semana ya tiene un reporte generado por el administrador.\nNo se pueden agregar nuevos marcajes."
      );
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const date = manualModal.date;
    const checkInTime = (formData.get("checkInTime") as string) || "";

    if (!checkInTime) {
      alert("Debes ingresar la hora del marcaje");
      return;
    }

    setManualError(null);
    const result = await registrarMarcajeManual({
      date,
      checkInTime,
      notes: (formData.get("notes") as string) || "",
      location: null,
      activityType: null,
      id_totem: null,
    });

    if (!result || !result.success) {
      setManualError(result?.message || 'Error registrando marcaje');
      return; // mantener modal abierto para corrección
    }

    setManualError(null);
    setManualModal(null);
  };

  // ---------- Estados básicos ----------

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

  if (error && !asistenciaData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 text-center">
        <p className="text-sm text-red-600">
          Error al cargar la asistencia semanal: {error}
        </p>
        <button
          onClick={handleRefresh}
          className="mt-3 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ---------- RENDER ----------

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

            {isWeekLocked && (
              <p className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] border border-red-200">
                <Shield className="w-3 h-3 mr-1" />
                Semana bloqueada: reporte generado por administración
              </p>
            )}
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
              onClick={() => {
                if (isWeekLocked) {
                  alert(
                    "Esta semana ya tiene un reporte generado por el administrador.\nNo se pueden agregar nuevos marcajes."
                  );
                  return;
                }
                setManualModal({
                  date: new Date().toISOString().substring(0, 10),
                });
              }}
              disabled={isWeekLocked}
              className={`ml-2 hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border ${
                isWeekLocked
                  ? "border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
              }`}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Ingreso manual
            </button>
          </div>
        </div>

        {/* Tabla Lunes–Sábado */}
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

                  let label = "";
                  if (evento.tipo === "justificacion") {
                    label = marcaje.justificacion?.es_justificada
                      ? "Justificada"
                      : "Injustificada";
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
                        onClick={() =>
                          handleMarcajeClick(marcaje, evento.tipo)
                        }
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(status)}
                          <span className="font-medium truncate">{label}</span>
                        </div>

                        {isEditable && !isWeekLocked && (
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
                  {dia.totalHoras !== "0:00" && dia.totalHoras !== "0:0" ? `${dia.totalHoras} hrs` : "0 hrs"}
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
              Editar{" "}
              {editing.campo === "entrada"
                ? "hora de entrada"
                : "hora de salida"}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="mb-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-800">{editError}</div>
                </div>
              )}
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {editing.campo === "entrada"
                    ? "Hora de entrada"
                    : "Hora de salida"}
                </label>
                <TimeInput
                  value={editing.time}
                  onChange={(value) =>
                    setEditing({ ...editing, time: value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
              {manualError && (
                <div className="mb-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-800">{manualError}</div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={manualModal.date}
                  onChange={(e) =>
                    setManualModal({ date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hora del marcaje
                </label>
                <input
                  name="checkInTime"
                  type="time"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Solo se registra una hora de marcaje. El sistema determinará
                  si es entrada, salida a colación, vuelta de colación o fin de
                  jornada.
                </p>
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
}

export default WeeklyAttendanceWidget;
