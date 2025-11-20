"use strict";

import { Op } from "sequelize";
import Marcaje from "../entities/marcaje.entity.js";
import RegistroMarcaje from "../entities/registro_marcaje.entity.js";
import Justificacion from "../entities/justificacion.entity.js";
import Usuario from "../entities/usuario.entity.js";
import Cargo from "../entities/cargo.entity.js";

console.log("📊 [REPORTES-SERVICE] Servicio cargado");

// -----------------------
// Helpers de tiempo
// -----------------------
function formatTimeToString(value) {
  if (!value) return null;

  // Si ya es string en formato HH:MM o HH:MM:SS
  if (typeof value === "string") {
    if (/^\d{2}:\d{2}$/.test(value)) {
      return value + ":00";
    }
    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value;
    }
    if (value.includes("T")) {
      try {
        const date = new Date(value);
        // Usar hora LOCAL en vez de UTC
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Si viene como Date
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    const seconds = String(value.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  // Si viene como objeto { hours, minutes }
  if (typeof value === "object" && value.hours !== undefined) {
    const h = String(value.hours).padStart(2, "0");
    const m = String(value.minutes).padStart(2, "0");
    const s = String(value.seconds || 0).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  return null;
}

// -----------------------
// Reporte mensual / rango
// -----------------------
export async function getReportePersonalMensual(
  rut_usuario,
  mes,
  anio,
  fecha_inicio = null,
  fecha_fin = null
) {
  console.log("📊 [REPORTES] Generando reporte:", {
    rut_usuario,
    mes,
    anio,
    fecha_inicio,
    fecha_fin,
  });

  try {
    if (!rut_usuario) throw new Error("RUT requerido");

    // Info de usuario + cargo
    const usuario = await Usuario.findOne({
      where: { rut_usuario },
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["nombre_cargo"],
        },
      ],
    });

    let fechaInicioReal, fechaFinReal, periodoNombre;

    if (fecha_inicio && fecha_fin) {
      fechaInicioReal = fecha_inicio;
      fechaFinReal = fecha_fin;
      periodoNombre = `${fecha_inicio} a ${fecha_fin}`;
    } else {
      mes = Number(mes);
      anio = Number(anio);
      if (!mes || !anio || mes < 1 || mes > 12)
        throw new Error("Mes o año inválido");

      fechaInicioReal = `${anio}-${String(mes).padStart(2, "0")}-01`;
      const lastDay = new Date(anio, mes, 0).getDate();
      fechaFinReal = `${anio}-${String(mes).padStart(2, "0")}-${String(
        lastDay
      ).padStart(2, "0")}`;
      periodoNombre = new Date(anio, mes - 1).toLocaleDateString("es-CL", {
        month: "long",
        year: "numeric",
      });
    }

    // Justificaciones en el período
    const justificaciones = await Justificacion.findAll({
      where: {
        rut_usuario,
        fecha_justificacion: {
          [Op.between]: [fechaInicioReal, fechaFinReal],
        },
      },
    });

    // Registros de marcaje (relación usuario-marcaje)
    const registrosMarcaje = await RegistroMarcaje.findAll({
      where: { rut_usuario },
    });

    if (registrosMarcaje.length === 0 && justificaciones.length === 0) {
      console.log("⚠️ [REPORTES] No hay registros para:", rut_usuario);
      return generarReporteVacio(
        mes,
        anio,
        fechaInicioReal,
        fechaFinReal,
        periodoNombre,
        usuario
      );
    }

    const marcajeIds = registrosMarcaje.map((r) => r.id_marcaje);

    const marcajes = await Marcaje.findAll({
      where: {
        id_marcaje: { [Op.in]: marcajeIds },
        fecha: {
          [Op.between]: [fechaInicioReal, fechaFinReal],
        },
      },
      order: [
        ["fecha", "ASC"],
        ["hora_ingreso", "ASC"],
      ],
    });

    console.log(
      `📊 [REPORTES] Marcajes: ${marcajes.length}, Justificaciones: ${justificaciones.length}`
    );

    const marcajesPorFecha = agruparMarcajesPorFecha(marcajes);

    const asistencias_detalle = procesarAsistenciasDetalle(
      marcajesPorFecha,
      justificaciones
    );

    const resumen = calcularResumenAsistencias(asistencias_detalle);
    const metricas = calcularMetricasAvanzadas(
      asistencias_detalle,
      justificaciones
    );

    return {
      usuario_info: usuario
        ? {
            rut: usuario.rut_usuario,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            cargo: usuario.cargo?.nombre_cargo || "Sin cargo",
          }
        : null,
      periodo: {
        mes: mes || null,
        anio: anio || null,
        fecha_inicio: fechaInicioReal,
        fecha_fin: fechaFinReal,
        nombre_periodo: periodoNombre,
      },
      resumen_basico: resumen,
      asistencias_detalle,
      justificaciones,
      metricas_avanzadas: metricas,
      graficos_data: generarDatosGraficos(asistencias_detalle),
      tendencias: calcularTendencias(asistencias_detalle),
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ [REPORTES] Error:", error);
    throw error;
  }
}

// -----------------------
// Aux: reporte vacío
// -----------------------
function generarReporteVacio(
  mes,
  anio,
  fechaInicio,
  fechaFin,
  periodo,
  usuario
) {
  return {
    usuario_info: usuario
      ? {
          rut: usuario.rut_usuario,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          cargo: usuario.cargo?.nombre_cargo || "Sin cargo",
        }
      : null,
    periodo: {
      mes: mes || null,
      anio: anio || null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      nombre_periodo: periodo,
    },
    resumen_basico: {
      horasTotales: 0,
      diasTrabajados: 0,
      faltas: 0,
      promedioHorasDia: 0,
    },
    asistencias_detalle: [],
    justificaciones: [],
    metricas_avanzadas: {
      promedio_horas_dia: 0,
      puntualidad: { puntualidad_score: 0 },
      consistencia: {
        dias_completos: 0,
        dias_incompletos: 0,
        consistencia_score: 0,
      },
      justificaciones: {
        total: 0,
        justificadas: 0,
        no_justificadas: 0,
      },
    },
    graficos_data: { horas_por_fecha: [], horas_por_dia_semana: [] },
    tendencias: { tendencia: "insuficientes_datos" },
    generated_at: new Date().toISOString(),
  };
}

// -----------------------
// Agrupar marcajes por fecha (NORMALIZANDO HORAS)
// -----------------------
function agruparMarcajesPorFecha(marcajes) {
  const marcajesPorFecha = {};

  marcajes.forEach((marcaje) => {
    const fecha = marcaje.fecha;

    if (!marcajesPorFecha[fecha]) {
      marcajesPorFecha[fecha] = [];
    }

    // 🔹 Normalizamos acá: siempre quedarán como "HH:MM:SS"
    const horaEntrada = formatTimeToString(marcaje.hora_ingreso);
    const horaSalida = formatTimeToString(marcaje.hora_salida);

    marcajesPorFecha[fecha].push({
      id_marcaje: marcaje.id_marcaje,
      hora_entrada: horaEntrada, // ya normalizada
      hora_salida: horaSalida, // ya normalizada
      observacion: marcaje.observacion,
    });
  });

  return marcajesPorFecha;
}

// -----------------------
// Formatear fecha local
// -----------------------
function formatearFechaLocal(fechaStr) {
  const [year, month, day] = fechaStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return {
    formateada: date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    }),
    dia_semana: date.toLocaleDateString("es-CL", { weekday: "long" }),
  };
}

// -----------------------
// Procesar asistencias (marcajes + justificaciones)
// -----------------------
function procesarAsistenciasDetalle(marcajesPorFecha, justificaciones) {
  const asistencias = [];

  // mapa de justificaciones por fecha
  const justificacionesPorFecha = {};
  justificaciones.forEach((j) => {
    justificacionesPorFecha[j.fecha_justificacion] = j;
  });

  // todas las fechas que tienen algo (marcaje o justificación)
  const todasLasFechas = new Set([
    ...Object.keys(marcajesPorFecha),
    ...Object.keys(justificacionesPorFecha),
  ]);

  todasLasFechas.forEach((fecha) => {
    const marcajes = marcajesPorFecha[fecha] || [];
    const justificacion = justificacionesPorFecha[fecha];
    const fechaInfo = formatearFechaLocal(fecha);

    // === CASO 1: SOLO JUSTIFICACIÓN (sin marcajes) ===
    if (marcajes.length === 0 && justificacion) {
      const esJustificada = !!justificacion.es_justificada;
      const horasNum = Number(justificacion.horas_compensadas);
      const horasCompensadas = !isNaN(horasNum) ? horasNum : 0;

      asistencias.push({
        fecha,
        fecha_formateada: fechaInfo.formateada,
        dia_semana: fechaInfo.dia_semana,
        manana: { entrada: "JUST", salida: "JUST", horas: 0 },
        tarde: { entrada: "JUST", salida: "JUST", horas: 0 },
        horas_totales: esJustificada ? horasCompensadas : 0,
        estado: esJustificada ? "justificado" : "falta",
        justificacion: {
          motivo: justificacion.motivo,
          descripcion: justificacion.descripcion,
          es_justificada: esJustificada,
          horas_compensadas: horasCompensadas,
        },
        marcajes_raw: [],
      });
      return;
    }

    // === CASO 2: HAY MARCAJES (con o sin justificación) ===

    // Aseguramos horas normalizadas HH:MM:SS
    marcajes.forEach((m) => {
      m.hora_entrada = formatTimeToString(m.hora_entrada);
      m.hora_salida = formatTimeToString(m.hora_salida);
    });

    // Ordenar por hora de entrada
    marcajes.sort((a, b) => {
      const horaA = a.hora_entrada || "00:00:00";
      const horaB = b.hora_entrada || "00:00:00";
      return horaA.localeCompare(horaB);
    });

    // --- Construir campos de mañana / tarde SOLO para mostrar ---
    const manana = { entrada: null, salida: null };
    const tarde = { entrada: null, salida: null };

    if (marcajes.length >= 1) {
      const primer = marcajes[0];
      manana.entrada = primer.hora_entrada;

      if (primer.hora_salida) {
        const horaSalidaStr = primer.hora_salida || "00:00:00";
        const horaSalida = parseInt(horaSalidaStr.split(":")[0], 10);

        if (horaSalida >= 14) {
          // si sale después de almuerzo la consideramos salida tarde
          tarde.salida = primer.hora_salida;
        } else {
          manana.salida = primer.hora_salida;
        }
      }
    }

    if (marcajes.length >= 2) {
      const segundo = marcajes[1];
      if (!tarde.salida) {
        tarde.entrada = segundo.hora_entrada;
        tarde.salida = segundo.hora_salida;
      }
    }

    if (marcajes.length >= 3 && !tarde.entrada) {
      tarde.entrada = marcajes[1].hora_entrada;
      tarde.salida = marcajes[1].hora_salida || marcajes[2]?.hora_salida;
    }

    // --- Horas por tramo (para info, no para el resumen global) ---
    const horasManana = calcularHorasEntreMarcajes(
      manana.entrada,
      manana.salida
    );
    const horasTarde = calcularHorasEntreMarcajes(
      tarde.entrada,
      tarde.salida
    );

    // 🔥 HORAS TOTALES DEL DÍA:
    // sumamos TODOS los marcajes crudos de ese día
    let horasTotalesDia = marcajes.reduce((sum, m) => {
      return sum + calcularHorasEntreMarcajes(m.hora_entrada, m.hora_salida);
    }, 0);

    const sinMarcajesEnTodoElDia =
      marcajes.length === 0 ||
      (!manana.entrada && !manana.salida && !tarde.entrada && !tarde.salida);

    let estado = "presente";

    if (sinMarcajesEnTodoElDia) {
      estado = "falta";
    } else if (horasTotalesDia === 0) {
      // hubo al menos un marcaje pero no pudimos calcular horas (ej. solo entrada)
      estado = "presente";
    }

    const asistencia = {
      fecha,
      fecha_formateada: fechaInfo.formateada,
      dia_semana: fechaInfo.dia_semana,
      manana: {
        entrada: manana.entrada || "X",
        salida: manana.salida || "X",
        horas: Math.round(horasManana * 100) / 100,
      },
      tarde: {
        entrada: tarde.entrada || "X",
        salida: tarde.salida || "X",
        horas: Math.round(horasTarde * 100) / 100,
      },
      horas_totales: Math.round(horasTotalesDia * 100) / 100,
      estado,
      marcajes_raw: marcajes,
    };

    // --- Justificación sobre un día con marcajes ---
    if (justificacion) {
      const esJustificada = !!justificacion.es_justificada;
      const horasNum = Number(justificacion.horas_compensadas);
      const horasCompensadas = !isNaN(horasNum) ? horasNum : 0;

      asistencia.justificacion = {
        motivo: justificacion.motivo,
        descripcion: justificacion.descripcion,
        es_justificada: esJustificada,
        horas_compensadas: horasCompensadas,
      };

      if (esJustificada) {
        asistencia.horas_totales = Math.round(
          (horasTotalesDia + horasCompensadas) * 100
        ) / 100;

        if (asistencia.estado === "falta") {
          asistencia.estado = "justificado";
        }
      }
    }

    asistencias.push(asistencia);
  });

  // ordenar cronológicamente
  return asistencias.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// -----------------------
// Calcular horas entre marcajes
// -----------------------
function calcularHorasEntreMarcajes(entrada, salida) {
  if (!entrada || !salida || entrada === "X" || salida === "X") {
    return 0;
  }

  try {
    // entrada/salida deberían ser "HH:MM:SS", pero por si acaso normalizamos
    const entradaStr =
      typeof entrada === "string"
        ? entrada
        : formatTimeToString(entrada) || "00:00:00";
    const salidaStr =
      typeof salida === "string"
        ? salida
        : formatTimeToString(salida) || "00:00:00";

    const [horaEnt, minEnt, segEnt = 0] = entradaStr.split(":").map(Number);
    const [horaSal, minSal, segSal = 0] = salidaStr.split(":").map(Number);

    const minutosEntrada = horaEnt * 60 + minEnt + segEnt / 60;
    let minutosSalida = horaSal * 60 + minSal + segSal / 60;

    if (minutosSalida < minutosEntrada) {
      minutosSalida += 24 * 60;
    }

    const horas = (minutosSalida - minutosEntrada) / 60;
    return Math.max(0, Math.min(14, horas));
  } catch (error) {
    console.error("Error calculando horas:", error);
    return 0;
  }
}

// -----------------------
// Resumen de asistencias
// -----------------------
function calcularResumenAsistencias(asistencias) {
  const horasTotales = asistencias.reduce(
    (sum, a) => sum + (a.horas_totales || 0),
    0
  );

  // Día trabajado:
  // - tiene horas > 0
  //   O tiene marcajes_raw
  //   O tiene justificación justificada
  const diasTrabajados = asistencias.filter((a) => {
    const tieneHoras = (a.horas_totales || 0) > 0;
    const tieneMarcajes =
      Array.isArray(a.marcajes_raw) && a.marcajes_raw.length > 0;
    const tieneJustificacionJustificada =
      a.justificacion?.es_justificada === true;
    return tieneHoras || tieneMarcajes || tieneJustificacionJustificada;
  }).length;

  // Faltas NO justificadas:
  // - horas_totales = 0
  // - sin marcajes
  // - sin justificación justificada
  const faltas = asistencias.filter((a) => {
    const noHoras = (a.horas_totales || 0) === 0;
    const sinMarcajes =
      !Array.isArray(a.marcajes_raw) || a.marcajes_raw.length === 0;
    const sinJustificacionJustificada = !a.justificacion?.es_justificada;
    return noHoras && sinMarcajes && sinJustificacionJustificada;
  }).length;

  return {
    horasTotales: Math.round(horasTotales * 100) / 100,
    diasTrabajados,
    faltas,
    promedioHorasDia:
      diasTrabajados > 0
        ? Math.round((horasTotales / diasTrabajados) * 100) / 100
        : 0,
  };
}

// ---------------------------------------------------
// Métricas avanzadas / gráficos / tendencias
// ---------------------------------------------------
function calcularMetricasAvanzadas(asistencias, justificaciones) {
  const totalAsistencias = asistencias.length;
  const horasTotales = asistencias.reduce(
    (sum, a) => sum + parseFloat(a.horas_totales || 0),
    0
  );
  const promedioHorasDia =
    totalAsistencias > 0 ? horasTotales / totalAsistencias : 0;

  const llegadasTempranas = asistencias.filter((a) => {
    if (a.manana?.entrada === "X" || a.manana?.entrada === "JUST") return false;
    const horaStr = formatTimeToString(a.manana.entrada) || "00:00:00";
    const hora = parseInt(horaStr.split(":")[0]);
    return hora <= 8;
  }).length;

  const diasCompletos = asistencias.filter(
    (a) => parseFloat(a.horas_totales || 0) >= 8
  ).length;
  const diasIncompletos = asistencias.filter((a) => {
    const horas = parseFloat(a.horas_totales || 0);
    return horas < 7 && horas > 0;
  }).length;

  return {
    promedio_horas_dia: Math.round(promedioHorasDia * 100) / 100,
    puntualidad: {
      puntualidad_score:
        totalAsistencias > 0
          ? Math.round((llegadasTempranas / totalAsistencias) * 100)
          : 0,
    },
    consistencia: {
      dias_completos: diasCompletos,
      dias_incompletos: diasIncompletos,
      consistencia_score:
        totalAsistencias > 0
          ? Math.round((diasCompletos / totalAsistencias) * 100)
          : 0,
    },
    justificaciones: {
      total: justificaciones.length,
      justificadas: justificaciones.filter((j) => j.es_justificada).length,
      no_justificadas: justificaciones.filter((j) => !j.es_justificada).length,
    },
  };
}

function generarDatosGraficos(asistencias) {
  const horasPorDia = asistencias.map((a) => ({
    fecha: a.fecha,
    horas: parseFloat(a.horas_totales || 0),
    dia_semana: new Date(a.fecha + "T00:00:00").toLocaleDateString("es-CL", {
      weekday: "short",
    }),
  }));

  const diasSemana = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  const horasPorDiaSemana = diasSemana.map((dia) => {
    const horasDelDia = asistencias
      .filter((a) => {
        const fechaAsistencia = new Date(a.fecha + "T00:00:00");
        const diaSemana = fechaAsistencia.toLocaleDateString("es-CL", {
          weekday: "long",
        });
        return diaSemana
          .toLowerCase()
          .includes(dia.toLowerCase().substring(0, 3));
      })
      .reduce((sum, a) => sum + parseFloat(a.horas_totales || 0), 0);

    return { dia, horas: Math.round(horasDelDia * 100) / 100 };
  });

  return {
    horas_por_fecha: horasPorDia,
    horas_por_dia_semana: horasPorDiaSemana.filter((d) => d.horas > 0),
  };
}

function calcularTendencias(asistencias) {
  if (asistencias.length < 5) return { tendencia: "insuficientes_datos" };

  const primeraMitad = asistencias.slice(0, Math.floor(asistencias.length / 2));
  const segundaMitad = asistencias.slice(Math.floor(asistencias.length / 2));

  const promedioInicial =
    primeraMitad.reduce(
      (sum, a) => sum + parseFloat(a.horas_totales || 0),
      0
    ) / primeraMitad.length;
  const promedioFinal =
    segundaMitad.reduce(
      (sum, a) => sum + parseFloat(a.horas_totales || 0),
      0
    ) / segundaMitad.length;

  const diferencia = promedioFinal - promedioInicial;
  const porcentajeCambio =
    promedioInicial > 0 ? (diferencia / promedioInicial) * 100 : 0;

  return {
    tendencia:
      diferencia > 0.5
        ? "mejorando"
        : diferencia < -0.5
        ? "empeorando"
        : "estable",
    promedio_inicial: Math.round(promedioInicial * 100) / 100,
    promedio_final: Math.round(promedioFinal * 100) / 100,
    cambio_porcentual: Math.round(porcentajeCambio * 100) / 100,
  };
}

console.log(
  "📊 [REPORTES-SERVICE] ✅ Servicio listo con justificaciones integradas"
);

// ---------------------------------------------------
// Reporte comparativo (últimos 6 meses)
// ---------------------------------------------------
export async function getReporteComparativo(rut_usuario) {
  console.log("📊 [REPORTES] Generando reporte comparativo:", rut_usuario);

  try {
    const reportesMensuales = [];
    const fechaActual = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() - i,
        1
      );
      const mes = fecha.getMonth() + 1;
      const anio = fecha.getFullYear();

      try {
        const reporte = await getReportePersonalMensual(
          rut_usuario,
          mes,
          anio
        );
        reportesMensuales.push({
          mes,
          anio,
          nombre_mes: fecha.toLocaleDateString("es-CL", {
            month: "short",
          }),
          horas_totales: reporte.resumen_basico?.horasTotales || 0,
          dias_trabajados: reporte.resumen_basico?.diasTrabajados || 0,
          faltas: reporte.resumen_basico?.faltas || 0,
          justificaciones: reporte.justificaciones?.length || 0,
          porcentaje_asistencia: calcularPorcentajeAsistencia(
            reporte.resumen_basico
          ),
        });
      } catch (error) {
        console.log(`⚠️ No hay datos para ${mes}/${anio}`);
        reportesMensuales.push({
          mes,
          anio,
          nombre_mes: fecha.toLocaleDateString("es-CL", {
            month: "short",
          }),
          horas_totales: 0,
          dias_trabajados: 0,
          faltas: 0,
          justificaciones: 0,
          porcentaje_asistencia: 0,
        });
      }
    }

    return {
      periodo_analizado: "6 meses",
      reportes_mensuales: reportesMensuales,
      tendencias_generales: calcularTendenciasGenerales(reportesMensuales),
      promedios: calcularPromedios(reportesMensuales),
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ [REPORTES] Error comparativo:", error);
    throw error;
  }
}

// ---------------------------------------------------
// Estadísticas ANUALES (nuevo)
// ---------------------------------------------------
export async function getEstadisticasAnuales(rut_usuario, anio) {
  console.log(
    "📊 [REPORTES-SERVICE] ===== GET ESTADISTICAS ANUALES =====",
    { rut_usuario, anio }
  );

  try {
    if (!rut_usuario) throw new Error("RUT requerido");

    const anioConsulta = anio || new Date().getFullYear();

    const meses = [];
    let totalHoras = 0;
    let totalDias = 0;

    for (let mes = 1; mes <= 12; mes++) {
      const nombreMes = new Date(anioConsulta, mes - 1, 1).toLocaleDateString(
        "es-CL",
        { month: "long" }
      );

      try {
        const reporteMensual = await getReportePersonalMensual(
          rut_usuario,
          mes,
          anioConsulta
        );

        const resumen =
          reporteMensual?.resumen_basico ||
          reporteMensual?.resumen ||
          null;

        const horasMes = Number(
          resumen?.horasTotales ?? resumen?.horas_totales ?? 0
        );
        const diasMes = Number(
          resumen?.diasTrabajados ?? resumen?.dias_trabajados ?? 0
        );

        const horasMesOk = isNaN(horasMes) ? 0 : horasMes;
        const diasMesOk = isNaN(diasMes) ? 0 : diasMes;

        totalHoras += horasMesOk;
        totalDias += diasMesOk;

        meses.push({
          mes,
          nombre_mes: nombreMes,
          horas: horasMesOk,
          dias: diasMesOk,
          resumen,
        });
      } catch (error) {
        console.error(
          "⚠️ [REPORTES-SERVICE] Error obteniendo reporte mensual para estadísticas anuales",
          { mes, anio: anioConsulta, error: error.message }
        );

        meses.push({
          mes,
          nombre_mes: nombreMes,
          horas: 0,
          dias: 0,
          error: error.message,
        });
      }
    }

    const promedioMensual =
      meses.length > 0 ? Number((totalHoras / meses.length).toFixed(2)) : 0;

    const promedioDiario =
      totalDias > 0 ? Number((totalHoras / totalDias).toFixed(2)) : 0;

    const resultado = {
      anio: anioConsulta,
      totalHoras: Number(totalHoras.toFixed(2)),
      totalDias,
      promedioMensual,
      promedioDiario,
      meses,
    };

    console.log(
      "✅ [REPORTES-SERVICE] Estadísticas anuales calculadas:",
      {
        anio: resultado.anio,
        totalHoras: resultado.totalHoras,
        totalDias: resultado.totalDias,
      }
    );

    return resultado;
  } catch (error) {
    console.error("❌ [REPORTES-SERVICE] Error en getEstadisticasAnuales:", error);
    throw error;
  }
}

// ---------------------------------------------------
// Estadísticas de asistencia (para dashboard / mes)
// ---------------------------------------------------
export async function getEstadisticasAsistenciaService(
  rutUsuario,
  mes = null,
  anio = null
) {
  try {
    console.log(
      "📊 [ESTADISTICAS-SERVICE] === OBTENIENDO ESTADÍSTICAS v4 ==="
    );
    console.log("📊 [ESTADISTICAS-SERVICE] Usuario:", rutUsuario);

    const usuario = await Usuario.findOne({
      where: { rut_usuario: rutUsuario },
    });
    if (!usuario) throw new Error("Usuario no encontrado");

    // 44 horas semanales (objetivo de referencia)
    const horasObjetivoSemanal = 44;
    const horasObjetivoDiario = 8;

    const { dias, periodo } = await obtenerDiasConHoras(
      rutUsuario,
      mes,
      anio
    );

    if (dias.length === 0) {
      return {
        horasObjetivo: horasObjetivoDiario,
        horasReales: 0,
        porcentajeCumplimiento: 0,
        tendenciaSemanal: [],
        diasMasProductivos: [],
        promedioHoraIngreso: "00:00",
      };
    }

    // 🔹 Horas reales del mes (incluye el último día, por ejemplo HOY)
    const horasReales = dias.reduce((sum, d) => sum + d.horas, 0);

    // 🔹 Calcular horas objetivo del mes (aprox.)
    const startDate = new Date(periodo.anio, periodo.mes - 1, 1);
    const endDate = new Date(periodo.anio, periodo.mes, 0);
    const diasDelMes = endDate.getDate();
    const semanasCompletas = Math.floor(diasDelMes / 7);
    const horasObjetivoMes = semanasCompletas * horasObjetivoSemanal;

    const porcentajeCumplimiento =
      horasObjetivoMes > 0 ? (horasReales / horasObjetivoMes) * 100 : 0;

    // 🔹 Tendencia semanal basada en las FECHAS de "dias"
    const diasOrdenados = [...dias].sort((a, b) =>
      a.fecha.localeCompare(b.fecha)
    );

    // Último día con registros
    const ultimaFechaStr = diasOrdenados[diasOrdenados.length - 1].fecha; // "YYYY-MM-DD"
    const ultimaFecha = new Date(ultimaFechaStr + "T00:00:00");
    ultimaFecha.setHours(0, 0, 0, 0);

    const tendenciaSemanal = [];

    // Construimos 4 bloques de 7 días hacia atrás desde la última fecha
    for (let i = 3; i >= 0; i--) {
      const finSemana = new Date(ultimaFecha);
      finSemana.setDate(ultimaFecha.getDate() - i * 7);
      finSemana.setHours(23, 59, 59, 999); // 👈 INCLUYE COMPLETAMENTE EL DÍA

      const inicioSemana = new Date(ultimaFecha);
      inicioSemana.setDate(ultimaFecha.getDate() - i * 7 - 6);
      inicioSemana.setHours(0, 0, 0, 0);

      const diasSemana = dias.filter((d) => {
        const f = new Date(d.fecha + "T00:00:00");
        return f >= inicioSemana && f <= finSemana; // 👈 INCLUSIVO
      });

      const horasSemana = diasSemana.reduce(
        (sum, d) => sum + d.horas,
        0
      );

      tendenciaSemanal.push({
        semana: `Semana ${4 - i}`,
        horas: Math.round(horasSemana * 100) / 100,
        dias: diasSemana.length,
      });
    }

    // 🔹 Días más productivos
    const diasMasProductivos = [...dias]
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5)
      .map((d) => ({
        fecha: d.fecha,
        horas: d.horas,
        horaIngreso: d.horaIngreso || "00:00",
      }));

    // 🔹 Promedio hora de ingreso (solo días con marcaje real)
    const horasIngresoMin = dias
      .filter((d) => d.horaIngreso)
      .map((d) => {
        const str = formatTimeToString(d.horaIngreso) || "00:00:00";
        const [h, m] = str.split(":").map(Number);
        return h * 60 + m;
      });

    const promedioMinutos =
      horasIngresoMin.length > 0
        ? horasIngresoMin.reduce((s, v) => s + v, 0) /
          horasIngresoMin.length
        : 0;

    const hProm = Math.floor(promedioMinutos / 60);
    const mProm = Math.floor(promedioMinutos % 60);
    const promedioHoraIngreso = `${hProm
      .toString()
      .padStart(2, "0")}:${mProm.toString().padStart(2, "0")}`;

    console.log("✅ [ESTADISTICAS-SERVICE] v4 OK");

    return {
      horasObjetivo: horasObjetivoDiario,
      horasReales: Math.round(horasReales * 100) / 100,
      porcentajeCumplimiento:
        Math.round(porcentajeCumplimiento * 100) / 100,
      tendenciaSemanal,
      diasMasProductivos,
      promedioHoraIngreso,
    };
  } catch (error) {
    console.error("❌ [ESTADISTICAS-SERVICE] Error v4:", error);
    throw new Error(`Error obteniendo estadísticas: ${error.message}`);
  }
}

