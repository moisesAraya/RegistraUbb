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

// 🔹 Helper: time → minutos desde medianoche
const timeToMinutes = (timeString: string | null): number | null => {
  if (!timeString) return null;
  const parts = timeString.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
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

// 🔹 Aplica la regla de descuento de 30 minutos si corresponde (para GENERAL - solo si se necesitara en otro punto)
const applyMarcajeDescuentoGeneral = (marcajes: any[]): number => {
  if (marcajes.length === 2) {
    const [m1, m2] = marcajes;
    const hora1 = m1.horaIngreso || m1.horaSalida;
    const hora2 = m2.horaIngreso || m2.horaSalida;
    const diff = Math.abs(diffMinutes(hora1, hora2));
    if (diff >= 360) {
      const total = (m1.horasTrabajadas || 0) + (m2.horasTrabajadas || 0);
      return Math.max(total - 0.5, 0);
    }
  }
  return marcajes.reduce((sum, m) => sum + (m.horasTrabajadas || 0), 0);
};

// ===================== HELPERS PARA REPORTE PERSONAL =====================

// 🔹 Calcula horas de trabajo reales (sin justificación) para un día
const computeHorasTrabajo = (detalle: any): number => {
  let horas = 0;
  const marcajesRaw = Array.isArray(detalle.marcajes_raw)
    ? detalle.marcajes_raw
    : [];

  if (marcajesRaw.length > 0) {
    marcajesRaw.forEach((m: any) => {
      const mins = diffMinutes(m.hora_entrada, m.hora_salida);
      if (mins > 0) horas += mins / 60;
    });

    // Si hay SOLO un marcaje continuo y son ≥ 6h → restar 0.5h de colación SOLO si no hay justificación
    if (
      marcajesRaw.length === 1 &&
      horas >= 6 &&
      !(detalle.justificacion && detalle.justificacion.es_justificada)
    ) {
      horas = Math.max(horas - 0.5, 0);
    }
  } else {
    // Fallback: usar horas de mañana/tarde del detalle
    const hManana = Number(detalle.manana?.horas || 0);
    const hTarde = Number(detalle.tarde?.horas || 0);
    horas = hManana + hTarde;

    // Si sólo tiene mañana y jornada larga → restar 0.5h SOLO si no hay justificación
    if (!detalle.tarde || Number(detalle.tarde?.horas || 0) === 0) {
      if (
        horas >= 6 &&
        !(detalle.justificacion && detalle.justificacion.es_justificada)
      )
        horas = Math.max(horas - 0.5, 0);
    }
  }

  return Math.round(horas * 100) / 100;
};

// 🔹 Calcula horas totales del día (trabajo + justificación)
const computeHorasDiaFromDetalle = (detalle: any): number => {
  const horasTrabajo = computeHorasTrabajo(detalle);
  let horasJust = 0;

  if (detalle.justificacion && detalle.justificacion.es_justificada) {
    horasJust =
      Number(detalle.justificacion.horas_compensadas || 0) > 0
        ? Number(detalle.justificacion.horas_compensadas || 0)
        : 0;
  }

  const total = horasTrabajo + horasJust;
  return Math.round(total * 100) / 100;
};

// 🔹 Construye slots [M-E, M-S, T-E, T-S] a partir de JUST + marcajes_raw
const buildSlotsFromDetalle = (detalle: any): string[] => {
  const slots = ["X", "X", "X", "X"]; // [M-E, M-S, T-E, T-S]

  const manana = detalle.manana || {};
  const tarde = detalle.tarde || {};

  // 1) JUST por mañana/tarde
  if (manana.entrada === "JUST" || manana.salida === "JUST") {
    slots[0] = "JUST";
    slots[1] = "JUST";
  }
  if (tarde.entrada === "JUST" || tarde.salida === "JUST") {
    slots[2] = "JUST";
    slots[3] = "JUST";
  }

  // 2) Colocar marcajes reales según hora y tipo (entrada/salida)
  const placeEvent = (tipo: "entrada" | "salida", time: string) => {
    const mins = timeToMinutes(time);
    if (mins === null) return;
    const isMorning = mins < 12 * 60;
    const value = formatHora(time);

    if (isMorning) {
      if (tipo === "entrada") {
        if (slots[0] === "X") slots[0] = value;
        else if (slots[1] === "X") slots[1] = value;
      } else {
        if (slots[1] === "X") slots[1] = value;
        else if (slots[0] === "X") slots[0] = value;
      }
    } else {
      if (tipo === "entrada") {
        if (slots[2] === "X") slots[2] = value;
        else if (slots[3] === "X") slots[3] = value;
      } else {
        if (slots[3] === "X") slots[3] = value;
        else if (slots[2] === "X") slots[2] = value;
      }
    }
  };

  const marcajesRaw = Array.isArray(detalle.marcajes_raw)
    ? detalle.marcajes_raw
    : [];

  marcajesRaw.forEach((m: any) => {
    if (m.hora_entrada) placeEvent("entrada", m.hora_entrada);
    if (m.hora_salida) placeEvent("salida", m.hora_salida);
  });

  return slots;
};

// 🔹 Construye estado de la fila (Presente / Falta Justificada / Falta No Justificada / Falta)
const buildEstadoFromDetalle = (detalle: any): string => {
  if (detalle.justificacion) {
    const motivoFmt = formatMotivo(detalle.justificacion.motivo);
    return detalle.justificacion.es_justificada
      ? `Falta Justificada: ${motivoFmt}`
      : `Falta No Justificada: ${motivoFmt}`;
  }

  if (detalle.estado) {
    const est = detalle.estado.toString().toLowerCase();
    if (est === "presente") return "Presente";
    if (est === "falta") return "Falta";
    return formatMotivo(detalle.estado);
  }

  const h = computeHorasDiaFromDetalle(detalle);
  if (h <= 0) return "Falta";

  return "Presente";
};

// ===================================================================

export default function ReportsSection() {
  const { user } = useAuth();
  const { reporteActual, obtenerReporteSemanal, loading } = useReportes();

  useEffect(() => {
    console.log("reporteActual:", reporteActual);
  }, [reporteActual]);

  const [tipoFiltro, setTipoFiltro] = useState<"mes" | "rango">("mes");
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<string>("todos");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [adminInfo, setAdminInfo] = useState<AdminInfo>(() => {
    if (user) {
      const cargoName =
        user.cargo?.nombre_cargo ||
        (user.id_rol === 1 ? "Administrador" : "Académico");
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

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/usuarios`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const lista: Usuario[] = data.data || [];
        setUsuarios(lista);

        const director = lista.find(
          (u) =>
            u.cargo?.nombre_cargo &&
            u.cargo.nombre_cargo.toLowerCase().includes("director")
        );

        if (director) {
          setAdminInfo({
            nombre: `${director.nombres} ${director.apellidos}`,
            rut: director.rut_usuario,
            cargo: director.cargo?.nombre_cargo || "Director de Departamento",
          });
        } else if (user) {
          const cargoName =
            user.cargo?.nombre_cargo ||
            (user.id_rol === 1 ? "Administrador" : "Académico");
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
      if (tipoFiltro === "mes") {
        if (esAdminActual) {
          if (usuarioSeleccionado === "todos") {
            obtenerReporteSemanal(mes, anio, undefined, true);
          } else {
            obtenerReporteSemanal(mes, anio, usuarioSeleccionado, false);
          }
        } else {
          obtenerReporteSemanal(mes, anio, undefined, false);
        }
      } else {
        if (fechaInicio && fechaFin) {
          if (esAdminActual) {
            if (usuarioSeleccionado === "todos") {
              obtenerReporteSemanal(
                undefined,
                undefined,
                undefined,
                true,
                fechaInicio,
                fechaFin
              );
            } else {
              obtenerReporteSemanal(
                undefined,
                undefined,
                usuarioSeleccionado,
                false,
                fechaInicio,
                fechaFin
              );
            }
          } else {
            obtenerReporteSemanal(
              undefined,
              undefined,
              undefined,
              false,
              fechaInicio,
              fechaFin
            );
          }
        }
      }
    };

    generarReporteAutomatico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tipoFiltro,
    mes,
    anio,
    fechaInicio,
    fechaFin,
    usuarioSeleccionado,
    user?.rut_usuario,
  ]);

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
      const nombreCargo =
        p.usuario?.cargo?.nombre_cargo || "Administrador";

      const dataRow: any[] = [nombreCompleto.trim()];
      let totalHorasUsuario = 0;

      if (esAdministrador) {
        fechasOrdenadas.forEach(() => {
          dataRow.push(
            `NO REGISTRA ASISTENCIA: ${nombreCargo}`,
            "",
            "",
            ""
          );
        });
        dataRow.push(`NO REGISTRA ASISTENCIA: ${nombreCargo}`);
      } else {
        fechasOrdenadas.forEach((fecha) => {
          const marcajesDia = asistenciasPorFecha.get(fecha) || [];
          if (marcajesDia.length === 1 && marcajesDia[0].justificacion) {
            const motivo = formatMotivo(
              marcajesDia[0].justificacion.motivo
            );
            dataRow.push(`Falta: ${motivo}`, "", "", "");
            totalHorasUsuario += computeHorasDiaFromDetalle(
              marcajesDia[0]
            );
          } else if (marcajesDia.length > 0) {
            const detalle = marcajesDia[0];
            const slots = buildSlotsFromDetalle(detalle);
            dataRow.push(...slots);
            totalHorasUsuario += computeHorasDiaFromDetalle(detalle);
          } else {
            dataRow.push("X", "X", "X", "X");
          }
        });

        dataRow.push(Math.round(totalHorasUsuario * 100) / 100);
        totalHorasGeneral += totalHorasUsuario;
      }

      const row = sheet.addRow(dataRow);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (typeof cell.value === "string") {
          if (cell.value.startsWith("Falta:")) {
            const asist =
              p.reporte?.asistencias_detalle || [];
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
          } else if (
            cell.value.includes("NO REGISTRA ASISTENCIA:")
          ) {
            cell.font = {
              color: { argb: "FF0066CC" },
              bold: true,
              size: 10,
            };
            cell.alignment = {
              horizontal: "center",
              vertical: "middle",
              wrapText: true,
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
    totalValueCell.value =
      Math.round(totalHorasGeneral * 100) / 100;

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
    for (let i = 2; i <= fechasOrdenadas.length * 4 + 1; i++) {
      sheet.getColumn(i).width = 8;
    }
    sheet.getColumn(fechasOrdenadas.length * 4 + 2).width = 12;

    sheet.addRow([]);
    const footerRow1 = sheet.addRow([
      `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`,
    ]);
    sheet.mergeCells(
      footerRow1.number,
      1,
      footerRow1.number,
      totalCols
    );
    footerRow1.getCell(1).alignment = { horizontal: "center" };
    footerRow1.getCell(1).font = { size: 10, italic: true };

    const footerRow2 = sheet.addRow([
      "Departamento de Sistemas de Información",
    ]);
    sheet.mergeCells(
      footerRow2.number,
      1,
      footerRow2.number,
      totalCols
    );
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
      nombreUsuario =
        user?.nombres || user?.rut_usuario || "Usuario";
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
      const fechaLocal = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      const fechaFormateada = fechaLocal.toLocaleDateString("es-CL");
      const diaSemana =
        detalle.dia_semana ||
        fechaLocal.toLocaleDateString("es-CL", { weekday: "long" });

      const slots = buildSlotsFromDetalle(detalle);
      const horasDia = computeHorasDiaFromDetalle(detalle);
      const estado = buildEstadoFromDetalle(detalle);

      totalHorasExcel += horasDia;
      if (horasDia > 0) diasTrabajadosExcel++;

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
          const esJustificada =
            just && just.es_justificada ? true : false;
          cell.font = {
            color: { argb: esJustificada ? "FF00AA00" : "FFFF0000" },
            bold: true,
          };
        }

        if (colNumber === 8 && typeof cell.value === "string") {
          if (cell.value.includes("Justificada:")) {
            cell.font = { color: { argb: "FF00AA00" }, bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE8F5E9" },
            };
          } else if (
            cell.value.includes("No Justificada:") ||
            cell.value === "Falta"
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

    const totalHorasExcelRounded =
      Math.round(totalHorasExcel * 100) / 100;
    const promedioExcel =
      diasTrabajadosExcel > 0
        ? Math.round(
            (totalHorasExcelRounded / diasTrabajadosExcel) * 100
          ) / 100
        : 0;

    sheet.addRow([]);
    const resumenRow = sheet.addRow([
      "RESUMEN",
      `Días trabajados: ${diasTrabajadosExcel}`,
      "",
      `Horas totales: ${totalHorasExcelRounded}`,
      "",
      `Promedio: ${promedioExcel} hrs/día`,
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
      { width: 40 },
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
      const nombreCargo =
        p.usuario?.cargo?.nombre_cargo || "Administrador";

      if (esAdministrador) {
        return [
          p.rut_usuario || "N/A",
          nombreCompleto.trim(),
          `NO REGISTRA: ${nombreCargo}`,
          `NO REGISTRA: ${nombreCargo}`,
          `NO REGISTRA: ${nombreCargo}`,
        ];
      } else {
        const asistencias = p.reporte?.asistencias_detalle || [];
        const totalHorasUsuario = asistencias.reduce(
          (sum: number, det: any) =>
            sum + computeHorasDiaFromDetalle(det),
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
            ? Math.round(
                (totalHorasUsuario / diasTrabajados) * 100
              ) / 100
            : 0;

        return [
          p.rut_usuario || "N/A",
          nombreCompleto.trim(),
          Math.round(totalHorasUsuario * 100) / 100,
          diasTrabajados,
          promedio,
        ];
      }
    });

    tableData.push([
      "",
      "TOTAL GENERAL",
      (Math.round(totalHorasGeneral * 100) / 100).toFixed(2),
      "",
      "",
    ]);

    autoTable(doc, {
      head: [["RUT", "Nombre", "Horas", "Días", "Promedio"]],
      body: tableData,
      startY: 32,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
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

    doc.save(
      `ReporteGeneral_${periodo.replace(/\s+/g, "_")}.pdf`
    );
  };

  // ================= EXPORTACIÓN PDF PERSONAL =================
  const exportarPDFPersonal = async () => {
    const doc = new jsPDF();

    let nombreUsuario = "";
    if (!isAdmin) {
      nombreUsuario =
        user?.nombres || user?.rut_usuario || "Usuario";
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
      const fechaLocal = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      const fechaFormateada = fechaLocal.toLocaleDateString("es-CL");
      const diaSemana =
        detalle.dia_semana ||
        fechaLocal.toLocaleDateString("es-CL", { weekday: "long" });

      const slots = buildSlotsFromDetalle(detalle);
      const horasDia = computeHorasDiaFromDetalle(detalle);
      const estado = buildEstadoFromDetalle(detalle);

      totalHorasPDF += horasDia;
      if (horasDia > 0) diasTrabajadosPDF++;

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
      head: [
        [
          "Fecha",
          "Día",
          "M-E",
          "M-S",
          "T-E",
          "T-S",
          "Hrs",
          "Estado",
        ],
      ],
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
        6: { cellWidth: 15 },
        7: {
          cellWidth: 40,
          cellPadding: 3,
          overflow: "linebreak",
        },
      },
      didParseCell: (data) => {
        const cellText = data.cell.text[0];
        const colIndex = data.column.index;

        if (cellText === "JUST") {
          const detalle = registros[data.row.index];
          const esJustificada =
            detalle?.justificacion?.es_justificada;
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
            cellText.includes("No Justificada:") ||
            cellText === "Falta"
          ) {
            data.cell.styles.textColor = [255, 0, 0];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    const totalHorasRounded =
      Math.round(totalHorasPDF * 100) / 100;
    const promedioPDF =
      diasTrabajadosPDF > 0
        ? Math.round(
            (totalHorasRounded / diasTrabajadosPDF) * 100
          ) / 100
        : 0;

    let finalY = (doc as any).lastAutoTable.finalY || 40;

    doc.setFontSize(12);
    doc.text("Resumen:", 14, finalY + 10);

    doc.setFontSize(10);
    doc.text(
      `Horas Totales: ${totalHorasRounded}`,
      14,
      finalY + 18
    );
    doc.text(
      `Días Trabajados: ${diasTrabajadosPDF}`,
      14,
      finalY + 26
    );
    doc.text(
      `Promedio Hrs/Día: ${promedioPDF}`,
      14,
      finalY + 34
    );
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

    doc.save(
      `Reporte_${nombreUsuario}_${periodo.replace(/\s+/g, "_")}.pdf`
    );
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
                  value="mes"
                  checked={tipoFiltro === "mes"}
                  onChange={() => setTipoFiltro("mes")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">
                  Por Mes
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

            {/* Filtros por mes */}
            {tipoFiltro === "mes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mes
                  </label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (m) => (
                        <option key={m} value={m}>
                          {new Date(2024, m - 1).toLocaleDateString(
                            "es-CL",
                            { month: "long" }
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Año
                  </label>
                  <select
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
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
                  onChange={(e) =>
                    setUsuarioSeleccionado(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="todos">
                    Reporte General - Todos los usuarios
                  </option>
                  <optgroup label="Reportes Individuales">
                    {usuarios
                      .filter((u) => u.id_rol !== 1)
                      .map((u) => (
                        <option
                          key={u.rut_usuario}
                          value={u.rut_usuario}
                        >
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
                    <p className="text-xs font-medium text-blue-700">
                      RUT
                    </p>
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
                disabled={!reporteActual || loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </button>

              <button
                onClick={handleExportPDF}
                disabled={!reporteActual || loading}
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
                        {reporteActual
                          .filter((r: any) => r.usuario?.id_rol !== 1)
                          .reduce((sum: number, r: any) => {
                            const asistencias =
                              r.reporte?.asistencias_detalle || [];
                            const horasUsuario =
                              asistencias.reduce(
                                (s: number, det: any) =>
                                  s + computeHorasDiaFromDetalle(det),
                                0
                              );
                            return sum + horasUsuario;
                          }, 0)
                          .toFixed(2)}{" "}
                        hrs
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
                        const horasUsuario =
                          asistencias.reduce(
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
                          (b._horasUsuario || 0) -
                          (a._horasUsuario || 0)
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
                                {r._horasUsuario || 0}
                                h
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {r.usuario?.nombres}{" "}
                              {r.usuario?.apellidos}
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
                  <p className="text-sm opacity-90 mb-1">
                    Total Horas
                  </p>
                  <p className="text-2xl font-bold">
                    {(reporteActual as any).resumen_basico
                      ?.horasTotales || 0}
                    h
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <Calendar className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">
                    Días Trabajados
                  </p>
                  <p className="text-2xl font-bold">
                    {(reporteActual as any).resumen_basico
                      ?.diasTrabajados || 0}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <FileText className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">
                    Promedio Horas/Día
                  </p>
                  <p className="text-2xl font-bold">
                    {(reporteActual as any).resumen_basico
                      ?.promedioHorasDia || 0}
                    h
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                  <Users className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Registros</p>
                  <p className="text-2xl font-bold">
                    {(reporteActual as any).asistencias_detalle
                      ?.length || 0}
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
