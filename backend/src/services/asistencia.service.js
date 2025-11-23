"use strict";

import { Op } from "sequelize";
import Usuario from "../entities/usuario.entity.js";
import Marcaje from "../entities/marcaje.entity.js";
import Justificacion from "../entities/justificacion.entity.js";

console.log(
  "🎯 [ASISTENCIA-SERVICE] v5 CARGADO (Marcaje + Justificacion, sin tabla RegistroMarcaje)"
);

/**
 * 🔁 Normaliza distintos formatos de hora a "HH:MM:SS"
 */
function formatTimeToString(value) {
  if (!value) return null;

  // 1) Si es string
  if (typeof value === "string") {
    // "08:32" → "08:32:00"
    if (/^\d{2}:\d{2}$/.test(value)) {
      return value + ":00";
    }

    // "08:32:12" → tal cual
    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    // ISO: 2025-11-11T09:01:00-03:00
    if (value.includes("T")) {
      try {
        const timePart = value.split("T")[1];
        if (!timePart) return null;

        // Quitar zona horaria (+-HH:MM o Z)
        const timeOnly = timePart.split(/[+-Z]/)[0];
        return timeOnly.length >= 8 ? timeOnly.substring(0, 8) : null;
      } catch {
        return null;
      }
    }

    return null;
  }

  // 2) Si es Date
  if (value instanceof Date) {
    return value.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Santiago",
    });
  }

  // 3) Si es objeto tipo { hours, minutes, seconds }
  if (
    typeof value === "object" &&
    value !== null &&
    value.hours !== undefined
  ) {
    const h = String(value.hours).padStart(2, "0");
    const m = String(value.minutes || 0).padStart(2, "0");
    const s = String(value.seconds || 0).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // 4) Cualquier otro caso
  return null;
}

/**
 * 🧮 Convierte "HH:MM:SS" a minutos del día
 * (USADO SOLO PARA LOS SLOTS DEL CALENDARIO)
 */
function timeStringToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m, s = 0] = timeStr.split(":").map(Number);
  return h * 60 + m + s / 60;
}

/**
 * ⏱️ Calcula horas entre hora_ingreso y hora_salida
 */
function calcularHorasEntreMarcajes(entrada, salida) {
  if (!entrada || !salida) return 0;

  try {
    const entradaStr = formatTimeToString(entrada) || "00:00:00";
    const salidaStr = formatTimeToString(salida) || "00:00:00";

    const [hE, mE, sE = 0] = entradaStr.split(":").map(Number);
    const [hS, mS, sS = 0] = salidaStr.split(":").map(Number);

    const minutosE = hE * 60 + mE + sE / 60;
    let minutosS = hS * 60 + mS + sS / 60;

    if (minutosS < minutosE) {
      minutosS += 24 * 60; // cruce medianoche
    }

    const horas = (minutosS - minutosE) / 60;
    return Math.max(0, Math.min(14, horas)); // límite razonable
  } catch (err) {
    console.error("❌ Error calculando horas entre marcajes:", err);
    return 0;
  }
}

/**
 * 🧩 Construye los 4 slots (E1, S1, E2, S2) para un día dado,
 * usando los marcajes reales (solo para visual del calendario)
 */
function buildSlotsForDay(marcajesDia) {
  const events = [];

  marcajesDia.forEach((m) => {
    const horaIngStr = formatTimeToString(m.hora_ingreso);
    const horaSalStr = m.hora_salida
      ? formatTimeToString(m.hora_salida)
      : null;

    if (horaIngStr) {
      events.push({
        tipo: "entrada",
        hora: horaIngStr,
        minutos: timeStringToMinutes(horaIngStr),
        id_marcaje: m.id_marcaje,
      });
    }

    if (horaSalStr) {
      events.push({
        tipo: "salida",
        hora: horaSalStr,
        minutos: timeStringToMinutes(horaSalStr),
        id_marcaje: m.id_marcaje,
      });
    }
  });

  // Ordenar por hora
  events.sort((a, b) => (a.minutos ?? 0) - (b.minutos ?? 0));

  const slots = [null, null, null, null]; // E1, S1, E2, S2

  if (events.length === 0) {
    return slots;
  }

  if (events.length === 1) {
    slots[0] = events[0];
    return slots;
  }

  if (events.length === 2) {
    const diffMin = events[1].minutos - events[0].minutos;
    let diffHoras = diffMin / 60;
    if (diffHoras < 0) diffHoras += 24;

    if (diffHoras > 6) {
      slots[0] = events[0];
      slots[3] = events[1];
    } else {
      slots[0] = events[0];
      slots[1] = events[1];
    }
    return slots;
  }

  for (let i = 0; i < Math.min(4, events.length); i++) {
    slots[i] = events[i];
  }

  return slots;
}