// -----------------------
// Aux comparativo/anual
// -----------------------
function calcularPorcentajeAsistencia(resumen) {
  if (!resumen || !resumen.diasTrabajados) return 0;
  const diasLaborales = 22; // Aproximado mensual
  return Math.round((resumen.diasTrabajados / diasLaborales) * 100);
}

function calcularTendenciasGenerales(reportes) {
  const horasMensuales = reportes.map((r) => r.horas_totales);
  const diasMensuales = reportes.map((r) => r.dias_trabajados);

  return {
    horas: calcularTendenciaArray(horasMensuales),
    dias: calcularTendenciaArray(diasMensuales),
    asistencia: calcularTendenciaArray(
      reportes.map((r) => r.porcentaje_asistencia)
    ),
  };
}

function calcularTendenciaArray(valores) {
  if (valores.length < 2) return "insuficientes_datos";

  const primerValor = valores[0];
  const ultimoValor = valores[valores.length - 1];
  const diferencia = ultimoValor - primerValor;

  if (diferencia > 5) return "mejorando";
  if (diferencia < -5) return "empeorando";
  return "estable";
}

function calcularPromedios(reportes) {
  const validos = reportes.filter((r) => r.horas_totales > 0);
  if (validos.length === 0)
    return { horas: 0, dias: 0, asistencia: 0 };

  return {
    horas:
      Math.round(
        (validos.reduce((sum, r) => sum + r.horas_totales, 0) /
          validos.length) *
          100
      ) / 100,
    dias: Math.round(
      validos.reduce((sum, r) => sum + r.dias_trabajados, 0) /
        validos.length
    ),
    asistencia: Math.round(
      validos.reduce(
        (sum, r) => sum + r.porcentaje_asistencia,
        0
      ) / validos.length
    ),
  };
}

