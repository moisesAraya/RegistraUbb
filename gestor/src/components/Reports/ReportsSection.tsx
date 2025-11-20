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
  Award
} from 'lucide-react';

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

export default function ReportsSection() {
  const { user } = useAuth();
  const { reporteActual, obtenerReporteSemanal, loading } = useReportes();
  
  useEffect(() => {
    console.log('reporteActual:', reporteActual);
  }, [reporteActual]);
  
  const [tipoFiltro, setTipoFiltro] = useState<'mes' | 'rango'>('mes');
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>("mi-reporte");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    nombre: user?.nombres || '',
    rut: user?.rut_usuario || '',
    cargo: 'Administrador'
  });
  
  const isAdmin = user?.id_rol === 1;

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const generarReporteAutomatico = async () => {
      if (tipoFiltro === 'mes') {
        if (usuarioSeleccionado === 'todos') {
          await obtenerReporteSemanal(mes, anio, undefined, true);
        } else if (usuarioSeleccionado === 'mi-reporte') {
          await obtenerReporteSemanal(mes, anio, undefined, false);
        } else {
          await obtenerReporteSemanal(mes, anio, usuarioSeleccionado, false);
        }
      } else {
        if (fechaInicio && fechaFin) {
          if (usuarioSeleccionado === 'todos') {
            await obtenerReporteSemanal(undefined, undefined, undefined, true, fechaInicio, fechaFin);
          } else if (usuarioSeleccionado === 'mi-reporte') {
            await obtenerReporteSemanal(undefined, undefined, undefined, false, fechaInicio, fechaFin);
          } else {
            await obtenerReporteSemanal(undefined, undefined, usuarioSeleccionado, false, fechaInicio, fechaFin);
          }
        }
      }
    };

    generarReporteAutomatico();
  }, [tipoFiltro, mes, anio, fechaInicio, fechaFin, usuarioSeleccionado, user]);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const handleExportExcel = async () => {
    if (!user) return alert("No hay usuario autenticado.");
    if (!reporteActual) {
      alert("Primero debes generar un reporte");
      return;
    }

    if (usuarioSeleccionado === 'todos') {
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

    if (usuarioSeleccionado === 'todos') {
      await exportarPDFGeneral();
    } else {
      await exportarPDFPersonal();
    }
  };

  // ================= EXPORTACIÓN EXCEL GENERAL =================
  const exportarExcelGeneral = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte General");

    // 🔹 Encabezado (solo título y período arriba)
    sheet.mergeCells("A1:Z1");
    sheet.getCell("A1").value = "Reporte General de Asistencia";
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").font = { bold: true, size: 16 };

    const periodo = Array.isArray(reporteActual) && reporteActual[0]?.reporte?.periodo
      ? (reporteActual[0].reporte.periodo as any).nombre_periodo || reporteActual[0].reporte.periodo.nombre_mes
      : "Sin período";
    
    sheet.mergeCells("A2:Z2");
    sheet.getCell("A2").value = `Período: ${periodo}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]); // Fila 3 (en blanco)

    const profesores = Array.isArray(reporteActual) ? reporteActual : [];
    
    if (profesores.length === 0) {
      sheet.addRow(["No hay datos para mostrar"]);
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `ReporteGeneral_${periodo.replace(/\s+/g, '_')}.xlsx`);
      return;
    }

    // Obtener todas las fechas únicas
    const fechasSet = new Set<string>();
    profesores.forEach((p: any) => {
      const asistencias = p.reporte?.asistencias_detalle || [];
      asistencias.forEach((a: any) => fechasSet.add(a.fecha));
    });
    const fechasOrdenadas = Array.from(fechasSet).sort();

    // Crear encabezados
    const headerRow1: any[] = ["Nombre"];
    const headerRow2: any[] = [""];
    const headerRow3: any[] = [""];

    fechasOrdenadas.forEach((fecha) => {
      const fechaObj = new Date(fecha + 'T00:00:00');
      const diaSemana = fechaObj.toLocaleDateString("es-CL", { weekday: "short" });
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

    // Merges dinámicos para encabezados
    const topHeaderRow = row1.number;
    const midHeaderRow = row2.number;
    const bottomHeaderRow = row3.number;

    let colIndex = 2;
    fechasOrdenadas.forEach(() => {
      sheet.mergeCells(topHeaderRow, colIndex, topHeaderRow, colIndex + 3);
      sheet.mergeCells(midHeaderRow, colIndex, midHeaderRow, colIndex + 3);
      colIndex += 4;
    });

    // Columna Total Hrs (merge vertical encabezado)
    sheet.mergeCells(topHeaderRow, colIndex, bottomHeaderRow, colIndex);

    // Agregar datos
    profesores.forEach((p: any) => {
      const nombreCompleto = p.usuario
        ? `${p.usuario.nombres || ''} ${p.usuario.apellidos || ''}`
        : "Sin nombre";
      
      const asistencias = p.reporte?.asistencias_detalle || [];
      const asistenciasPorFecha = new Map<string, any>();
      asistencias.forEach((a: any) => asistenciasPorFecha.set(a.fecha, a));

      const esAdministrador = p.usuario?.id_rol === 1;
      const nombreCargo = p.usuario?.cargo?.nombre_cargo || 'Administrador';

      const dataRow: any[] = [nombreCompleto.trim()];

      if (esAdministrador) {
        fechasOrdenadas.forEach(() => {
          dataRow.push(`NO REGISTRA ASISTENCIA: ${nombreCargo}`, "", "", "");
        });
        dataRow.push(`NO REGISTRA ASISTENCIA: ${nombreCargo}`);
      } else {
        fechasOrdenadas.forEach((fecha) => {
          const asistencia = asistenciasPorFecha.get(fecha);
          
          if (asistencia) {
            if (asistencia.justificacion) {
              const motivo = asistencia.justificacion.motivo;
              dataRow.push(`Falta: ${motivo}`, "", "", "");
            } else {
              dataRow.push(
                asistencia.manana?.entrada || "X",
                asistencia.manana?.salida || "X",
                asistencia.tarde?.entrada || "X",
                asistencia.tarde?.salida || "X"
              );
            }
          } else {
            dataRow.push("X", "X", "X", "X");
          }
        });

        const totalHoras = p.reporte?.resumen_basico?.horasTotales || 0;
        dataRow.push(totalHoras);
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

        if (typeof cell.value === 'string') {
          if (cell.value.startsWith('Falta:')) {
            const asistencias = p.reporte?.asistencias_detalle || [];
            const justificacion = asistencias.find((a: any) => a.justificacion)?.justificacion;
            
            if (justificacion?.es_justificada) {
              cell.font = { color: { argb: "FF00AA00" }, bold: true };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8F5E9" }
              };
            } else {
              cell.font = { color: { argb: "FFFF0000" }, bold: true };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFEBEE" }
              };
            }
          } else if (cell.value === "X") {
            cell.font = { color: { argb: "FFFF0000" }, bold: true };
          } else if (cell.value.includes('NO REGISTRA ASISTENCIA:')) {
            cell.font = { color: { argb: "FF0066CC" }, bold: true, size: 10 };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          }
        }

        if (colNumber === 1) {
          cell.font = { bold: true };
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      });
    });

    // ✅ TOTAL GENERAL
    sheet.addRow([]);
    const totalCols = fechasOrdenadas.length * 4 + 2;
    const totalGeneralRow = sheet.addRow(["TOTAL GENERAL"]);
    const totalRowIndex = totalGeneralRow.number;

    // Merge label en casi todas las columnas, dejando la última para el valor
    sheet.mergeCells(totalRowIndex, 1, totalRowIndex, totalCols - 1);
    const totalLabelCell = sheet.getCell(totalRowIndex, 1);
    const totalValueCell = sheet.getCell(totalRowIndex, totalCols);

    const totalHorasGeneral = profesores
      .filter((p: any) => p.usuario?.id_rol !== 1)
      .reduce((sum: number, p: any) => sum + (p.reporte?.resumen_basico?.horasTotales || 0), 0);
    
    totalLabelCell.value = "TOTAL GENERAL";
    totalValueCell.value = totalHorasGeneral.toFixed(2);

    [totalLabelCell, totalValueCell].forEach((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E7D32" }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Ajuste de anchos
    sheet.getColumn(1).width = 25;
    for (let i = 2; i <= fechasOrdenadas.length * 4 + 1; i++) {
      sheet.getColumn(i).width = 8;
    }
    sheet.getColumn(fechasOrdenadas.length * 4 + 2).width = 12;

    // ✅ PIE: info de quien genera
    sheet.addRow([]);
    const footerRow1 = sheet.addRow([
      `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`
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
      "Departamento de Sistemas de Información"
    ]);
    sheet.mergeCells(
      footerRow2.number,
      1,
      footerRow2.number,
      totalCols
    );
    footerRow2.getCell(1).alignment = { horizontal: "center" };
    footerRow2.getCell(1).font = { size: 10, color: { argb: "FF0066CC" } };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ReporteGeneral_${periodo.replace(/\s+/g, '_')}.xlsx`);
  };

  // ================= EXPORTACIÓN EXCEL PERSONAL =================
  const exportarExcelPersonal = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte Personal");

    let nombreUsuario = "";
    if (usuarioSeleccionado === 'mi-reporte' || !isAdmin) {
      nombreUsuario = user?.nombres || user?.rut_usuario || "Usuario";
    } else {
      const usuarioEncontrado = usuarios.find(u => u.rut_usuario === usuarioSeleccionado);
      nombreUsuario = usuarioEncontrado 
        ? `${usuarioEncontrado.nombres} ${usuarioEncontrado.apellidos}` 
        : usuarioSeleccionado;
    }

    const esAdministrador = user?.id_rol === 1 && (usuarioSeleccionado === 'mi-reporte' || !isAdmin);
    const nombreCargo = 'Administrador';

    const periodo = (reporteActual?.periodo as any)?.nombre_periodo || reporteActual?.periodo?.nombre_mes || "Sin período";

    // Encabezado simple
    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").value = `Reporte de ${nombreUsuario}`;
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").font = { bold: true, size: 16 };

    sheet.mergeCells("A2:H2");
    sheet.getCell("A2").value = `Período: ${periodo}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]); // Fila 3 en blanco

    if (esAdministrador) {
      // Caso admin: no registra asistencia
      sheet.mergeCells("A4:H4");
      sheet.getCell("A4").value = `NO REGISTRA ASISTENCIA: ${nombreCargo}`;
      sheet.getCell("A4").alignment = { horizontal: "center", vertical: "middle" };
      sheet.getCell("A4").font = { bold: true, size: 14, color: { argb: "FF0066CC" } };
      
      sheet.mergeCells("A5:H5");
      sheet.getCell("A5").value = "Los administradores no registran asistencia en el sistema.";
      sheet.getCell("A5").alignment = { horizontal: "center", vertical: "middle" };
      sheet.getCell("A5").font = { size: 12, color: { argb: "FF666666" } };

      // Pie de generador
      sheet.addRow([]);
      const footerRow1 = sheet.addRow([
        `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`
      ]);
      sheet.mergeCells(footerRow1.number, 1, footerRow1.number, 8);
      footerRow1.getCell(1).alignment = { horizontal: "center" };
      footerRow1.getCell(1).font = { size: 10, italic: true };

      const footerRow2 = sheet.addRow([
        "Departamento de Sistemas de Información"
      ]);
      sheet.mergeCells(footerRow2.number, 1, footerRow2.number, 8);
      footerRow2.getCell(1).alignment = { horizontal: "center" };
      footerRow2.getCell(1).font = { size: 10, color: { argb: "FF0066CC" } };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `ReportePersonal_${nombreUsuario.replace(/\s+/g, '_')}_${periodo.replace(/\s+/g, '_')}.xlsx`);
      return;
    }
    
    // Encabezado de tabla
    const headerRow = sheet.addRow([
      "Fecha", "Día", "Mañana Entrada", "Mañana Salida",
      "Tarde Entrada", "Tarde Salida", "Horas Totales", "Estado"
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

    const registros = reporteActual?.asistencias_detalle || [];
    registros.forEach((r: any) => {
      const [year, month, day] = r.fecha.split('-');
      const fechaLocal = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const fechaFormateada = fechaLocal.toLocaleDateString("es-CL");
      const diaSemana = fechaLocal.toLocaleDateString("es-CL", { weekday: 'long' });

      const formatHora = (hora: any) => {
        if (!hora || hora === 'X' || hora === 'JUST') return hora;
        if (typeof hora === 'string' && hora.includes(':')) {
          return hora.substring(0, 5);
        }
        return hora;
      };

      let estado = "Presente";
      const todoVacio =
        (r.manana?.entrada === 'X' || !r.manana?.entrada) && 
        (r.manana?.salida === 'X' || !r.manana?.salida) &&
        (r.tarde?.entrada === 'X' || !r.tarde?.entrada) &&
        (r.tarde?.salida === 'X' || !r.tarde?.salida);

      if (r.justificacion) {
        estado = r.justificacion.es_justificada 
          ? `Falta Justificada: ${r.justificacion.motivo}`
          : `Falta No Justificada: ${r.justificacion.motivo}`;
      } else if (todoVacio) {
        estado = "Falta";
      }

      const row = sheet.addRow([
        fechaFormateada,
        diaSemana,
        formatHora(r.manana?.entrada),
        formatHora(r.manana?.salida),
        formatHora(r.tarde?.entrada),
        formatHora(r.tarde?.salida),
        r.horas_totales || 0,
        estado
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
          const esJustificada = r.justificacion?.es_justificada;
          cell.font = { 
            color: { argb: esJustificada ? "FF00AA00" : "FFFF0000" }, 
            bold: true 
          };
        }

        if (colNumber === 8 && typeof cell.value === 'string') {
          if (cell.value.includes('Justificada:')) {
            cell.font = { color: { argb: "FF00AA00" }, bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE8F5E9" }
            };
          } else if (cell.value.includes('No Justificada:')) {
            cell.font = { color: { argb: "FFFF0000" }, bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFEBEE" }
            };
          } else if (cell.value === 'Falta') {
            cell.font = { color: { argb: "FFFF0000" }, bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFEBEE" }
            };
          }
        }
      });
    });

    const resumen = reporteActual?.resumen_basico;
    if (resumen) {
      sheet.addRow([]);
      const resumenRow = sheet.addRow([
        "RESUMEN",
        `Días trabajados: ${resumen.diasTrabajados ?? 0}`,
        "",
        `Horas totales: ${resumen.horasTotales ?? 0}`,
        "",
        `Promedio: ${resumen.promedioHorasDia ?? 0} hrs/día`,
        "",
        ""
      ]);
      resumenRow.font = { bold: true };
      resumenRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    }

    sheet.columns = [
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 30 }
    ];

    // ✅ Pie del reporte
    sheet.addRow([]);
    const footerRow1 = sheet.addRow([
      `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`
    ]);
    sheet.mergeCells(footerRow1.number, 1, footerRow1.number, 8);
    footerRow1.getCell(1).alignment = { horizontal: "center" };
    footerRow1.getCell(1).font = { size: 10, italic: true };

    const footerRow2 = sheet.addRow([
      "Departamento de Sistemas de Información"
    ]);
    sheet.mergeCells(footerRow2.number, 1, footerRow2.number, 8);
    footerRow2.getCell(1).alignment = { horizontal: "center" };
    footerRow2.getCell(1).font = { size: 10, color: { argb: "FF0066CC" } };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_${nombreUsuario}_${periodo.replace(/\s+/g, '_')}.xlsx`);
  };

  // ================= EXPORTACIÓN PDF GENERAL =================
  const exportarPDFGeneral = async () => {
    const doc = new jsPDF();
    
    const periodo = Array.isArray(reporteActual) && reporteActual[0]?.reporte?.periodo
      ? (reporteActual[0].reporte.periodo as any).nombre_periodo || reporteActual[0].reporte.periodo.nombre_mes
      : "Sin período";

    doc.setFontSize(18);
    doc.text("Reporte General de Asistencia", 105, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Período: ${periodo}`, 105, 25, { align: "center" });

    const profesores = Array.isArray(reporteActual) ? reporteActual : [];
    const tableData = profesores.map((p: any) => {
      const nombreCompleto = p.usuario
        ? `${p.usuario.nombres || ''} ${p.usuario.apellidos || ''}`
        : "Sin nombre";
      
      const esAdministrador = p.usuario?.id_rol === 1;
      const nombreCargo = p.usuario?.cargo?.nombre_cargo || 'Administrador';
      
      if (esAdministrador) {
        return [
          p.rut_usuario || "N/A",
          nombreCompleto.trim(),
          `NO REGISTRA: ${nombreCargo}`,
          `NO REGISTRA: ${nombreCargo}`,
          `NO REGISTRA: ${nombreCargo}`,
        ];
      } else {
        const resumen = p.reporte?.resumen_basico;
        return [
          p.rut_usuario || "N/A",
          nombreCompleto.trim(),
          resumen?.horasTotales || 0,
          resumen?.diasTrabajados || 0,
          resumen?.promedioHorasDia || 0,
        ];
      }
    });

    const totalHorasGeneral = profesores
      .filter((p: any) => p.usuario?.id_rol !== 1)
      .reduce((sum: number, p: any) => sum + (p.reporte?.resumen_basico?.horasTotales || 0), 0);

    tableData.push([
      "",
      "TOTAL GENERAL",
      totalHorasGeneral.toFixed(2),
      "",
      ""
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
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // ✅ Pie con info de quien genera
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

    doc.save(`ReporteGeneral_${periodo.replace(/\s+/g, '_')}.pdf`);
  };

  // ================= EXPORTACIÓN PDF PERSONAL =================
  const exportarPDFPersonal = async () => {
    const doc = new jsPDF();

    let nombreUsuario = "";
    if (usuarioSeleccionado === "mi-reporte" || !isAdmin) {
      nombreUsuario = user?.nombres || user?.rut_usuario || "Usuario";
    } else {
      const usuarioEncontrado = usuarios.find(
        (u) => u.rut_usuario === usuarioSeleccionado
      );
      nombreUsuario = usuarioEncontrado
        ? `${usuarioEncontrado.nombres} ${usuarioEncontrado.apellidos}`
        : usuarioSeleccionado;
    }

    const esAdministrador =
      user?.id_rol === 1 && (usuarioSeleccionado === "mi-reporte" || !isAdmin);
    const nombreCargo = "Administrador";

    const periodo =
      (reporteActual?.periodo as any)?.nombre_periodo ||
      reporteActual?.periodo?.nombre_mes ||
      "Sin período";

    // Encabezado
    doc.setFontSize(18);
    doc.text(`Reporte de ${nombreUsuario}`, 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Período: ${periodo}`, 105, 25, { align: "center" });

    if (esAdministrador) {
      doc.setFontSize(14);
      doc.text(
        `NO REGISTRA ASISTENCIA: ${nombreCargo}`,
        105,
        45,
        { align: "center" }
      );
      doc.setFontSize(10);
      doc.text(
        "Los administradores no registran asistencia en el sistema.",
        105,
        55,
        { align: "center" }
      );

      // Pie
      doc.setFontSize(9);
      doc.text(
        `Generado por: ${adminInfo.nombre} (${adminInfo.rut}) - ${adminInfo.cargo}`,
        105,
        75,
        { align: "center" }
      );
      doc.setTextColor(0, 102, 204);
      doc.text(
        "Departamento de Sistemas de Información",
        105,
        82,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);

      doc.save(
        `ReportePersonal_${nombreUsuario.replace(
          /\s+/g,
          "_"
        )}_${periodo.replace(/\s+/g, "_")}.pdf`
      );
      return;
    }

    const registros = reporteActual?.asistencias_detalle || [];

    const formatHora = (hora: any) => {
      if (!hora || hora === "X" || hora === "JUST") return hora;
      if (typeof hora === "string" && hora.includes(":")) {
        return hora.substring(0, 5);
      }
      return hora;
    };

    const tableData = registros.map((r: any) => {
      const [year, month, day] = r.fecha.split("-");
      const fechaLocal = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      const fechaFormateada = fechaLocal.toLocaleDateString("es-CL");
      const diaSemana =
        r.dia_semana ||
        fechaLocal.toLocaleDateString("es-CL", { weekday: "long" });

      let estado = "Presente";

      const todoVacio =
        (r.manana?.entrada === "X" || !r.manana?.entrada) &&
        (r.manana?.salida === "X" || !r.manana?.salida) &&
        (r.tarde?.entrada === "X" || !r.tarde?.entrada) &&
        (r.tarde?.salida === "X" || !r.tarde?.salida);

      if (r.justificacion) {
        estado = r.justificacion.es_justificada
          ? `Falta Justificada: ${r.justificacion.motivo}`
          : `Falta No Justificada: ${r.justificacion.motivo}`;
      } else if (todoVacio) {
        estado = "Falta";
      }

      return [
        fechaFormateada,
        diaSemana,
        r.justificacion ? "JUST" : formatHora(r.manana?.entrada),
        r.justificacion ? "JUST" : formatHora(r.manana?.salida),
        r.justificacion ? "JUST" : formatHora(r.tarde?.entrada),
        r.justificacion ? "JUST" : formatHora(r.tarde?.salida),
        r.horas_totales || 0,
        estado,
      ];
    });

    autoTable(doc, {
      head: [["Fecha", "Día", "M-E", "M-S", "T-E", "T-S", "Hrs", "Estado"]],
      body: tableData,
      startY: 32,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202], fontSize: 8, halign: "center" },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 22 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 15 },
        7: { cellWidth: 40, cellPadding: 3, overflow: 'linebreak' }
      },
      didParseCell: (data) => {
        const cellText = data.cell.text[0];
        const colIndex = data.column.index;

        if (cellText === "JUST") {
          const row = registros[data.row.index];
          const esJustificada = row?.justificacion?.es_justificada;
          data.cell.styles.textColor = esJustificada
            ? [0, 170, 0]
            : [255, 0, 0];
          data.cell.styles.fontStyle = "bold";
        }

        if (colIndex === 7 && typeof cellText === "string") {
          if (cellText.includes("Justificada:")) {
            data.cell.styles.textColor = [0, 170, 0];
            data.cell.styles.fontStyle = "bold";
          } else if (cellText.includes("No Justificada:") || cellText === "Falta") {
            data.cell.styles.textColor = [255, 0, 0];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    const resumen = reporteActual?.resumen_basico;
    let finalY = (doc as any).lastAutoTable.finalY || 40;

    if (resumen) {
      doc.setFontSize(12);
      doc.text("Resumen:", 14, finalY + 10);

      doc.setFontSize(10);
      doc.text(`Horas Totales: ${resumen.horasTotales ?? 0}`, 14, finalY + 18);
      doc.text(
        `Días Trabajados: ${resumen.diasTrabajados ?? 0}`,
        14,
        finalY + 26
      );
      doc.text(
        `Promedio Hrs/Día: ${
          resumen.promedioHorasDia?.toFixed(2) ?? 0
        }`,
        14,
        finalY + 34
      );
      finalY = finalY + 34;
    }

    // ✅ Pie con info del generador
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
                {isAdmin ? 'Gestiona y visualiza reportes de todos los usuarios' : 'Consulta tu historial de asistencia'}
              </p>
              <p className="text-slate-500 text-sm">
                {user?.nombres} {user?.apellidos} | {isAdmin ? 'Administrador' : 'Usuario'}
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
                  checked={tipoFiltro === 'mes'}
                  onChange={() => setTipoFiltro('mes')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">Por Mes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="rango"
                  checked={tipoFiltro === 'rango'}
                  onChange={() => setTipoFiltro('rango')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">Rango de Fechas</span>
              </label>
            </div>

            {/* Filtros por mes */}
            {tipoFiltro === 'mes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2024, m - 1).toLocaleDateString('es-CL', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
                  <select
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Filtros por rango */}
            {tipoFiltro === 'rango' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
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
                  <option value="mi-reporte">Mi reporte personal</option>
                  <option value="todos">📊 Reporte General - Todos los usuarios</option>
                  <optgroup label="Reportes Individuales">
                    {usuarios
                      .filter(u => u.id_rol !== 1) // ⛔ Excluir admins
                      .map((u) => (
                        <option key={u.rut_usuario} value={u.rut_usuario}>
                          {u.nombres} {u.apellidos} ({u.rut_usuario})
                        </option>
                      ))
                    }
                  </optgroup>
                </select>
              </div>
            ) : null}

            {/* Info del admin que genera el reporte (solo visual, editable) */}
            {isAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Información del Generador del Reporte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={adminInfo.nombre}
                      onChange={(e) => setAdminInfo({...adminInfo, nombre: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">RUT</label>
                    <input
                      type="text"
                      value={adminInfo.rut}
                      onChange={(e) => setAdminInfo({...adminInfo, rut: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={adminInfo.cargo}
                      onChange={(e) => setAdminInfo({...adminInfo, cargo: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-blue-700">
                  <Building2 className="h-3 w-3 mr-1" />
                  <span className="font-medium">Departamento de Sistemas de Información</span>
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
                {/* Total de horas general */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Total de Horas (Todos los Usuarios)</p>
                      <p className="text-4xl font-bold">
                        {reporteActual
                          .filter((r: any) => r.usuario?.id_rol !== 1)
                          .reduce((sum: number, r: any) => sum + (r.reporte?.resumen_basico?.horasTotales || 0), 0)
                          .toFixed(2)} hrs
                      </p>
                      <p className="text-blue-100 text-xs mt-2">
                        {reporteActual.filter((r: any) => r.usuario?.id_rol !== 1).length} usuarios registrados
                      </p>
                    </div>
                    <Clock className="h-16 w-16 text-blue-200 opacity-50" />
                  </div>
                </div>

                {/* Top 3 usuarios con más horas (sin emojis, con iconos) */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Top 3 - Más Horas Trabajadas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reporteActual
                      .filter((r: any) => r.usuario?.id_rol !== 1)
                      .sort((a: any, b: any) => 
                        (b.reporte?.resumen_basico?.horasTotales || 0) - (a.reporte?.resumen_basico?.horasTotales || 0)
                      )
                      .slice(0, 3)
                      .map((r: any, idx: number) => {
                        const borderClass =
                          idx === 0
                            ? 'bg-yellow-50 border-yellow-300'
                            : idx === 1
                            ? 'bg-slate-50 border-slate-300'
                            : 'bg-orange-50 border-orange-300';

                        const rankColors =
                          idx === 0
                            ? 'bg-yellow-500 text-white'
                            : idx === 1
                            ? 'bg-slate-500 text-white'
                            : 'bg-orange-500 text-white';

                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-lg border-2 ${borderClass}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rankColors}`}>
                                  #{idx + 1}
                                </span>
                                <Award className="h-5 w-5 text-yellow-600" />
                              </div>
                              <span className="text-lg font-bold text-blue-600">
                                {r.reporte?.resumen_basico?.horasTotales || 0}h
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {r.usuario?.nombres} {r.usuario?.apellidos}
                            </p>
                            <p className="text-xs text-slate-600">{r.usuario?.rut_usuario}</p>
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
                  <p className="text-2xl font-bold">{reporteActual.resumen_basico?.horasTotales || 0}h</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <Calendar className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Días Trabajados</p>
                  <p className="text-2xl font-bold">{reporteActual.resumen_basico?.diasTrabajados || 0}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <FileText className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Promedio Horas/Día</p>
                  <p className="text-2xl font-bold">{reporteActual.resumen_basico?.promedioHorasDia || 0}h</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                  <Users className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Registros</p>
                  <p className="text-2xl font-bold">{reporteActual.asistencias_detalle?.length || 0}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