/**
 * 🧠 Core: construye registros individuales + resumen + calendario
 * - Aplica REGLA DE COLACIÓN (30 min) en días con un solo bloque >= 6h
 */
async function obtenerMarcajesIndividuales(rutUsuario, mes = null, anio = null) {
  const now = new Date();
  const targetAnio = anio ? parseInt(anio) : now.getFullYear();
  const targetMes = mes ? parseInt(mes) : now.getMonth() + 1;

  const startDate = new Date(targetAnio, targetMes - 1, 1);
  const endDate = new Date(targetAnio, targetMes, 0);

  const fechaInicioStr = startDate.toISOString().split("T")[0];
  const fechaFinStr = endDate.toISOString().split("T")[0];

  console.log("📅 [ASISTENCIA-SERVICE] Rango v5:", fechaInicioStr, "a", fechaFinStr);

  // 🔹 1) Marcajes del usuario en el mes
  const marcajes = await Marcaje.findAll({
    where: {
      rut_usuario: rutUsuario,
      fecha: {
        [Op.between]: [fechaInicioStr, fechaFinStr],
      },
    },
    order: [
      ["fecha", "ASC"],
      ["hora_ingreso", "ASC"],
    ],
  });

  console.log("📅 [ASISTENCIA-SERVICE] Marcajes encontrados:", marcajes.length);

  // 🔹 2) Justificaciones del mes
  const justificaciones = await Justificacion.findAll({
    where: {
      rut_usuario: rutUsuario,
      fecha_justificacion: {
        [Op.between]: [fechaInicioStr, fechaFinStr],
      },
    },
  });

  console.log(
    "📋 [ASISTENCIA-SERVICE] Justificaciones encontradas:",
    justificaciones.length
  );

  // Agrupar marcajes por fecha (para detectar días con un solo bloque)
  const marcajesPorFecha = {};
  marcajes.forEach((m) => {
    const fecha = m.fecha; // YYYY-MM-DD
    if (!marcajesPorFecha[fecha]) {
      marcajesPorFecha[fecha] = [];
    }
    marcajesPorFecha[fecha].push({
      id_marcaje: m.id_marcaje,
      hora_ingreso: m.hora_ingreso,
      hora_salida: m.hora_salida,
      observacion: m.observacion,
    });
  });

  // Agrupar justificaciones por fecha
  const justPorFecha = new Map();
  justificaciones.forEach((just) => {
    justPorFecha.set(just.fecha_justificacion, just);
  });

  // 🔹 3) Detectar qué fechas llevan descuento de colación
  const fechasConDescuentoColacion = new Set();

  Object.entries(marcajesPorFecha).forEach(([fecha, lista]) => {
    const marcajesDia = lista;
    const just = justPorFecha.get(fecha) || null;

    if (marcajesDia.length === 1) {
      const unico = marcajesDia[0];
      const horasDelMarcaje = calcularHorasEntreMarcajes(
        unico.hora_ingreso,
        unico.hora_salida
      );

      if (
        horasDelMarcaje >= 6 &&
        !(just && just.es_justificada && just.horas_compensadas)
      ) {
        console.log(
          `⏱️ [ASISTENCIA] Marcaje único >= 6h en ${fecha}, aplicará descuento colación 0.5h`
        );
        fechasConDescuentoColacion.add(fecha);
      }
    }
  });

  // 🔹 4) Convertir cada marcaje individual a un registro separado (con colación aplicada)
  const registrosIndividuales = [];

  marcajes.forEach((marcaje) => {
    const fecha = marcaje.fecha;
    let horasDelMarcaje = calcularHorasEntreMarcajes(
      marcaje.hora_ingreso,
      marcaje.hora_salida
    );

    if (fechasConDescuentoColacion.has(fecha)) {
      console.log(
        `⏱️ [ASISTENCIA] Descontando 0.5h de colación en marcaje ${marcaje.id_marcaje} (${fecha})`
      );
      horasDelMarcaje = Math.max(0, horasDelMarcaje - 0.5);
    }

    registrosIndividuales.push({
      id_marcaje: marcaje.id_marcaje,
      fecha: fecha,
      horas: Math.round(horasDelMarcaje * 100) / 100,
      horaIngreso: formatTimeToString(marcaje.hora_ingreso),
      horaSalida: formatTimeToString(marcaje.hora_salida),
      estado: horasDelMarcaje > 0 ? "presente" : "falta",
      observacion: marcaje.observacion,
      justificacion: null,
    });
  });

  // Justificaciones como registros separados
  justificaciones.forEach((just) => {
    registrosIndividuales.push({
      id_justificacion: just.id_justificacion,
      fecha: just.fecha_justificacion,
      horas: Number(just.horas_compensadas) || 0,
      horaIngreso: null,
      horaSalida: null,
      estado: just.es_justificada ? "justificada" : "no_justificada",
      observacion: just.observaciones,
      justificacion: {
        motivo: just.motivo,
        descripcion: just.descripcion,
        es_justificada: just.es_justificada,
        horas_compensadas: Number(just.horas_compensadas) || 0,
      },
    });
  });

  // 🔹 5) Agrupar registros individuales por fecha para resumen y calendario
  const registrosPorFecha = {};
  registrosIndividuales.forEach((r) => {
    if (!registrosPorFecha[r.fecha]) {
      registrosPorFecha[r.fecha] = [];
    }
    registrosPorFecha[r.fecha].push(r);
  });

  const fechasTodas = Object.keys(registrosPorFecha);

  // 🔹 6) Construir "días agregados" (se usan para Dashboard y calendario)
  const diasAgregados = fechasTodas.map((fecha) => {
    const regsDia = registrosPorFecha[fecha];
    const horasTrabajadas = Math.round(
      regsDia.reduce((sum, r) => sum + (r.horas || 0), 0) * 100
    ) / 100;

    const just = regsDia.find((r) => r.justificacion) || null;

    // Primer ingreso del día
    const entradas = regsDia
      .map((r) => r.horaIngreso)
      .filter(Boolean)
      .sort();
    const salidas = regsDia
      .map((r) => r.horaSalida)
      .filter(Boolean)
      .sort();

    const horaIngreso = entradas.length > 0 ? entradas[0] : null;
    const horaSalida = salidas.length > 0 ? salidas[salidas.length - 1] : null;

    let estado = "falta";
    if (horasTrabajadas > 0) estado = "presente";
    if (just && just.justificacion && just.justificacion.es_justificada)
      estado = "justificada";
    if (just && just.justificacion && !just.justificacion.es_justificada)
      estado = "no_justificada";

    return {
      fecha,
      id_marcaje: regsDia.find((r) => r.id_marcaje)?.id_marcaje || null,
      horas: horasTrabajadas,
      horaIngreso,
      horaSalida,
      estado,
      observacion:
        (just && just.observacion) ||
        regsDia.find((r) => r.observacion)?.observacion ||
        null,
      justificacion: just ? just.justificacion : null,
    };
  });

  // 🔹 7) Calendario detallado por día (para WeeklyCalendar)
  const calendarioPorDia = fechasTodas
    .slice()
    .sort()
    .map((fecha) => {
      const marcajesDia = marcajesPorFecha[fecha] || [];
      const regsDia = registrosPorFecha[fecha] || [];
      const just = regsDia.find((r) => r.justificacion) || null;

      const slots = buildSlotsForDay(marcajesDia);

      const horasTrabajadas =
        Math.round(
          regsDia.reduce((sum, r) => sum + (r.horas || 0), 0) * 100
        ) / 100;

      let estado = "falta";
      if (horasTrabajadas > 0) estado = "presente";
      if (just && just.justificacion && just.justificacion.es_justificada)
        estado = "justificada";
      if (just && just.justificacion && !just.justificacion.es_justificada)
        estado = "no_justificada";

      return {
        fecha,
        horasTrabajadas,
        estado,
        observacion:
          (just && just.observacion) ||
          regsDia.find((r) => r.observacion)?.observacion ||
          null,
        justificacion: just ? just.justificacion : null,
        slots: slots.map((slot, index) =>
          slot
            ? {
                position: index + 1, // 1..4
                tipo: slot.tipo, // 'entrada' | 'salida'
                hora: slot.hora.slice(0, 5), // "HH:MM"
                id_marcaje: slot.id_marcaje,
              }
            : null
        ),
      };
    });

  // 🔹 8) Ordenar registros individuales por fecha y hora
  registrosIndividuales.sort((a, b) => {
    if (a.fecha !== b.fecha) {
      return a.fecha < b.fecha ? -1 : 1;
    }
    if (a.horaIngreso && b.horaIngreso) {
      return a.horaIngreso < b.horaIngreso ? -1 : 1;
    }
    return 0;
  });

  console.log(
    "✅ [ASISTENCIA-SERVICE] Total registros individuales procesados:",
    registrosIndividuales.length
  );

  // 🔹 9) Resumen mensual basado en días agregados (ya con colación aplicada)
  const diasUnicos = new Set(diasAgregados.map((d) => d.fecha));
  const diasConActividad = new Set(
    diasAgregados
      .filter(
        (d) =>
          d.horas > 0 ||
          (d.justificacion && d.justificacion.es_justificada === true)
      )
      .map((d) => d.fecha)
  );

  const horasTotales = diasAgregados.reduce(
    (sum, d) => sum + (d.horas || 0),
    0
  );
  const diasTrabajados = diasAgregados.filter((d) => d.horas > 0).length;
  const horasPromedio =
    diasTrabajados > 0 ? horasTotales / diasTrabajados : 0;
  const faltas = Math.max(0, diasUnicos.size - diasConActividad.size);

  return {
    // 👇 Detalle por marcaje / justificación (cada fila)
    dias: registrosIndividuales,
    // 👇 Resumen mensual ya con colación aplicada
    resumen: {
      diasTrabajados,
      diasFalta: faltas,
      horasTotales: Math.round(horasTotales * 100) / 100,
      horasPromedio: Math.round(horasPromedio * 100) / 100,
    },
    periodo: {
      mes: targetMes,
      anio: targetAnio,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
    },
    calendario: calendarioPorDia,
  };
}

