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
  TrendingUp
} from 'lucide-react';

interface Usuario {
  rut_usuario: string;
  nombres: string;
  apellidos: string;
}

export default function ReportsSection() {
  const { user } = useAuth();
  const { reporteActual, obtenerReporteMensual, loading } = useReportes();
  
  // Estados de filtros
  const [tipoFiltro, setTipoFiltro] = useState<'mes' | 'rango'>('mes');
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  
  // Estados para admin
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>("mi-reporte");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  const isAdmin = user?.id_rol === 1;

  // Cargar lista de usuarios (solo admin)
  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios();
    }
  }, [user]);

  // Generar reporte automáticamente cuando cambien los filtros
  useEffect(() => {
    if (!user) return;

    const generarReporteAutomatico = async () => {
      if (tipoFiltro === 'mes') {
        // Para filtro por mes, generar inmediatamente
        if (usuarioSeleccionado === 'todos') {
          await obtenerReporteMensual(mes, anio, undefined, true);
        } else if (usuarioSeleccionado === 'mi-reporte') {
          await obtenerReporteMensual(mes, anio, undefined, false);
        } else {
          await obtenerReporteMensual(mes, anio, usuarioSeleccionado, false);
        }
      } else {
        // Para filtro por rango, solo generar si ambas fechas están seleccionadas
        if (fechaInicio && fechaFin) {
          if (usuarioSeleccionado === 'todos') {
            await obtenerReporteMensual(undefined, undefined, undefined, true, fechaInicio, fechaFin);
          } else if (usuarioSeleccionado === 'mi-reporte') {
            await obtenerReporteMensual(undefined, undefined, undefined, false, fechaInicio, fechaFin);
          } else {
            await obtenerReporteMensual(undefined, undefined, usuarioSeleccionado, false, fechaInicio, fechaFin);
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

    // Título
    sheet.mergeCells("A1:Z1");
    sheet.getCell("A1").value = "Reporte General de Asistencia";
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").font = { bold: true, size: 16 };

    // Período
    const periodo = Array.isArray(reporteActual) && reporteActual[0]?.reporte?.periodo
      ? (reporteActual[0].reporte.periodo as any).nombre_periodo || reporteActual[0].reporte.periodo.nombre_mes
      : "Sin período";
    
    sheet.mergeCells("A2:Z2");
    sheet.getCell("A2").value = `Período: ${periodo}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    const profesores = Array.isArray(reporteActual) ? reporteActual : [];
    
    if (profesores.length === 0) {
      sheet.addRow(["No hay datos para mostrar"]);
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `ReporteGeneral_${periodo.replace(/\s+/g, '_')}.xlsx`);
      return;
    }

    // Obtener todas las fechas únicas del período
    const fechasSet = new Set<string>();
    profesores.forEach((p: any) => {
      const asistencias = p.reporte?.asistencias_detalle || [];
      asistencias.forEach((a: any) => fechasSet.add(a.fecha));
    });
    const fechasOrdenadas = Array.from(fechasSet).sort();

    // Crear encabezados con estructura: Nombre | Día1 (fecha) [Mañana: E/S, Tarde: E/S] | Día2...
    const headerRow1: any[] = ["Nombre"];
    const headerRow2: any[] = [""];
    const headerRow3: any[] = [""];

    fechasOrdenadas.forEach((fecha) => {
      const fechaObj = new Date(fecha + 'T00:00:00');
      const diaSemana = fechaObj.toLocaleDateString("es-CL", { weekday: "short" });
      const diaNumero = fechaObj.getDate();
      
      // Día de la semana y fecha (merge 4 columns)
      headerRow1.push(diaSemana.toUpperCase());
      headerRow1.push("");
      headerRow1.push("");
      headerRow1.push("");
      
      // Fecha (merge 4 columns)
      headerRow2.push(`${diaNumero}`);
      headerRow2.push("");
      headerRow2.push("");
      headerRow2.push("");
      
      // Mañana y Tarde
      headerRow3.push("M-E");
      headerRow3.push("M-S");
      headerRow3.push("T-E");
      headerRow3.push("T-S");
    });

    // Agregar columna de totales
    headerRow1.push("Total Hrs");
    headerRow2.push("");
    headerRow3.push("");

    // Agregar las filas de encabezado
    const row1 = sheet.addRow(headerRow1);
    const row2 = sheet.addRow(headerRow2);
    const row3 = sheet.addRow(headerRow3);

    // Aplicar estilos a encabezados
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

    // Merge cells for days
    let colIndex = 2; // Start after "Nombre" column
    fechasOrdenadas.forEach(() => {
      // Merge día de la semana (4 columns)
      sheet.mergeCells(4, colIndex, 4, colIndex + 3);
      // Merge fecha (4 columns)
      sheet.mergeCells(5, colIndex, 5, colIndex + 3);
      colIndex += 4;
    });

    // Merge "Total Hrs" cell
    sheet.mergeCells(4, colIndex, 6, colIndex);

    // Agregar datos de cada profesor
    profesores.forEach((p: any) => {
      const nombreCompleto = p.usuario
        ? `${p.usuario.nombres || ''} ${p.usuario.apellidos || ''}`
        : "Sin nombre";
      
      const asistencias = p.reporte?.asistencias_detalle || [];
      const asistenciasPorFecha = new Map<string, any>();
      asistencias.forEach((a: any) => asistenciasPorFecha.set(a.fecha, a));

      // Verificar si es administrador (id_rol === 1)
      const esAdministrador = p.usuario?.id_rol === 1;
      const nombreCargo = p.usuario?.cargo?.nombre_cargo || 'Administrador';

      const dataRow: any[] = [nombreCompleto.trim()];

      if (esAdministrador) {
        // Para administradores, mostrar mensaje especial en lugar de horas
        fechasOrdenadas.forEach(() => {
          dataRow.push(`NO REGISTRA ASISTENCIA: ${nombreCargo}`);
          dataRow.push("");
          dataRow.push("");
          dataRow.push("");
        });
        
        // Total especial para admin
        dataRow.push(`NO REGISTRA ASISTENCIA: ${nombreCargo}`);
      } else {
        // Para usuarios regulares, mostrar asistencias normalmente
        fechasOrdenadas.forEach((fecha) => {
          const asistencia = asistenciasPorFecha.get(fecha);
          
          if (asistencia) {
            dataRow.push(asistencia.manana?.entrada || "X");
            dataRow.push(asistencia.manana?.salida || "X");
            dataRow.push(asistencia.tarde?.entrada || "X");
            dataRow.push(asistencia.tarde?.salida || "X");
          } else {
            dataRow.push("X");
            dataRow.push("X");
            dataRow.push("X");
            dataRow.push("X");
          }
        });

        // Total de horas para usuarios regulares
        const totalHoras = p.reporte?.resumen_basico?.horasTotales || 0;
        dataRow.push(totalHoras);
      }

      const row = sheet.addRow(dataRow);

      // Estilo de datos
      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Colorear las X en rojo
        if (cell.value === "X") {
          cell.font = { color: { argb: "FFFF0000" }, bold: true };
        }

        // Colorear mensaje de administrador en azul
        if (typeof cell.value === 'string' && cell.value.includes('NO REGISTRA ASISTENCIA:')) {
          cell.font = { color: { argb: "FF0066CC" }, bold: true, size: 10 };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        }

        // Primera columna (nombre) en negrita
        if (colNumber === 1) {
          cell.font = { bold: true };
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      });
    });

    // Ajustar anchos de columna
    sheet.getColumn(1).width = 25; // Nombre
    for (let i = 2; i <= fechasOrdenadas.length * 4 + 1; i++) {
      sheet.getColumn(i).width = 8;
    }
    sheet.getColumn(fechasOrdenadas.length * 4 + 2).width = 12; // Total Hrs

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ReporteGeneral_${periodo.replace(/\s+/g, '_')}.xlsx`);
  };

  // ================= EXPORTACIÓN EXCEL PERSONAL =================
  const exportarExcelPersonal = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte Personal");

    // Determinar el nombre del usuario según contexto
    let nombreUsuario = "";
    if (usuarioSeleccionado === 'mi-reporte' || !isAdmin) {
      nombreUsuario = user?.nombres || user?.rut_usuario || "Usuario";
    } else {
      // Buscar el usuario seleccionado en la lista
      const usuarioEncontrado = usuarios.find(u => u.rut_usuario === usuarioSeleccionado);
      nombreUsuario = usuarioEncontrado 
        ? `${usuarioEncontrado.nombres} ${usuarioEncontrado.apellidos}` 
        : usuarioSeleccionado;
    }

    // Verificar si el usuario es administrador
    const esAdministrador = user?.id_rol === 1;
    const nombreCargo = 'Administrador';

    const periodo = (reporteActual?.periodo as any)?.nombre_periodo || reporteActual?.periodo?.nombre_mes || "Sin período";

    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").value = `Reporte de ${nombreUsuario}`;
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").font = { bold: true, size: 16 };

    sheet.mergeCells("A2:H2");
    sheet.getCell("A2").value = `Período: ${periodo}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    if (esAdministrador) {
      // Para administradores, mostrar mensaje especial
      sheet.mergeCells("A4:H4");
      sheet.getCell("A4").value = `NO REGISTRA ASISTENCIA: ${nombreCargo}`;
      sheet.getCell("A4").alignment = { horizontal: "center", vertical: "middle" };
      sheet.getCell("A4").font = { bold: true, size: 14, color: { argb: "FF0066CC" } };
      
      sheet.mergeCells("A5:H5");
      sheet.getCell("A5").value = "Los administradores no registran asistencia en el sistema.";
      sheet.getCell("A5").alignment = { horizontal: "center", vertical: "middle" };
      sheet.getCell("A5").font = { size: 12, color: { argb: "FF666666" } };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `ReportePersonal_${nombreUsuario.replace(/\s+/g, '_')}_${periodo.replace(/\s+/g, '_')}.xlsx`);
      return;
    }
    
    // Encabezados (solo para usuarios no administradores)
    sheet.addRow(["Fecha", "Día", "Mañana Entrada", "Mañana Salida", "Tarde Entrada", "Tarde Salida", "Horas Totales", "Estado"]);
    const headerRow = sheet.getRow(4);
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
      const row = sheet.addRow([
        new Date(r.fecha).toLocaleDateString("es-CL"),
        r.dia_semana || new Date(r.fecha).toLocaleDateString("es-CL", { weekday: "long" }),
        r.manana?.entrada || "X",
        r.manana?.salida || "X",
        r.tarde?.entrada || "X",
        r.tarde?.salida || "X",
        r.horas_totales || 0,
        r.estado || "Presente"
      ]);

      // Estilo de datos
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Colorear las X en rojo
        if (cell.value === "X") {
          cell.font = { color: { argb: "FFFF0000" }, bold: true };
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

    // Ajustar anchos
    sheet.columns = [
      { width: 12 }, // Fecha
      { width: 12 }, // Día
      { width: 15 }, // Mañana Entrada
      { width: 15 }, // Mañana Salida
      { width: 15 }, // Tarde Entrada
      { width: 15 }, // Tarde Salida
      { width: 15 }, // Horas Totales
      { width: 12 }  // Estado
    ];

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
    doc.text("Reporte General de Asistencia", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Período: ${periodo}`, 105, 30, { align: "center" });

    const profesores = Array.isArray(reporteActual) ? reporteActual : [];
    const tableData = profesores.map((p: any) => {
      const nombreCompleto = p.usuario
        ? `${p.usuario.nombres || ''} ${p.usuario.apellidos || ''}`
        : "Sin nombre";
      
      // Verificar si es administrador (id_rol === 1)
      const esAdministrador = p.usuario?.id_rol === 1;
      const nombreCargo = p.usuario?.cargo?.nombre_cargo || 'Administrador';
      
      if (esAdministrador) {
        return [
          p.rut_usuario || "N/A",
          nombreCompleto.trim(),
          `NO REGISTRA ASISTENCIA: ${nombreCargo}`,
          `NO REGISTRA ASISTENCIA: ${nombreCargo}`,
          `NO REGISTRA ASISTENCIA: ${nombreCargo}`,
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

    autoTable(doc, {
      head: [["RUT", "Nombre", "Horas", "Días", "Promedio"]],
      body: tableData,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(`ReporteGeneral_${periodo.replace(/\s+/g, '_')}.pdf`);
  };

  // ================= EXPORTACIÓN PDF PERSONAL =================
  const exportarPDFPersonal = async () => {
    const doc = new jsPDF();
    
    // Determinar el nombre del usuario según contexto
    let nombreUsuario = "";
    
    if (usuarioSeleccionado === 'mi-reporte' || !isAdmin) {
      nombreUsuario = user?.nombres || user?.rut_usuario || "Usuario";
    } else {
      const usuarioEncontrado = usuarios.find(u => u.rut_usuario === usuarioSeleccionado);
      nombreUsuario = usuarioEncontrado 
        ? `${usuarioEncontrado.nombres} ${usuarioEncontrado.apellidos}` 
        : usuarioSeleccionado;
    }
    
    // Verificar si el usuario objetivo es administrador
    // Solo podemos verificar si es el usuario actual (del contexto de auth)
    const esAdministrador = user?.id_rol === 1;
    const nombreCargo = 'Administrador';
    
    const periodo = (reporteActual?.periodo as any)?.nombre_periodo || reporteActual?.periodo?.nombre_mes || "Sin período";

    doc.setFontSize(18);
    doc.text(`Reporte de ${nombreUsuario}`, 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Período: ${periodo}`, 105, 30, { align: "center" });

    if (esAdministrador) {
      // Para administradores, mostrar mensaje especial
      doc.setFontSize(14);
      doc.text(`NO REGISTRA ASISTENCIA: ${nombreCargo}`, 105, 60, { align: "center" });
      doc.setFontSize(10);
      doc.text("Los administradores no registran asistencia en el sistema.", 105, 80, { align: "center" });
      
      doc.save(`ReportePersonal_${nombreUsuario.replace(/\s+/g, '_')}_${periodo.replace(/\s+/g, '_')}.pdf`);
      return;
    }

    const registros = reporteActual?.asistencias_detalle || [];
    const tableData = registros.map((r: any) => [
      new Date(r.fecha).toLocaleDateString("es-CL"),
      r.dia_semana || new Date(r.fecha).toLocaleDateString("es-CL", { weekday: "long" }),
      r.manana?.entrada || "X",
      r.manana?.salida || "X",
      r.tarde?.entrada || "X",
      r.tarde?.salida || "X",
      r.horas_totales || 0,
      r.estado || "Presente"
    ]);

    autoTable(doc, {
      head: [["Fecha", "Día", "Mañana\nEntrada", "Mañana\nSalida", "Tarde\nEntrada", "Tarde\nSalida", "Horas", "Estado"]],
      body: tableData,
      startY: 40,
      theme: "grid",
      headStyles: { 
        fillColor: [66, 139, 202],
        fontSize: 8,
        halign: 'center'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 20 },  // Fecha
        1: { cellWidth: 22 },  // Día
        2: { cellWidth: 18 },  // Mañana Entrada
        3: { cellWidth: 18 },  // Mañana Salida
        4: { cellWidth: 18 },  // Tarde Entrada
        5: { cellWidth: 18 },  // Tarde Salida
        6: { cellWidth: 15 },  // Horas
        7: { cellWidth: 20 }   // Estado
      }
    });

    const resumen = reporteActual?.resumen_basico;
    if (resumen) {
      const finalY = (doc as any).lastAutoTable.finalY || 40;
      doc.setFontSize(12);
      doc.text("Resumen:", 14, finalY + 10);
      doc.setFontSize(10);
      doc.text(`Horas Totales: ${resumen.horasTotales ?? 0}`, 14, finalY + 18);
      doc.text(`Días Trabajados: ${resumen.diasTrabajados ?? 0}`, 14, finalY + 26);
      doc.text(`Promedio Hrs/Día: ${resumen.promedioHorasDia?.toFixed(2) ?? 0}`, 14, finalY + 34);
    }

    doc.save(`Reporte_${nombreUsuario}_${periodo.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header con estilo consistente */}
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

            {/* Selector de usuario (solo admin) o indicador de reporte personal */}
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
                    {usuarios.map((u) => (
                      <option key={u.rut_usuario} value={u.rut_usuario}>
                        {u.nombres} {u.apellidos} ({u.rut_usuario})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ) : null}
          </div>

          {/* Botones de exportación */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            {/* Indicador de carga sutil */}
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

        {/* Vista previa de datos */}
        {reporteActual && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              {usuarioSeleccionado === 'todos' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  Vista Previa - Reporte General
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  Vista Previa - Reporte Individual
                </>
              )}
            </h3>
            
            {Array.isArray(reporteActual) ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="font-bold">{reporteActual.length}</span> 
                    <span className="ml-1">usuarios incluidos en el reporte general</span>
                  </p>
                </div>

                {/* Calcular suma total de horas de todos los usuarios */}
                {(() => {
                  const totalHoras = reporteActual.reduce((sum: number, r: any) => {
                    return sum + (r.reporte?.resumen_basico?.horasTotales || 0);
                  }, 0);
                  
                  return (
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium mb-1">Suma Total de Horas Trabajadas</p>
                          <p className="text-4xl font-bold">{totalHoras.toFixed(2)} hrs</p>
                          <p className="text-blue-100 text-xs mt-2">
                            Promedio por usuario: {(totalHoras / (reporteActual.length || 1)).toFixed(2)} hrs
                          </p>
                        </div>
                        <Clock className="h-16 w-16 text-blue-200 opacity-50" />
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {reporteActual.slice(0, 8).map((r: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {r.usuario?.nombres} {r.usuario?.apellidos}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {r.usuario?.rut_usuario}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Horas:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {r.reporte?.resumen_basico?.horasTotales || 0} hrs
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Días:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {r.reporte?.resumen_basico?.diasTrabajados || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {reporteActual.length > 8 && (
                  <p className="text-center text-sm text-slate-500 mt-3">
                    ... y {reporteActual.length - 8} usuarios más
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tarjeta destacada de suma total de horas */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Total de Horas Trabajadas en el Período</p>
                      <p className="text-4xl font-bold">{reporteActual.resumen_basico?.horasTotales?.toFixed(2) || 0} hrs</p>
                      <p className="text-blue-100 text-xs mt-2">
                        {reporteActual.asistencias_detalle?.length || 0} días registrados
                      </p>
                    </div>
                    <Clock className="h-16 w-16 text-blue-200 opacity-50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                    <p className="text-slate-600 text-xs font-medium mb-1 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Período
                    </p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {(reporteActual.periodo as any)?.nombre_periodo || reporteActual.periodo?.nombre_mes || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-700 text-xs font-medium mb-1">Días Trabajados</p>
                    <p className="font-bold text-green-600 text-2xl">
                      {reporteActual.resumen_basico?.diasTrabajados || 0}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <p className="text-purple-700 text-xs font-medium mb-1">Promedio Horas/Día</p>
                    <p className="font-bold text-purple-600 text-2xl">
                      {reporteActual.resumen_basico?.promedioHorasDia?.toFixed(2) || 0}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <p className="text-orange-700 text-xs font-medium mb-1">Registros</p>
                    <p className="font-bold text-orange-600 text-2xl">
                      {reporteActual.asistencias_detalle?.length || 0}
                    </p>
                  </div>
                </div>

                {usuarioSeleccionado !== 'mi-reporte' && usuarioSeleccionado !== 'todos' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm font-medium">Viendo reporte de:</p>
                    <p className="font-bold text-blue-900 text-lg">
                      {usuarios.find(u => u.rut_usuario === usuarioSeleccionado)?.nombres || usuarioSeleccionado}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