function calcularEstadisticasAnuales(reportesMensuales) {
  const reportesValidos = reportesMensuales.filter((r) => r !== null);

  if (reportesValidos.length === 0) {
    return {
      total_horas: 0,
      total_dias: 0,
      promedio_mensual_horas: 0,
      promedio_mensual_dias: 0,
      mejor_mes: null,
      peor_mes: null,
      mejores_meses: [],
      areas_mejora: [],
    };
  }

  const totalHoras = reportesValidos.reduce(
    (sum, r) => sum + (r.resumen_basico?.horasTotales || 0),
    0
  );
  const totalDias = reportesValidos.reduce(
    (sum, r) => sum + (r.resumen_basico?.diasTrabajados || 0),
    0
  );

  const mejorMes = reportesValidos.reduce((mejor, actual) =>
    (actual.resumen_basico?.horasTotales || 0) >
    (mejor.resumen_basico?.horasTotales || 0)
      ? actual
      : mejor
  );

  const peorMes = reportesValidos.reduce((peor, actual) =>
    (actual.resumen_basico?.horasTotales || 0) <
    (peor.resumen_basico?.horasTotales || 0)
      ? actual
      : peor
  );

  return {
    total_horas: Math.round(totalHoras * 100) / 100,
    total_dias: totalDias,
    promedio_mensual_horas: Math.round(
      (totalHoras / reportesValidos.length) * 100
    ) / 100,
    promedio_mensual_dias: Math.round(
      totalDias / reportesValidos.length
    ),
    mejor_mes: {
      mes: mejorMes.periodo.nombre_mes,
      horas: mejorMes.resumen_basico?.horasTotales || 0,
    },
    peor_mes: {
      mes: peorMes.periodo.nombre_mes,
      horas: peorMes.resumen_basico?.horasTotales || 0,
    },
    mejores_meses: reportesValidos
      .sort(
        (a, b) =>
          (b.resumen_basico?.horasTotales || 0) -
          (a.resumen_basico?.horasTotales || 0)
      )
      .slice(0, 3)
      .map((r) => ({
        mes: r.periodo.nombre_mes,
        horas: r.resumen_basico?.horasTotales || 0,
      })),
    areas_mejora: generarAreasdemejora(reportesValidos),
  };
}

function generarAreasdemejora(reportes) {
  const areas = [];

  const promedioHoras =
    reportes.reduce(
      (sum, r) => sum + (r.resumen_basico?.horasTotales || 0),
      0
    ) / reportes.length;
  const promedioDias =
    reportes.reduce(
      (sum, r) => sum + (r.resumen_basico?.diasTrabajados || 0),
      0
    ) / reportes.length;

  if (promedioHoras < 140)
    areas.push("Aumentar horas mensuales de trabajo");
  if (promedioDias < 18)
    areas.push("Mejorar consistencia de asistencia");

  const mesesBajos = reportes.filter(
    (r) =>
      (r.resumen_basico?.horasTotales || 0) <
      promedioHoras * 0.8
  );
  if (mesesBajos.length > reportes.length * 0.3) {
    areas.push("Reducir variabilidad entre meses");
  }

  return areas;
}

// Aliases para usar en otros módulos
export { getReporteComparativo as getReporteComparativoService };
export { getEstadisticasAnuales as getEstadisticasAnualesService };

console.log(
  "📊 [REPORTES-SERVICE] ✅ Servicio de reportes personales cargado"
);