/**
 * 📅 SERVICIO - OBTENER ASISTENCIA DEL USUARIO (para Mi Asistencia + Calendario)
 */
export async function getAsistenciaUsuarioService(
  rutUsuario,
  mes = null,
  anio = null
) {
  try {
    console.log(
      "📅 [ASISTENCIA-SERVICE] === OBTENIENDO ASISTENCIA (v5 individual) ==="
    );
    console.log("📅 [ASISTENCIA-SERVICE] Usuario:", rutUsuario);
    console.log("📅 [ASISTENCIA-SERVICE] Filtros:", { mes, anio });

    const { dias, resumen, periodo, calendario } =
      await obtenerMarcajesIndividuales(rutUsuario, mes, anio);

    if (!dias || dias.length === 0) {
      console.log(
        "⚠️ [ASISTENCIA-SERVICE] Sin datos de marcaje ni justificaciones"
      );
      return {
        asistencias: [],
        resumen: {
          diasTrabajados: 0,
          diasFalta: 0,
          horasTotales: 0,
          horasPromedio: 0,
        },
        periodo,
        calendario: [],
      };
    }

    // 💡 "dias" aquí son registros individuales (marcaje o justificación)
    const asistencias = dias.map((d) => ({
      id_marcaje: d.id_marcaje || null,
      id_justificacion: d.id_justificacion || null,
      fecha: d.fecha,
      horaIngreso: d.horaIngreso || null,
      horaSalida: d.horaSalida || null,
      horasTrabajadas: d.horas || 0,
      estado: d.estado || "presente",
      observacion: d.observacion || null,
      justificacion: d.justificacion || null,
      tipoMarcaje: d.tipoMarcaje || null,
      ubicacion: d.ubicacion || null,
      colacion: d.colacion || false,
      es_manual: d.es_manual || false,
    }));

    console.log(
      "✅ [ASISTENCIA-SERVICE] Total asistencias individuales:",
      asistencias.length
    );

    return {
      asistencias,
      resumen,
      periodo,
      calendario,
    };
  } catch (error) {
    console.error("❌ [ASISTENCIA-SERVICE] Error v5:", error);
    throw new Error(`Error obteniendo asistencia: ${error.message}`);
  }
}

