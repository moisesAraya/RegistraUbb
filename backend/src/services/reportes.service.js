"use strict";

import { Op } from "sequelize";
import Marcaje from "../entities/marcaje.entity.js";
import Justificacion from "../entities/justificacion.entity.js";
import Usuario from "../entities/usuario.entity.js";
import Cargo from "../entities/cargo.entity.js";

console.log("📊 [REPORTES-SERVICE] Servicio cargado");

/* ------------------------------------------------------
   HELPER SEGURO — Asegura que cualquier valor se convierta
   en HH:MM:SS válido.
------------------------------------------------------ */
function formatTimeToString(value) {
  if (!value) return null;

  if (typeof value === "string") {
    if (/^\d{2}:\d{2}$/.test(value)) return value + ":00";
    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;

    if (value.includes("T")) {
      try {
        const date = new Date(value);
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
      } catch {
        return null;
      }
    }
    return null;
  }

  if (value instanceof Date) {
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
    const ss = String(value.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  if (typeof value === "object" && value.hours !== undefined) {
    const hh = String(value.hours).padStart(2, "0");
    const mm = String(value.minutes).padStart(2, "0");
    const ss = String(value.seconds || 0).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  return null;
}

/* ----------------------------------------
   REPORTE PERSONAL (mensual o por rango)
---------------------------------------- */
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

    const justificaciones = await Justificacion.findAll({
      where: {
        rut_usuario,
        fecha_justificacion: {
          [Op.between]: [fechaInicioReal, fechaFinReal],
        },
      },
    });

    const marcajes = await Marcaje.findAll({
      where: {
        rut_usuario,
        fecha: {
          [Op.between]: [fechaInicioReal, fechaFinReal],
        },
      },
      order: [
        ["fecha", "ASC"],
        ["hora_ingreso", "ASC"],
      ],
    });

    if (marcajes.length === 0 && justificaciones.length === 0) {
      return generarReporteVacio(
        mes,
        anio,
        fechaInicioReal,
        fechaFinReal,
        periodoNombre,
        usuario
      );
    }

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

/* ------------------------------------------------------
   AGRUPAR MARCAJES POR FECHA
------------------------------------------------------ */
function agruparMarcajesPorFecha(marcajes) {
  const marcajesPorFecha = {};

  marcajes.forEach((marcaje) => {
    const fecha = marcaje.fecha;

    if (!marcajesPorFecha[fecha]) {
      marcajesPorFecha[fecha] = [];
    }

    const horaEntrada = formatTimeToString(marcaje.hora_ingreso);
    const horaSalida = formatTimeToString(marcaje.hora_salida);

    marcajesPorFecha[fecha].push({
      id_marcaje: marcaje.id_marcaje,
      hora_entrada: horaEntrada,
      hora_salida: horaSalida,
      observacion: marcaje.observacion,
    });
  });

  return marcajesPorFecha;
}

/* ------------------------------------------------------
   CONVERTIR HH:MM → horas decimales entre dos marcajes
------------------------------------------------------ */
function calcularHorasEntreMarcajes(entrada, salida) {
  if (!entrada || !salida || entrada === "X" || salida === "X") return 0;

  try {
    entrada = formatTimeToString(entrada);
    salida = formatTimeToString(salida);

    const [h1, m1] = entrada.split(":").map(Number);
    const [h2, m2] = salida.split(":").map(Number);

    let min1 = h1 * 60 + m1;
    let min2 = h2 * 60 + m2;

    if (min2 < min1) min2 += 24 * 60;

    const horas = (min2 - min1) / 60;

    return Number(horas.toFixed(6)); // precisión segura
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------
   PROCESAR FECHA DETALLE DE ASISTENCIA
------------------------------------------------------ */
function procesarAsistenciasDetalle(marcajesPorFecha, justificaciones) {
  const asistencias = [];
  const justXFecha = {};

  justificaciones.forEach((j) => {
    justXFecha[j.fecha_justificacion] = j;
  });

  const fechas = new Set([
    ...Object.keys(marcajesPorFecha),
    ...Object.keys(justXFecha),
  ]);

  fechas.forEach((fecha) => {
    const marcajes = marcajesPorFecha[fecha] || [];
    const just = justXFecha[fecha];

    const fechaObj = new Date(fecha + "T00:00:00");
    const fecha_formateada = fechaObj.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
    const dia_semana = fechaObj.toLocaleDateString("es-CL", {
      weekday: "long",
    });

    if (marcajes.length === 0 && just) {
      const horas = just.es_justificada ? Number(just.horas_compensadas) : 0;

      asistencias.push({
        fecha,
        fecha_formateada,
        dia_semana,
        manana: { entrada: "JUST", salida: "JUST", horas: 0 },
        tarde: { entrada: "JUST", salida: "JUST", horas: 0 },
        horas_totales: horas,
        estado: just.es_justificada ? "justificado" : "falta",
        justificacion: {
          motivo: just.motivo,
          descripcion: just.descripcion,
          es_justificada: just.es_justificada,
          horas_compensadas: horas,
        },
        marcajes_raw: [],
      });
      return;
    }

    marcajes.forEach((m) => {
      m.hora_entrada = formatTimeToString(m.hora_entrada);
      m.hora_salida = formatTimeToString(m.hora_salida);
    });

    marcajes.sort((a, b) =>
      (a.hora_entrada || "00:00:00").localeCompare(
        b.hora_entrada || "00:00:00"
      )
    );

    const mañana = [];
    const tarde = [];

    marcajes.forEach((m) => {
      const hora = parseInt((m.hora_entrada || "00:00:00").split(":")[0]);
      if (hora >= 12) tarde.push(m);
      else mañana.push(m);
    });

    const calcSegmento = (arr) => {
      if (arr.length === 0)
        return { entrada: null, salida: null, horas: 0 };

      const entrada = arr[0].hora_entrada;
      const salida = arr[arr.length - 1].hora_salida;

      const horas = calcularHorasEntreMarcajes(entrada, salida);
      return { entrada, salida, horas };
    };

    const segManana = calcSegmento(mañana);
    const segTarde = calcSegmento(tarde);

    let horasTotales = marcajes.reduce(
      (sum, m) =>
        sum +
        calcularHorasEntreMarcajes(m.hora_entrada, m.hora_salida),
      0
    );

    horasTotales = Number(horasTotales.toFixed(6));

    const asistencia = {
      fecha,
      fecha_formateada,
      dia_semana,
      manana: {
        entrada: segManana.entrada || "X",
        salida: segManana.salida || "X",
        horas: Number(segManana.horas.toFixed(6)),
      },
      tarde: {
        entrada: segTarde.entrada || "X",
        salida: segTarde.salida || "X",
        horas: Number(segTarde.horas.toFixed(6)),
      },
      horas_totales: horasTotales,
      estado: horasTotales > 0 ? "presente" : "falta",
      marcajes_raw: marcajes,
    };

    if (just) {
      const horasComp = Number(just.horas_compensadas || 0);

      asistencia.justificacion = {
        motivo: just.motivo,
        descripcion: just.descripcion,
        es_justificada: just.es_justificada,
        horas_compensadas: horasComp,
      };

      if (just.es_justificada) {
        asistencia.horas_totales = Number(
          (horasTotales + horasComp).toFixed(6)
        );
        asistencia.estado = "justificado";
      }
    }

    asistencias.push(asistencia);
  });

  return asistencias.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ------------------------------------------------------
   RESUMEN (horas, faltas, promedio)
------------------------------------------------------ */
function calcularResumenAsistencias(asistencias) {
  const horasTotales = asistencias.reduce(
    (sum, a) => sum + Number(a.horas_totales || 0),
    0
  );

  const diasTrabajados = asistencias.filter(
    (a) => Number(a.horas_totales) > 0
  ).length;

  const faltas = asistencias.filter(
    (a) =>
      Number(a.horas_totales) === 0 &&
      !a.justificacion?.es_justificada
  ).length;

  return {
    horasTotales: Number(horasTotales.toFixed(6)),
    diasTrabajados,
    faltas,
    promedioHorasDia:
      diasTrabajados > 0
        ? Number((horasTotales / diasTrabajados).toFixed(6))
        : 0,
  };
}

/* ------------------------------------------------------
   MÉTRICAS AVANZADAS / GRÁFICOS
------------------------------------------------------ */
function calcularMetricasAvanzadas(asistencias, justificaciones) {
  const total = asistencias.length;
  const horas = asistencias.reduce(
    (sum, a) => sum + Number(a.horas_totales || 0),
    0
  );

  const promedio = total > 0 ? horas / total : 0;

  return {
    promedio_horas_dia: Number(promedio.toFixed(6)),
    puntualidad: { puntualidad_score: 0 },
    consistencia: {
      dias_completos: asistencias.filter(
        (a) => Number(a.horas_totales) >= 8
      ).length,
      dias_incompletos: asistencias.filter(
        (a) =>
          Number(a.horas_totales) < 7 &&
          Number(a.horas_totales) > 0
      ).length,
      consistencia_score: 0,
    },
    justificaciones: {
      total: justificaciones.length,
      justificadas: justificaciones.filter((j) => j.es_justificada).length,
      no_justificadas: justificaciones.filter(
        (j) => !j.es_justificada
      ).length,
    },
  };
}

/* ------------------------------------------------------ */
function generarDatosGraficos(asistencias) {
  return { horas_por_fecha: [], horas_por_dia_semana: [] };
}

function calcularTendencias() {
  return { tendencia: "estable" };
}

/* ------------------------------------------------------
   REPORTE VACÍO
------------------------------------------------------ */
function generarReporteVacio(mes, anio, fechaInicio, fechaFin, periodo, usuario) {
  return {
    usuario_info: usuario
      ? {
          rut: usuario.rut_usuario,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          cargo: usuario.cargo?.nombre_cargo,
        }
      : null,
    periodo: {
      mes,
      anio,
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
    tendencias: { tendencia: "estable" },
  };
}

console.log("📊 [REPORTES-SERVICE] Listo con formateo seguro de horas");
