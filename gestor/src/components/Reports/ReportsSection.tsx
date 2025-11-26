import { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../Context/AuthContext";
import { useReportes } from "../../hooks/useReportes";
import {
  FileText,
  Calendar,
  Users,
  Clock,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  User,
  Building2,
  Award,
} from "lucide-react";

interface Usuario {
  rut_usuario: string;
  nombres: string;
  apellidos: string;
  id_rol: number;
  cargo?: {
    nombre_cargo: string;
  };
}

interface AdminInfo {
  nombre: string;
  rut: string;
  cargo: string;
}

// ==================== HELPERS GENERALES ====================
// Convierte horas decimales a formato HH:MM
function formatHorasMinutos(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

// 🔹 Helper: diferencia en minutos entre dos horas ("HH:MM[:SS]" o ISO)
const diffMinutes = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  let s: Date, e: Date;

  if (start.includes("T")) {
    s = new Date(start);
  } else {
    const [h, m] = start.split(":");
    s = new Date(2000, 0, 1, Number(h), Number(m));
  }

  if (end.includes("T")) {
    e = new Date(end);
  } else {
    const [h, m] = end.split(":");
    e = new Date(2000, 0, 1, Number(h), Number(m));
  }

  return (e.getTime() - s.getTime()) / 60000;
};

// 🔹 Helper: time → minutos desde medianoche (MISMA LÓGICA QUE WeeklyAttendanceWidget)
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

// 🔹 Helper: formatea "HH:MM[:SS]" a "HH:MM"
const formatHora = (hora: any) => {
  if (!hora || hora === "X" || hora === "JUST") return hora;
  if (typeof hora === "string" && hora.includes(":")) {
    return hora.substring(0, 5);
  }
  return hora;
};

// 🔹 Helper: motivo bonito (permiso_administrativo → Permiso administrativo)
const formatMotivo = (motivo?: string) => {
  if (!motivo) return "";
  const limpio = motivo.replace(/_/g, " ");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};


// ================== HELPERS TIPO Weekly PARA PERSONAL ==================

// Versión mínima del AsistenciaItem que necesitamos para slots
interface SlotAsistenciaItem {
  horaIngreso: string | null;
  horaSalida: string | null;
  justificacion?: {
    motivo: string;
    descripcion: string | null;
    es_justificada: boolean;
    horas_compensadas: number;
    tipo?: string;
    jornada?: string;
  } | null;
}

type TipoEvento = "entrada" | "salida" | "justificacion";

interface EventoSlot {
  marcaje: SlotAsistenciaItem;
  tipo: TipoEvento;
  displayTime: string | null;
}

/**
 * ⚠️ MISMA LÓGICA QUE buildEventosFromMarcajes DEL WeeklyAttendanceWidget
 * Construye los "eventos" a mostrar en los 4 slots de un día
 */
const buildEventosFromMarcajes = (
  marcajes: SlotAsistenciaItem[]
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

// ===================== HELPERS PARA REPORTE PERSONAL =====================

// 🔹 Calcula horas de trabajo reales (sin justificación) para un día
const computeHorasTrabajo = (detalle: any): number => {
  let minutos = 0;
  const marcajesRaw = Array.isArray(detalle.marcajes_raw)
    ? detalle.marcajes_raw
    : [];

  if (marcajesRaw.length > 0) {
    marcajesRaw.forEach((m: any) => {
      const mins = diffMinutes(m.hora_entrada, m.hora_salida);
      if (mins > 0) minutos += mins;
    });

    // Si hay SOLO un marcaje continuo y son ≥ 6h → restar 30 min de colación SOLO si no hay justificación
    if (
      marcajesRaw.length === 1 &&
      minutos >= 360 &&
      !(detalle.justificacion && detalle.justificacion.es_justificada)
    ) {
      minutos = Math.max(minutos - 30, 0);
    }
  } else {
    // Fallback: usar horas de mañana/tarde del detalle (ya vienen en horas)
    let horas =
      Number(detalle.manana?.horas || 0) +
      Number(detalle.tarde?.horas || 0);

    if (!detalle.tarde || Number(detalle.tarde?.horas || 0) === 0) {
      if (
        horas >= 6 &&
        !(detalle.justificacion && detalle.justificacion.es_justificada)
      ) {
        horas = Math.max(horas - 0.5, 0);
      }
    }

    minutos = horas * 60;
  }

  // devolvemos horas en decimal, pero SIN redondear todavía
  return minutos / 60;
};

// 🔹 Calcula horas totales del día (trabajo + justificación) SIN redondear
const computeHorasDiaFromDetalle = (detalle: any): number => {
  const horasTrabajo = computeHorasTrabajo(detalle);
  let horasJust = 0;

  if (detalle.justificacion && detalle.justificacion.es_justificada) {
    const hJust = Number(detalle.justificacion.horas_compensadas || 0) || 0;
    horasJust = hJust;
  }

  const total = horasTrabajo + horasJust;
  return total;
};

// 🔹 formatea Date a "YYYY-MM-DD"
const formatDateToISO = (dt: Date) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * 🔹 NUEVO: Construye slots [M-E, M-S, T-E, T-S] usando EXACTAMENTE
 * la misma lógica de WeeklyAttendanceWidget (buildEventosFromMarcajes),
 * pero a partir de detalle.marcajes_raw + detalle.justificacion.
 */
const buildSlotsFromDetalle = (detalle: any): string[] => {
  const slots = ["X", "X", "X", "X"]; // [M-E, M-S, T-E, T-S]

  // Construimos pseudo-marcajes en el mismo formato que usa WeeklyAttendanceWidget
  const pseudoMarcajes: SlotAsistenciaItem[] = [];

  const marcajesRaw = Array.isArray(detalle.marcajes_raw)
    ? detalle.marcajes_raw
    : [];

  marcajesRaw.forEach((m: any) => {
    pseudoMarcajes.push({
      // 👇 Aquí corregimos el desfase de +3 horas SOLO para exportar
      horaIngreso: adjustTimeMinusOffset(m.hora_entrada || null),
      horaSalida: adjustTimeMinusOffset(m.hora_salida || null),
      justificacion: null,
    });
  });

  if (detalle.justificacion) {
    pseudoMarcajes.push({
      horaIngreso: null,
      horaSalida: null,
      justificacion: detalle.justificacion,
    });
  }

  // Si no hay nada, devolvemos X
  if (pseudoMarcajes.length === 0) {
    return slots;
  }

  const eventos = buildEventosFromMarcajes(pseudoMarcajes);

  eventos.forEach((evento, idx) => {
    if (!evento) return;
    if (evento.tipo === "justificacion") {
      slots[idx] = "JUST";
    } else {
      slots[idx] = formatHora(evento.displayTime);
    }
  });

  return slots;
};

// 🔹 Construye estado de la fila (Presente / Ausencia Justificada / Ausencia Injustificada / Ausencia)
const buildEstadoFromDetalle = (detalle: any): string => {
  if (detalle.justificacion) {
    const motivoFmt = formatMotivo(detalle.justificacion.motivo);
    return detalle.justificacion.es_justificada
      ? `Ausencia Justificada: ${motivoFmt}`
      : `Ausencia Injustificada: ${motivoFmt}`;
  }

  if (detalle.estado) {
    const est = detalle.estado.toString().toLowerCase();
    if (est === "presente") return "Presente";
    if (est === "falta") return "Ausencia";
    return formatMotivo(detalle.estado);
  }

  const h = computeHorasDiaFromDetalle(detalle);
  if (h <= 0) return "Ausencia";

  return "Presente";
};

// 🔹 Helper: rango de semana (lunes–sábado) a partir de una fecha YYYY-MM-DD
const getWeekRange = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0 = dom, 1 = lun, ...
  const diffToMonday = (day + 6) % 7; // cuántos días retroceder hasta lunes
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  const end = new Date(start);
  // 🔸 Semana laboral: lunes a sábado
  end.setDate(start.getDate() + 5);

  const inicio = formatDateToISO(start);
  const fin = formatDateToISO(end);

  return { inicio, fin };
};

// ===================================================================

export default function ReportsSection() {
  const { user } = useAuth();
  const { reporteActual, obtenerReporteSemanal, loading } = useReportes();

  useEffect(() => {
    console.log("reporteActual:", reporteActual);
  }, [reporteActual]);

  const [tipoFiltro, setTipoFiltro] = useState<"semana" | "rango">("semana");
  const [tipoSemana, setTipoSemana] = useState<"actual" | "pasada">("actual");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<string>("todos");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Eliminado: lógica de disponibilidad de años/meses por reportes anuales

  const [adminInfo, setAdminInfo] = useState<AdminInfo>(() => {
    if (user) {
      const cargoName =
        user.id_rol === 1
          ? "Administrador"
          : user.id_rol === 2
          ? "Académico"
          : user.id_rol === 3
          ? "Jefe de Departamento"
          : "Usuario";
      return {
        nombre: `${user.nombres} ${user.apellidos}`,
        rut: user.rut_usuario,
        cargo: cargoName,
      };
    }
    return { nombre: "", rut: "", cargo: "" };
  });

  const isAdmin = user?.id_rol === 1;

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Obtener disponibilidad por año (solo para el usuario actual o cuando admin ve "todos")
  // Eliminado: useEffect para consultar reportes anuales y disponibilidad de años/meses

  // Eliminado: lógica de auto-selección de año/mes por disponibilidad anual

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const lista: Usuario[] = data.data || [];
        setUsuarios(lista);

        const director = lista.find(
          (u) => u.id_rol === 3 || u.id_rol === 1
        );

        if (director) {
          setAdminInfo({
            nombre: `${director.nombres} ${director.apellidos}`,
            rut: director.rut_usuario,
            cargo:
              director.id_rol === 3
                ? "Jefe de Departamento"
                : director.id_rol === 1
                ? "Administrador"
                : "Usuario",
          });
        } else if (user) {
          const cargoName =
            user.id_rol === 1
              ? "Administrador"
              : user.id_rol === 2
              ? "Académico"
              : user.id_rol === 3
              ? "Jefe de Departamento"
              : "Usuario";
          setAdminInfo({
            nombre: `${user.nombres} ${user.apellidos}`,
            rut: user.rut_usuario,
            cargo: cargoName,
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  // 🔹 Generación automática del reporte al cambiar filtros
  useEffect(() => {
    if (!user) return;

    const esAdminActual = user.id_rol === 1;

    const generarReporteAutomatico = () => {
      if (tipoFiltro === "semana") {
        const hoy = new Date();
        const base = new Date(hoy);
        if (tipoSemana === "pasada") {
          base.setDate(base.getDate() - 7);
        }
        const { inicio, fin } = getWeekRange(formatDateToISO(base));

        if (esAdminActual) {
          if (usuarioSeleccionado === "todos") {
            obtenerReporteSemanal(inicio, fin, undefined, true);
          } else {
            obtenerReporteSemanal(inicio, fin, usuarioSeleccionado, false);
          }
        } else {
          obtenerReporteSemanal(inicio, fin);
        }
      } else {
        // rango libre
        if (fechaInicio && fechaFin) {
          if (esAdminActual) {
            if (usuarioSeleccionado === "todos") {
              obtenerReporteSemanal(fechaInicio, fechaFin, undefined, true);
            } else {
              obtenerReporteSemanal(fechaInicio, fechaFin, usuarioSeleccionado, false);
            }
          } else {
            obtenerReporteSemanal(fechaInicio, fechaFin);
          }
        }
      }
    };

    generarReporteAutomatico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tipoFiltro,
    tipoSemana,
    fechaInicio,
    fechaFin,
    usuarioSeleccionado,
    user?.rut_usuario,
  ]);

  // 🔹 Rango visible para mostrar debajo de "Semana actual / pasada"
  const hoy = new Date();
  const rangoSemanaActual = getWeekRange(formatDateToISO(hoy));
  const basePasada = new Date(hoy);
  basePasada.setDate(basePasada.getDate() - 7);
  const rangoSemanaPasada = getWeekRange(formatDateToISO(basePasada));

  const handleExportExcel = async () => {
    if (!user) return alert("No hay usuario autenticado.");
    if (!reporteActual) {
      alert("Primero debes generar un reporte");
      return;
    }

    if (isAdmin && usuarioSeleccionado === "todos") {
      await exportarExcelGeneral();
    } else {
      await exportarExcelPersonal();
    }
  };

  const handleExportPDF = async () => {
    if (!user) return alert("No hay usuario autenticado.");
    if (!reporteActual) {
      alert("Primero debes generar un reporte");
      return;
    }

    if (isAdmin && usuarioSeleccionado === "todos") {
      await exportarPDFGeneral();
    } else {
      await exportarPDFPersonal();
    }
  };

  // Determina si el reporte actual tiene datos exportables
  const canExport = () => {
    if (!reporteActual) return false;
    if (Array.isArray(reporteActual)) {
      const total = reporteActual
        .filter((r: any) => r.usuario?.id_rol !== 1)
        .reduce((sum: number, r: any) => {
          const asistencias = r.reporte?.asistencias_detalle || [];
          const horasUsuario = asistencias.reduce(
            (s: number, det: any) => s + computeHorasDiaFromDetalle(det),
            0
          );
          return sum + horasUsuario;
        }, 0);
      return total > 0;
    } else {
      const resumen =
        (reporteActual as any).resumen_basico ||
        (reporteActual as any).resumen ||
        null;
      const horas = resumen?.horasTotales ?? resumen?.horas_totales ?? 0;
      const registros = (reporteActual as any).asistencias_detalle || [];
      return Number(horas) > 0 || registros.length > 0;
    }
  };

  // ================= EXPORTACIÓN EXCEL GENERAL =================
  const exportarExcelGeneral = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte General");

    sheet.mergeCells("A1:Z1");
    sheet.getCell("A1").value = "Reporte General de Asistencia";
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").font = { bold: true, size: 16 };

    const periodo =
      Array.isArray(reporteActual) && reporteActual[0]?.reporte?.periodo
        ? (reporteActual[0].reporte.periodo as any).nombre_periodo ||
          reporteActual[0].reporte.periodo.nombre_mes
        : "Sin período";

    sheet.mergeCells("A2:Z2");
    sheet.getCell("A2").value = `Período: ${periodo}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    const profesores = Array.isArray(reporteActual) ? reporteActual : [];

    if (profesores.length === 0) {
      sheet.addRow(["No hay datos para mostrar"]);
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `ReporteGeneral_${periodo.replace(/\s+/g, "_")}.xlsx`
      );
      return;
    }

    const fechasSet = new Set<string>();
    profesores.forEach((p: any) => {
      const asistencias = p.reporte?.asistencias_detalle || [];
      asistencias.forEach((a: any) => fechasSet.add(a.fecha));
    });
    const fechasOrdenadas = Array.from(fechasSet).sort();

    const headerRow1: any[] = ["Nombre"];
    const headerRow2: any[] = [""];
    const headerRow3: any[] = [""];

    fechasOrdenadas.forEach((fecha) => {
      const fechaObj = new Date(fecha + "T00:00:00");
      const diaSemana = fechaObj.toLocaleDateString("es-CL", {
        weekday: "short",
      });
      const diaNumero = fechaObj.getDate();

      headerRow1.push(diaSemana.toUpperCase(), "", "", "");
      headerRow2.push(`${diaNumero}`, "", "", "");
      headerRow3.push("M-E", "M-S", "T-E", "T-S");
    });

    headerRow1.push("Total Hrs");
    headerRow2.push("");
    headerRow3.push("");

    const row1 = sheet.addRow(headerRow1);
    const row2 = sheet.addRow(headerRow2);
    const row3 = sheet.addRow(headerRow3);

    [row1, row2, row3].forEach((row) => {
      row.font = { bold: true, color: { argb: "FFFFFFFF" } };
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const topHeaderRow = row1.number;
    const midHeaderRow = row2.number;
    const bottomHeaderRow = row3.number;

    let colIndex = 2;
    fechasOrdenadas.forEach(() => {
      sheet.mergeCells(topHeaderRow, colIndex, topHeaderRow, colIndex + 3);
      sheet.mergeCells(midHeaderRow, colIndex, midHeaderRow, colIndex + 3);
      colIndex += 4;
    });

    sheet.mergeCells(topHeaderRow, colIndex, bottomHeaderRow, colIndex);

    let totalHorasGeneral = 0;

    profesores.forEach((p: any) => {
      const nombreCompleto = p.usuario
        ? `${p.usuario.nombres || ""} ${p.usuario.apellidos || ""}`
        : "Sin nombre";

      const asistencias = p.reporte?.asistencias_detalle || [];
      const asistenciasPorFecha = new Map<string, any[]>();
      asistencias.forEach((a: any) => {
        if (!asistenciasPorFecha.has(a.fecha)) {
          asistenciasPorFecha.set(a.fecha, []);
        }
        const arr = asistenciasPorFecha.get(a.fecha);
        if (arr) arr.push(a);
      });

      const esAdministrador = p.usuario?.id_rol === 1;
      const dataRow: any[] = [nombreCompleto.trim()];

      let totalHorasUsuario = 0;

      if (esAdministrador) {
        // 🔸 Admin / usuario sin marcaje: mostrar NO REGISTRA en todas las celdas de la semana
        const msg = "NO REGISTRA";
        fechasOrdenadas.forEach(() => {
          dataRow.push(msg, msg, msg, msg);
        });
        dataRow.push(msg);
      } else {
        fechasOrdenadas.forEach((fecha) => {
          const marcajesDia = asistenciasPorFecha.get(fecha) || [];

          if (marcajesDia.length > 0) {
            // Usamos buildSlotsFromDetalle → MISMA LÓGICA QUE LA VISTA SEMANAL
            const detalle = marcajesDia[0];
            const slots = buildSlotsFromDetalle(detalle);
            dataRow.push(...slots);
            totalHorasUsuario += computeHorasDiaFromDetalle(detalle);
          } else {
            // Día sin marcajes ni justificación
            dataRow.push("X", "X", "X", "X");
          }
        });

        // Asegura que la columna de horas totales por usuario sea HH:MM
        dataRow.push(formatHorasMinutos(totalHorasUsuario));
        totalHorasGeneral += totalHorasUsuario;
      }

      const row = sheet.addRow(dataRow);

      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (typeof cell.value === "string") {
          if (cell.value.startsWith("Ausencia:")) {
            const asist = p.reporte?.asistencias_detalle || [];
            const justificacion = asist.find(
              (a: any) => a.justificacion
            )?.justificacion;

            if (justificacion?.es_justificada) {
              cell.font = {
                color: { argb: "FF00AA00" },
                bold: true,
              };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8F5E9" },
              };
            } else {
              cell.font = {
                color: { argb: "FFFF0000" },
                bold: true,
              };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFEBEE" },
              };
            }
          } else if (cell.value === "X") {
            cell.font = { color: { argb: "FFFF0000" }, bold: true };
          } else if (cell.value === "NO REGISTRA") {
            cell.font = {
              color: { argb: "FF0066CC" },
              bold: true,
              size: 10,
            };
          }
        }

        if (colNumber === 1) {
          cell.font = { bold: true };
          cell.alignment = {
            horizontal: "left",
            vertical: "middle",
          };
        }
      });
    });

    sheet.addRow([]);
    const totalCols = fechasOrdenadas.length * 4 + 2;
    const totalGeneralRow = sheet.addRow(["TOTAL GENERAL"]);
    const totalRowIndex = totalGeneralRow.number;

    sheet.mergeCells(totalRowIndex, 1, totalRowIndex, totalCols - 1);
    const totalLabelCell = sheet.getCell(totalRowIndex, 1);
    const totalValueCell = sheet.getCell(totalRowIndex, totalCols);

    totalLabelCell.value = "TOTAL GENERAL";
    totalValueCell.value = formatHorasMinutos(totalHorasGeneral);

    [totalLabelCell, totalValueCell].forEach((cell) => {
      cell.font = {
        bold: true,
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E7D32" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    sheet.getColumn(1).width = 25;
    // 🔸 Celdas más anchas
    for (let i = 2; i <= fechasOrdenadas.length * 4 + 1; i++) {
      sheet.getColumn(i).width = 11;
    }
    sheet.getColumn(fechasOrdenadas.length * 4 + 2).width = 18;

    sheet.addRow([]);
    const footerRow1 = sheet.addRow([
      `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`,
    ]);
    sheet.mergeCells(footerRow1.number, 1, footerRow1.number, totalCols);
    footerRow1.getCell(1).alignment = { horizontal: "center" };
    footerRow1.getCell(1).font = { size: 10, italic: true };

    const footerRow2 = sheet.addRow([
      "Departamento de Sistemas de Información",
    ]);
    sheet.mergeCells(footerRow2.number, 1, footerRow2.number, totalCols);
    footerRow2.getCell(1).alignment = { horizontal: "center" };
    footerRow2.getCell(1).font = {
      size: 10,
      color: { argb: "FF0066CC" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `ReporteGeneral_${periodo.replace(/\s+/g, "_")}.xlsx`
    );
  };

  // ================= EXPORTACIÓN EXCEL PERSONAL =================
  const exportarExcelPersonal = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte Personal");

    let nombreUsuario = "";
    if (!isAdmin) {
      nombreUsuario = user?.nombres || user?.rut_usuario || "Usuario";
    } else {
      const usuarioEncontrado = usuarios.find(
        (u) => u.rut_usuario === usuarioSeleccionado
      );
      nombreUsuario = usuarioEncontrado
        ? `${usuarioEncontrado.nombres} ${usuarioEncontrado.apellidos}`
        : usuarioSeleccionado;
    }

    const periodo =
      (reporteActual as any)?.periodo?.nombre_periodo ||
      (reporteActual as any)?.periodo?.nombre_mes ||
      "Sin período";

    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").value = `Reporte de ${nombreUsuario}`;
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").font = { bold: true, size: 16 };

    sheet.mergeCells("A2:H2");
    sheet.getCell("A2").value = `Período: ${periodo}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      "Fecha",
      "Día",
      "Mañana Entrada",
      "Mañana Salida",
      "Tarde Entrada",
      "Tarde Salida",
      "Horas Totales",
      "Estado",
    ]);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const registros = (reporteActual as any)?.asistencias_detalle || [];
    let totalHorasExcel = 0;
    let diasTrabajadosExcel = 0;

    registros.forEach((detalle: any) => {
      const [year, month, day] = detalle.fecha.split("-");
      // Ajusta la fecha local restando 3 horas
      const fechaLocal = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      fechaLocal.setHours(fechaLocal.getHours() - 3);
      const fechaFormateada = fechaLocal.toLocaleDateString("es-CL");
      const diaSemana =
        detalle.dia_semana ||
        fechaLocal.toLocaleDateString("es-CL", { weekday: "long" });

      const slots = buildSlotsFromDetalle(detalle); // 👈 MISMA LÓGICA QUE WEEKLY
      const horasDiaRaw = computeHorasDiaFromDetalle(detalle);
      const horasDia = formatHorasMinutos(horasDiaRaw); // mostrar como HH:MM
      const estado = buildEstadoFromDetalle(detalle);

      totalHorasExcel += horasDiaRaw; // 🔹 usamos valor crudo para sumar
      if (horasDiaRaw > 0) diasTrabajadosExcel++;

      const row = sheet.addRow([
        fechaFormateada,
        diaSemana,
        slots[0],
        slots[1],
        slots[2],
        slots[3],
        horasDia,
        estado,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (cell.value === "X") {
          cell.font = { color: { argb: "FFFF0000" }, bold: true };
        }

        if (cell.value === "JUST") {
          const just = detalle.justificacion;
          const esJustificada = just && just.es_justificada ? true : false;
          cell.font = {
            color: { argb: esJustificada ? "FF00AA00" : "FFFF0000" },
            bold: true,
          };
        }

        if (colNumber === 8 && typeof cell.value === "string") {
          const textVal = cell.value as string;
          if (textVal.includes("Justificada:")) {
            cell.font = { color: { argb: "FF00AA00" }, bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE8F5E9" },
            };
          } else if (
            textVal.includes("Injustificada:") ||
            textVal === "Ausencia"
          ) {
            cell.font = { color: { argb: "FFFF0000" }, bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFEBEE" },
            };
          }
        }
      });
    });

    // Usar formato HH:MM para totales y promedio
    const totalHorasExcelHHMM = formatHorasMinutos(totalHorasExcel);
    const promedioExcelHHMM = diasTrabajadosExcel > 0 ? formatHorasMinutos(totalHorasExcel / diasTrabajadosExcel) : "0:00";

    sheet.addRow([]);
    const resumenRow = sheet.addRow([
      "RESUMEN",
      `Días trabajados: ${diasTrabajadosExcel}`,
      "",
      `Horas totales: ${totalHorasExcelHHMM}`,
      "",
      `Promedio: ${promedioExcelHHMM} hrs/día`,
      "",
      "",
    ]);
    resumenRow.font = { bold: true };
    resumenRow.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    sheet.columns = [
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 45 },
    ];

    sheet.addRow([]);
    const footerRow1 = sheet.addRow([
      `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`,
    ]);
    sheet.mergeCells(footerRow1.number, 1, footerRow1.number, 8);
    footerRow1.getCell(1).alignment = { horizontal: "center" };
    footerRow1.getCell(1).font = { size: 10, italic: true };

    const footerRow2 = sheet.addRow([
      "Departamento de Sistemas de Información",
    ]);
    sheet.mergeCells(footerRow2.number, 1, footerRow2.number, 8);
    footerRow2.getCell(1).alignment = { horizontal: "center" };
    footerRow2.getCell(1).font = {
      size: 10,
      color: { argb: "FF0066CC" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Reporte_${nombreUsuario}_${periodo.replace(/\s+/g, "_")}.xlsx`
    );
  };

  // ================= EXPORTACIÓN PDF GENERAL =================
  const exportarPDFGeneral = async () => {
    const doc = new jsPDF();

    const periodo =
      Array.isArray(reporteActual) && reporteActual[0]?.reporte?.periodo
        ? (reporteActual[0].reporte.periodo as any).nombre_periodo ||
          reporteActual[0].reporte.periodo.nombre_mes
        : "Sin período";

    doc.setFontSize(18);
    doc.text("Reporte General de Asistencia", 105, 15, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.text(`Período: ${periodo}`, 105, 25, { align: "center" });

    const profesores = Array.isArray(reporteActual) ? reporteActual : [];
    let totalHorasGeneral = 0;

    const tableData = profesores.map((p: any) => {
      const nombreCompleto = p.usuario
        ? `${p.usuario.nombres || ""} ${p.usuario.apellidos || ""}`
        : "Sin nombre";

      const esAdministrador = p.usuario?.id_rol === 1;

      if (esAdministrador) {
        const msg = "NO REGISTRA";
        return [
          p.rut_usuario || "N/A",
          nombreCompleto.trim(),
          msg,
          msg,
          msg,
        ];
      } else {
        const asistencias = p.reporte?.asistencias_detalle || [];
        const totalHorasUsuario = asistencias.reduce(
          (sum: number, det: any) => sum + computeHorasDiaFromDetalle(det),
          0
        );
        totalHorasGeneral += totalHorasUsuario;

        const resumen = p.reporte?.resumen_basico;
        const diasTrabajados =
          resumen?.diasTrabajados ??
          asistencias.filter(
            (det: any) => computeHorasDiaFromDetalle(det) > 0
          ).length;
        const promedio =
          diasTrabajados > 0
            ? formatHorasMinutos(totalHorasUsuario / diasTrabajados)
            : "0:00";

        return [
          p.rut_usuario || "N/A",
          nombreCompleto.trim(),
          formatHorasMinutos(totalHorasUsuario),
          diasTrabajados,
          promedio,
        ];
      }
    });

    tableData.push([
      "",
      "TOTAL GENERAL",
      formatHorasMinutos(totalHorasGeneral),
      "",
      "",
    ]);

    autoTable(doc, {
      head: [["RUT", "Nombre", "Horas", "Días", "Promedio"]],
      body: tableData,
      startY: 32,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 55, overflow: "linebreak" },
        2: { cellWidth: 35, overflow: "linebreak" },
        3: { cellWidth: 20 },
        4: { cellWidth: 30, overflow: "linebreak" },
      },
      didParseCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [46, 125, 50];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(9);
    doc.text(
      `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`,
      105,
      finalY + 10,
      { align: "center" }
    );
    doc.setTextColor(0, 102, 204);
    doc.text(
      "Departamento de Sistemas de Información",
      105,
      finalY + 16,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);

    doc.save(`ReporteGeneral_${periodo.replace(/\s+/g, "_")}.pdf`);
  };

  // ================= EXPORTACIÓN PDF PERSONAL =================
  const exportarPDFPersonal = async () => {
    const doc = new jsPDF();

    let nombreUsuario = "";
    if (!isAdmin) {
      nombreUsuario = user?.nombres || user?.rut_usuario || "Usuario";
    } else {
      const usuarioEncontrado = usuarios.find(
        (u) => u.rut_usuario === usuarioSeleccionado
      );
      nombreUsuario = usuarioEncontrado
        ? `${usuarioEncontrado.nombres} ${usuarioEncontrado.apellidos}`
        : usuarioSeleccionado;
    }

    const periodo =
      (reporteActual as any)?.periodo?.nombre_periodo ||
      (reporteActual as any)?.periodo?.nombre_mes ||
      "Sin período";

    doc.setFontSize(18);
    doc.text(`Reporte de ${nombreUsuario}`, 105, 15, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text(`Período: ${periodo}`, 105, 25, {
      align: "center",
    });

    const registros = (reporteActual as any)?.asistencias_detalle || [];

    let totalHorasPDF = 0;
    let diasTrabajadosPDF = 0;

    const tableData = registros.map((detalle: any) => {
      const [year, month, day] = detalle.fecha.split("-");
      // Ajusta la fecha local restando 3 horas
      const fechaLocal = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      fechaLocal.setHours(fechaLocal.getHours() - 3);
      const fechaFormateada = fechaLocal.toLocaleDateString("es-CL");
      const diaSemana =
        detalle.dia_semana ||
        fechaLocal.toLocaleDateString("es-CL", { weekday: "long" });

      const slots = buildSlotsFromDetalle(detalle);
      const horasDiaRaw = computeHorasDiaFromDetalle(detalle);
      const horasDia = formatHorasMinutos(horasDiaRaw);
      const estado = buildEstadoFromDetalle(detalle);

      totalHorasPDF += horasDiaRaw;
      if (horasDiaRaw > 0) diasTrabajadosPDF++;

      return [
        fechaFormateada,
        diaSemana,
        slots[0],
        slots[1],
        slots[2],
        slots[3],
        horasDia,
        estado,
      ];
    });

    autoTable(doc, {
      head: [["Fecha", "Día", "M-E", "M-S", "T-E", "T-S", "Hrs", "Estado"]],
      body: tableData,
      startY: 32,
      theme: "grid",
      headStyles: {
        fillColor: [66, 139, 202],
        fontSize: 8,
        halign: "center",
      },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 22 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 14 },
        7: { cellWidth: 60, cellPadding: 3, overflow: "linebreak" },
      },
      didParseCell: (data) => {
        const cellText = data.cell.text[0];
        const colIndex = data.column.index;

        if (cellText === "JUST") {
          const detalle = registros[data.row.index];
          const esJustificada = detalle?.justificacion?.es_justificada;
          data.cell.styles.textColor = esJustificada
            ? [0, 170, 0]
            : [255, 0, 0];
          data.cell.styles.fontStyle = "bold";
        }

        if (colIndex === 7 && typeof cellText === "string") {
          if (cellText.includes("Justificada:")) {
            data.cell.styles.textColor = [0, 170, 0];
            data.cell.styles.fontStyle = "bold";
          } else if (
            cellText.includes("Injustificada:") ||
            cellText === "Ausencia"
          ) {
            data.cell.styles.textColor = [255, 0, 0];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    const totalHorasPDFHHMM = formatHorasMinutos(totalHorasPDF);
    const promedioPDF = diasTrabajadosPDF > 0 ? formatHorasMinutos(totalHorasPDF / diasTrabajadosPDF) : "0:00";
    let finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(12);
    doc.text("Resumen:", 14, finalY + 10);
    doc.setFontSize(10);
    doc.text(`Horas Totales: ${totalHorasPDFHHMM}`, 14, finalY + 18);
    doc.text(`Días Trabajados: ${diasTrabajadosPDF}`, 14, finalY + 26);
    doc.text(`Promedio Hrs/Día: ${promedioPDF}`, 14, finalY + 34);
    finalY = finalY + 34;

    doc.setFontSize(9);
    doc.text(
      `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`,
      105,
      finalY + 12,
      { align: "center" }
    );
    doc.setTextColor(0, 102, 204);
    doc.text(
      "Departamento de Sistemas de Información",
      105,
      finalY + 18,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);

    doc.save(`Reporte_${nombreUsuario}_${periodo.replace(/\s+/g, "_")}.pdf`);
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <FileText className="h-7 w-7 text-blue-600 mr-3" />
                Reportes de Asistencia
              </h1>
              <p className="text-slate-600 mt-1">
                {isAdmin
                  ? "Gestiona y visualiza reportes de todos los usuarios"
                  : "Consulta tu historial de asistencia"}
              </p>
              <p className="text-slate-500 text-sm">
                {user?.nombres} {user?.apellidos} |{" "}
                {isAdmin ? "Administrador" : "Académico"}
              </p>
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            Filtros de Búsqueda
          </h2>

          <div className="space-y-4">
            {/* Tipo de filtro */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="semana"
                  checked={tipoFiltro === "semana"}
                  onChange={() => setTipoFiltro("semana")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">
                  Semana (actual / pasada)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="rango"
                  checked={tipoFiltro === "rango"}
                  onChange={() => setTipoFiltro("rango")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">
                  Rango de Fechas
                </span>
              </label>
            </div>

            {/* Filtro por semana (actual/pasada) */}
            {tipoFiltro === "semana" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selecciona la semana
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setTipoSemana("actual")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        tipoSemana === "actual"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      Semana actual
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoSemana("pasada")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        tipoSemana === "pasada"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      Semana pasada
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {tipoSemana === "actual" ? (
                      <>
                        Semana actual:{" "}
                        {new Date(
                          rangoSemanaActual.inicio + "T00:00:00"
                        ).toLocaleDateString("es-CL")}{" "}
                        al{" "}
                        {new Date(
                          rangoSemanaActual.fin + "T00:00:00"
                        ).toLocaleDateString("es-CL")}
                      </>
                    ) : (
                      <>
                        Semana pasada:{" "}
                        {new Date(
                          rangoSemanaPasada.inicio + "T00:00:00"
                        ).toLocaleDateString("es-CL")}{" "}
                        al{" "}
                        {new Date(
                          rangoSemanaPasada.fin + "T00:00:00"
                        ).toLocaleDateString("es-CL")}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Filtros por rango */}
            {tipoFiltro === "rango" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Selector de usuario (solo admin) */}
            {isAdmin ? (
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  Seleccionar Reporte
                </label>
                <select
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="todos">
                    Reporte General - Todos los usuarios
                  </option>
                  <optgroup label="Reportes Individuales">
                    {usuarios
                      .filter((u) => u.id_rol !== 1)
                      .map((u) => (
                        <option key={u.rut_usuario} value={u.rut_usuario}>
                          {u.nombres} {u.apellidos} ({u.rut_usuario})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            ) : null}

            {/* Info del firmante */}
            {isAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Informe emitido a nombre de
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      Nombre
                    </p>
                    <p className="mt-0.5 text-blue-900 font-semibold">
                      {adminInfo.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">RUT</p>
                    <p className="mt-0.5 text-blue-900 font-semibold">
                      {adminInfo.rut}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      Cargo
                    </p>
                    <p className="mt-0.5 text-blue-900 font-semibold">
                      {adminInfo.cargo}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-blue-700">
                  <Building2 className="h-3 w-3 mr-1" />
                  <span className="font-medium">
                    Departamento de Sistemas de Información
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de exportación */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            {loading && (
              <div className="mb-4 flex items-center gap-2 text-blue-600 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generando reporte automáticamente...</span>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleExportExcel}
                disabled={!reporteActual || loading || !canExport()}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </button>

              <button
                onClick={handleExportPDF}
                disabled={!reporteActual || loading || !canExport()}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
              >
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        {/* Resumen estadístico */}
        {reporteActual && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              Estadísticas del Reporte
            </h3>

            {Array.isArray(reporteActual) ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">
                        Total de Horas (Todos los Usuarios)
                      </p>
                      <p className="text-4xl font-bold">
                        {formatHorasMinutos(
                          reporteActual
                            .filter((r: any) => r.usuario?.id_rol !== 1)
                            .reduce((sum: number, r: any) => {
                              const asistencias =
                                r.reporte?.asistencias_detalle || [];
                              const horasUsuario = asistencias.reduce(
                                (s: number, det: any) =>
                                  s + computeHorasDiaFromDetalle(det),
                                0
                              );
                              return sum + horasUsuario;
                            }, 0)
                        )} hrs
                      </p>
                      <p className="text-blue-100 text-xs mt-2">
                        {
                          reporteActual.filter(
                            (r: any) => r.usuario?.id_rol !== 1
                          ).length
                        }{" "}
                        usuarios registrados
                      </p>
                    </div>
                    <Clock className="h-16 w-16 text-blue-200 opacity-50" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Top 3 - Más Horas Trabajadas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reporteActual
                      .filter((r: any) => r.usuario?.id_rol !== 1)
                      .map((r: any) => {
                        const asistencias =
                          r.reporte?.asistencias_detalle || [];
                        const horasUsuario = asistencias.reduce(
                          (s: number, det: any) =>
                            s + computeHorasDiaFromDetalle(det),
                          0
                        );
                        return {
                          ...r,
                          _horasUsuario: horasUsuario,
                        };
                      })
                      .sort(
                        (a: any, b: any) =>
                          (b._horasUsuario || 0) - (a._horasUsuario || 0)
                      )
                      .slice(0, 3)
                      .map((r: any, idx: number) => {
                        const borderClass =
                          idx === 0
                            ? "bg-yellow-50 border-yellow-300"
                            : idx === 1
                            ? "bg-slate-50 border-slate-300"
                            : "bg-orange-50 border-orange-300";

                        const rankColors =
                          idx === 0
                            ? "bg-yellow-500 text-white"
                            : idx === 1
                            ? "bg-slate-500 text-white"
                            : "bg-orange-500 text-white";

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 ${borderClass}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rankColors}`}
                                >
                                  #{idx + 1}
                                </span>
                                <Award className="h-5 w-5 text-yellow-600" />
                              </div>
                              <span className="text-lg font-bold text-blue-600">
                                {formatHorasMinutos(r._horasUsuario || 0)}
                                h
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {r.usuario?.nombres} {r.usuario?.apellidos}
                            </p>
                            <p className="text-xs text-slate-600">
                              {r.usuario?.rut_usuario}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <Clock className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Total Horas</p>
                  <p className="text-2xl font-bold">
                    {formatHorasMinutos((reporteActual as any).resumen_basico?.horasTotales || 0)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <Calendar className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Días Trabajados</p>
                  <p className="text-2xl font-bold">
                    {(reporteActual as any).resumen_basico?.diasTrabajados ||
                      0}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <FileText className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">
                    Promedio Horas/Día
                  </p>
                  <p className="text-2xl font-bold">
                    {formatHorasMinutos((reporteActual as any).resumen_basico?.promedioHorasDia || 0)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                  <Users className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Registros</p>
                  <p className="text-2xl font-bold">
                    {(reporteActual as any).asistencias_detalle?.length || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 🔹 Helper: ajusta una hora restando 3 horas (para corregir desfase del servidor)
const adjustTimeMinusOffset = (
  time: string | null,
  offsetMinutes = 240
): string | null => {
  if (!time) return null;

  try {
    // Caso ISO: "2025-11-26T15:30:00"
    if (time.includes("T")) {
      const d = new Date(time);
      d.setMinutes(d.getMinutes() - offsetMinutes);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }

    // Caso "HH:MM" o "HH:MM:SS"
    const parts = time.split(":");
    if (parts.length < 2) return time;

    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return time;

    let total = h * 60 + m - offsetMinutes;
    const DAY = 24 * 60;
    // Normalizamos al rango [0, 24h)
    total = ((total % DAY) + DAY) % DAY;

    const hh = String(Math.floor(total / 60)).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return time;
  }
};