/**
 * 📊 SERVICIO - ESTADÍSTICAS DE ASISTENCIA (alineado con reportes)
 * También aplica la REGLA DE COLACIÓN en semana actual y en el mes.
 */
export async function getEstadisticasAsistenciaService(
  rutUsuario,
  mes = null,
  anio = null
) {
  try {
    console.log(
      "📊 [ESTADISTICAS-SERVICE] === OBTENIENDO ESTADÍSTICAS v3 ==="
    );
    console.log("📊 [ESTADISTICAS-SERVICE] Usuario:", rutUsuario);

    const usuario = await Usuario.findOne({ where: { rut_usuario: rutUsuario } });
    if (!usuario) throw new Error("Usuario no encontrado");

    const horasObjetivoSemanal = 44;

    const hoy = new Date();
    const inicioSemanaActual = new Date(hoy);
    const diaSemana = inicioSemanaActual.getDay();
    const diasAlLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    inicioSemanaActual.setDate(inicioSemanaActual.getDate() - diasAlLunes);
    inicioSemanaActual.setHours(0, 0, 0, 0);

    const finSemanaActual = new Date(inicioSemanaActual);
    finSemanaActual.setDate(finSemanaActual.getDate() + 6);
    finSemanaActual.setHours(23, 59, 59, 999);

    const fechaInicioSemana = inicioSemanaActual.toISOString().split("T")[0];
    const fechaFinSemana = finSemanaActual.toISOString().split("T")[0];

    console.log(
      "📅 [ESTADISTICAS-SERVICE] Obteniendo marcajes semana actual:",
      {
        inicio: fechaInicioSemana,
        fin: fechaFinSemana,
      }
    );

    const marcajesSemana = await Marcaje.findAll({
      where: {
        rut_usuario: rutUsuario,
        fecha: {
          [Op.between]: [fechaInicioSemana, fechaFinSemana],
        },
      },
      order: [
        ["fecha", "ASC"],
        ["hora_ingreso", "ASC"],
      ],
    });

    console.log(
      "📅 [ESTADISTICAS-SERVICE] Marcajes encontrados semana:",
      marcajesSemana.length
    );

    const justificacionesSemana = await Justificacion.findAll({
      where: {
        rut_usuario: rutUsuario,
        fecha_justificacion: {
          [Op.between]: [fechaInicioSemana, fechaFinSemana],
        },
      },
    });

    console.log(
      "📅 [ESTADISTICAS-SERVICE] Justificaciones encontradas semana:",
      justificacionesSemana.length
    );

    const diasAgrupados = {};
    const marcajesSemanaPorFecha = {};

    marcajesSemana.forEach((marcaje) => {
      const fecha = marcaje.fecha;
      const horasDelMarcaje = calcularHorasEntreMarcajes(
        marcaje.hora_ingreso,
        marcaje.hora_salida
      );

      if (!diasAgrupados[fecha]) {
        diasAgrupados[fecha] = {
          fecha,
          horas: 0,
          horaIngreso: formatTimeToString(marcaje.hora_ingreso),
          horaSalida: formatTimeToString(marcaje.hora_salida),
          estado: "presente",
        };
      }

      if (!marcajesSemanaPorFecha[fecha]) {
        marcajesSemanaPorFecha[fecha] = [];
      }
      marcajesSemanaPorFecha[fecha].push(marcaje);

      diasAgrupados[fecha].horas += horasDelMarcaje;

      const horaIngresoActual = formatTimeToString(marcaje.hora_ingreso);
      if (
        horaIngresoActual &&
        (!diasAgrupados[fecha].horaIngreso ||
          horaIngresoActual < diasAgrupados[fecha].horaIngreso)
      ) {
        diasAgrupados[fecha].horaIngreso = horaIngresoActual;
      }

      const horaSalidaActual = formatTimeToString(marcaje.hora_salida);
      if (
        horaSalidaActual &&
        (!diasAgrupados[fecha].horaSalida ||
          horaSalidaActual > diasAgrupados[fecha].horaSalida)
      ) {
        diasAgrupados[fecha].horaSalida = horaSalidaActual;
      }
    });

    const justPorFechaSemana = new Map();
    justificacionesSemana.forEach((just) => {
      justPorFechaSemana.set(just.fecha_justificacion, just);
    });

    // ⚖️ REGLA COLACIÓN en semana actual (si solo hay un marcaje y >= 6h, sin justificación con horas extra)
    Object.keys(marcajesSemanaPorFecha).forEach((fecha) => {
      const lista = marcajesSemanaPorFecha[fecha];
      const just = justPorFechaSemana.get(fecha) || null;

      if (
        lista.length === 1 &&
        diasAgrupados[fecha] &&
        diasAgrupados[fecha].horas >= 6 &&
        !(just && just.es_justificada && just.horas_compensadas)
      ) {
        console.log(
          `⏱️ [ESTADISTICAS] Aplicando descuento colación 0.5h para semana actual en ${fecha}`
        );
        diasAgrupados[fecha].horas = Math.max(
          0,
          diasAgrupados[fecha].horas - 0.5
        );
      }
    });

    // Aplicar justificaciones (sumando horas compensadas donde corresponda)
    justificacionesSemana.forEach((just) => {
      const fecha = just.fecha_justificacion;

      if (!diasAgrupados[fecha]) {
        diasAgrupados[fecha] = {
          fecha,
          horas: 0,
          horaIngreso: null,
          horaSalida: null,
          estado: just.es_justificada ? "justificada" : "no_justificada",
        };
      }

      if (just.es_justificada && just.horas_compensadas) {
        diasAgrupados[fecha].horas += Number(just.horas_compensadas);
        console.log(
          `✅ [ESTADISTICAS] Sumando ${just.horas_compensadas}h compensadas para ${fecha}`
        );
      }
    });

    const diasSemanaArr = Object.values(diasAgrupados);

    console.log(
      "📅 [ESTADISTICAS-SERVICE] Días agrupados semana:",
      diasSemanaArr.map((d) => ({ fecha: d.fecha, horas: d.horas }))
    );

    if (diasSemanaArr.length === 0) {
      return {
        horasObjetivo: horasObjetivoSemanal,
        horasReales: 0,
        porcentajeCumplimiento: 0,
        tendenciaSemanal: [],
        diasMasProductivos: [],
        promedioHoraIngreso: "00:00",
      };
    }

    const horasRealesSemana = diasSemanaArr.reduce(
      (sum, d) => sum + d.horas,
      0
    );

    console.log("📅 [ESTADISTICAS-SERVICE] Resultado semana actual:", {
      diasEncontrados: diasSemanaArr.length,
      horasTotales: horasRealesSemana,
    });

    const porcentajeCumplimiento =
      (horasRealesSemana / horasObjetivoSemanal) * 100;

    // 🔹 Obtener resumen mensual usando el mismo core (ya con colación)
    const { dias: marcajesIndividualesMes } =
      await obtenerMarcajesIndividuales(rutUsuario, mes, anio);

    const diasAgrupadosMes = {};
    marcajesIndividualesMes.forEach((marcaje) => {
      const fecha = marcaje.fecha;
      if (!diasAgrupadosMes[fecha]) {
        diasAgrupadosMes[fecha] = {
          fecha,
          horas: 0,
          horaIngreso: marcaje.horaIngreso,
          horaSalida: marcaje.horaSalida,
          estado: marcaje.estado,
        };
      }
      diasAgrupadosMes[fecha].horas += marcaje.horas;
    });

    const diasMes = Object.values(diasAgrupadosMes);

    const tendenciaSemanal = [];
    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(inicioSemana.getDate() - (i * 7 + 7));

      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() - i * 7);

      const diasSemana = diasMes.filter((d) => {
        const f = new Date(d.fecha + "T00:00:00");
        return f >= inicioSemana && f < finSemana;
      });

      const horasSemana = diasSemana.reduce((sum, d) => sum + d.horas, 0);

      tendenciaSemanal.push({
        semana: `Semana ${4 - i}`,
        horas: Math.round(horasSemana * 100) / 100,
        dias: diasSemana.length,
      });
    }

    const diasMasProductivos = [...diasMes]
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5)
      .map((d) => ({
        fecha: d.fecha,
        horas: d.horas,
        horaIngreso: d.horaIngreso || "00:00",
      }));

    const horasIngresoMin = diasSemanaArr
      .filter((d) => d.horaIngreso)
      .map((d) => {
        const str = formatTimeToString(d.horaIngreso) || "00:00:00";
        const [h, m] = str.split(":").map(Number);
        return h * 60 + m;
      });

    const promedioMinutos =
      horasIngresoMin.length > 0
        ? horasIngresoMin.reduce((s, v) => s + v, 0) / horasIngresoMin.length
        : 0;

    const hProm = Math.floor(promedioMinutos / 60);
    const mProm = Math.floor(promedioMinutos % 60);
    const promedioHoraIngreso = `${hProm.toString().padStart(2, "0")}:${mProm
      .toString()
      .padStart(2, "0")}`;

    console.log("✅ [ESTADISTICAS-SERVICE] v3 OK");

    return {
      horasObjetivo: horasObjetivoSemanal,
      horasReales: Math.round(horasRealesSemana * 100) / 100,
      porcentajeCumplimiento: Math.round(porcentajeCumplimiento * 100) / 100,
      tendenciaSemanal,
      diasMasProductivos,
      promedioHoraIngreso,
    };
  } catch (error) {
    console.error("❌ [ESTADISTICAS-SERVICE] Error v3:", error);
    throw new Error(`Error obteniendo estadísticas: ${error.message}`);
  }
}

/**
 * ✅ CREAR JUSTIFICACIÓN simple (la compleja la tienes en otro service)
 */
export async function crearJustificacionService(
  rutUsuario,
  datosJustificacion
) {
  try {
    console.log("📝 [JUSTIFICACION-SERVICE] === CREANDO ===");

    const { fecha, fecha_justificacion, motivo, descripcion } =
      datosJustificacion;

    const fechaFinal = fecha || fecha_justificacion;

    if (!fechaFinal || !motivo) {
      throw new Error("Fecha y motivo son requeridos");
    }

    const nuevaJustificacion = await Justificacion.create({
      rut_usuario: rutUsuario,
      fecha_justificacion: fechaFinal,
      motivo,
      descripcion: descripcion && descripcion.trim() !== "" ? descripcion : null,
      es_justificada: false,
      horas_compensadas: 0,
      estado: "REGISTRADA",
      observaciones: null,
    });

    console.log(
      "✅ [JUSTIFICACION-SERVICE] Creada:",
      nuevaJustificacion.id_justificacion
    );

    return {
      id: nuevaJustificacion.id_justificacion,
      fecha: nuevaJustificacion.fecha_justificacion,
      estado: nuevaJustificacion.estado,
      motivo: nuevaJustificacion.motivo,
    };
  } catch (error) {
    console.error("❌ [JUSTIFICACION-SERVICE] Error:", error);
    throw new Error(`Error creando justificación: ${error.message}`);
  }
}

/**
 * 📋 OBTENER JUSTIFICACIONES DEL USUARIO
 */
export async function getJustificacionesUsuarioService(rutUsuario) {
  try {
    console.log("📋 [JUSTIFICACIONES-SERVICE] === OBTENIENDO ===");

    const justificaciones = await Justificacion.findAll({
      where: { rut_usuario: rutUsuario },
      order: [["fecha_registro", "DESC"]],
    });

    console.log(
      "📋 [JUSTIFICACIONES-SERVICE] Encontradas:",
      justificaciones.length
    );

    return justificaciones.map((j) => ({
      id: j.id_justificacion,
      fecha: j.fecha_justificacion,
      motivo: j.motivo,
      descripcion: j.descripcion,
      es_justificada: j.es_justificada,
      horas_compensadas: Number(j.horas_compensadas) || 0,
      estado: j.estado,
      observaciones: j.observaciones,
      fecha_registro: j.fecha_registro,
    }));
  } catch (error) {
    console.error("❌ [JUSTIFICACIONES-SERVICE] Error:", error);
    throw new Error(`Error obteniendo justificaciones: ${error.message}`);
  }
}
