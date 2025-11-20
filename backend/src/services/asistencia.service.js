"use strict";

import { Op } from "sequelize";
import Usuario from "../entities/usuario.entity.js";
import Marcaje from "../entities/marcaje.entity.js";
import Justificacion from "../entities/justificacion.entity.js";

console.log("🎯 [ASISTENCIA-SERVICE] v4 CARGADO (solo Marcaje + Justificacion, sin tabla Asistencia ni RegistroMarcaje)");

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
  if (typeof value === "object" && value !== null && value.hours !== undefined) {
    const h = String(value.hours).padStart(2, "0");
    const m = String(value.minutes || 0).padStart(2, "0");
    const s = String(value.seconds || 0).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // 4) Cualquier otro caso
  return null;
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
 * 🧠 Construye la "foto" de cada día del mes:
 * - Suma TODAS las parejas ingreso/salida del día (directamente desde Marcaje)
 * - Suma TODAS las parejas ingreso/salida del día (tabla Marcaje)
 * - Mezcla Justificacion (es_justificada / horas_compensadas)
 */
async function obtenerMarcajesIndividuales(rutUsuario, mes = null, anio = null) {
  const now = new Date();
  const targetAnio = anio ? parseInt(anio) : now.getFullYear();
  const targetMes = mes ? parseInt(mes) : now.getMonth() + 1;

  const startDate = new Date(targetAnio, targetMes - 1, 1);
  const endDate = new Date(targetAnio, targetMes, 0);

  const fechaInicioStr = startDate.toISOString().split("T")[0];
  const fechaFinStr = endDate.toISOString().split("T")[0];

  console.log("📅 [ASISTENCIA-SERVICE] Rango v4:", fechaInicioStr, "a", fechaFinStr);

  // 🔹 1) Marcajes del usuario en el mes (sin RegistroMarcaje)
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

  console.log("📋 [ASISTENCIA-SERVICE] Justificaciones encontradas:", justificaciones.length);

  // Agrupar marcajes por fecha
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

  // 🔹 3) Convertir cada marcaje individual a un registro separado
  const registrosIndividuales = [];

  // Procesar cada marcaje por separado
  marcajes.forEach((marcaje) => {
    const fecha = marcaje.fecha;
    const horasDelMarcaje = calcularHorasEntreMarcajes(marcaje.hora_ingreso, marcaje.hora_salida);
    
    registrosIndividuales.push({
      id_marcaje: marcaje.id_marcaje,
      fecha: fecha,
      horas: Math.round(horasDelMarcaje * 100) / 100,
      horaIngreso: formatTimeToString(marcaje.hora_ingreso),
      horaSalida: formatTimeToString(marcaje.hora_salida),
      estado: horasDelMarcaje > 0 ? "presente" : "falta",
      observacion: marcaje.observacion,
      justificacion: null, // Los marcajes no tienen justificación directa
    });
  });

  // Procesar justificaciones como registros separados
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

  // Conjunto de todas las fechas con algo (marcaje o justificación)
  const fechasTodas = new Set([
    ...Object.keys(marcajesPorFecha),
    ...Array.from(justPorFecha.keys()),
  ]);

  // Construir "días con horas"
  const dias = Array.from(fechasTodas).map((fecha) => {
    const marcajes = marcajesPorFecha[fecha] || [];
    const just = justPorFecha.get(fecha) || null;

    // Sumar todas las parejas ingreso/salida del día
    let horasTrabajadas = marcajes.reduce(
      (sum, m) => sum + calcularHorasEntreMarcajes(m.hora_ingreso, m.hora_salida),
      0
    );

    // Agregar horas compensadas de justificación justificada
    if (just && just.es_justificada) {
      const horasExtra = Number(just.horas_compensadas) || 0;
      horasTrabajadas += horasExtra;
    }

    horasTrabajadas = Math.max(0, Math.min(14, horasTrabajadas));
    horasTrabajadas = Math.round(horasTrabajadas * 100) / 100;

    // ⭐ Hora de ingreso = la más temprana del día + id_marcaje elegido para edición
    let horaIngreso = null;
    let idMarcaje = null;
    if (marcajes.length > 0) {
      const entradasOrdenadas = marcajes
        .map((m) => ({
          id_marcaje: m.id_marcaje,
          hora: formatTimeToString(m.hora_ingreso),
        }))
        .filter((x) => !!x.hora)
        .sort((a, b) => a.hora.localeCompare(b.hora));

      if (entradasOrdenadas.length > 0) {
        horaIngreso = entradasOrdenadas[0].hora;
        idMarcaje = entradasOrdenadas[0].id_marcaje;
      }
    }

    // Hora de salida = la más tardía del día
    let horaSalida = null;
    if (marcajes.length > 0) {
      const horasSalida = marcajes
        .map((m) => formatTimeToString(m.hora_salida))
        .filter(Boolean)
        .sort();
      horaSalida = horasSalida[horasSalida.length - 1] || null;
    }

    // Determinar estado del día
    let estado = "falta";
    if (horasTrabajadas > 0) {
      estado = "presente";
    }
    if (just && just.es_justificada) {
      estado = "justificada";
    }

    return {
      fecha, // "YYYY-MM-DD"
      id_marcaje: idMarcaje,                 // ⭐ referencia al marcaje principal del día
      horas: horasTrabajadas,
      horaIngreso,
      horaSalida,
      estado,
      observacion:
        (just && just.observaciones) ||
        (marcajes[0] && marcajes[0].observacion) ||
        null,
      justificacion: just
        ? {
            motivo: just.motivo,
            descripcion: just.descripcion,
            es_justificada: just.es_justificada,
            horas_compensadas: Number(just.horas_compensadas) || 0,
          }
        : null,
    };
  });

  // Ordenar todos los registros por fecha y hora
  registrosIndividuales.sort((a, b) => {
    if (a.fecha !== b.fecha) {
      return a.fecha < b.fecha ? -1 : 1;
    }
    // Mismo día, ordenar por hora de ingreso
    if (a.horaIngreso && b.horaIngreso) {
      return a.horaIngreso < b.horaIngreso ? -1 : 1;
    }
    return 0;
  });

  console.log("✅ [ASISTENCIA-SERVICE] Total registros individuales procesados:", registrosIndividuales.length);

  // Calcular resumen basado en registros individuales
  const diasUnicos = new Set(registrosIndividuales.map(r => r.fecha));
  const diasConMarcajes = new Set(
    registrosIndividuales.filter(r => r.id_marcaje && (r.horas || 0) > 0).map(r => r.fecha)
  );
  
  // Sumar todas las horas de todos los registros individuales
  const horasTotales = registrosIndividuales.reduce((sum, r) => sum + (r.horas || 0), 0);
  const diasTrabajados = diasConMarcajes.size;
  const horasPromedio = diasTrabajados > 0 ? horasTotales / diasTrabajados : 0;
  
  // Contar faltas (días sin marcajes válidos y sin justificaciones aprobadas)
  const diasConJustificacionAprobada = new Set(
    registrosIndividuales.filter(r => r.estado === 'justificada' && r.justificacion && r.justificacion.es_justificada).map(r => r.fecha)
  );
  const diasConActividad = new Set([...diasConMarcajes, ...diasConJustificacionAprobada]);
  const faltas = Math.max(0, diasUnicos.size - diasConActividad.size);

  return {
    dias: registrosIndividuales,
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
  };
}

/**
 * 📅 SERVICIO - OBTENER ASISTENCIA DEL USUARIO (para Mi Asistencia + Calendario)
 */
export async function getAsistenciaUsuarioService(rutUsuario, mes = null, anio = null) {
  try {
    console.log("📅 [ASISTENCIA-SERVICE] === OBTENIENDO ASISTENCIA (v5 individual) ===");
    console.log("📅 [ASISTENCIA-SERVICE] Usuario:", rutUsuario);
    console.log("📅 [ASISTENCIA-SERVICE] Filtros:", { mes, anio });

    const { dias, resumen, periodo } = await obtenerMarcajesIndividuales(rutUsuario, mes, anio);

    if (!dias || dias.length === 0) {
      console.log("⚠️ [ASISTENCIA-SERVICE] Sin datos de marcaje ni justificaciones");
      return {
        asistencias: [],
        resumen: {
          diasTrabajados: 0,
          horasTotales: 0,
          horasPromedio: 0,
          faltas: 0,
        },
        periodo,
      };
    }

    // 🧠 Prioridad de estado para combinar varios registros del mismo día
    const estadoPriority = {
      no_justificada: 4,
      falta: 3,
      justificada: 2,
      presente: 1,
      undefined: 0,
      null: 0,
      "": 0,
    };

    // 1) Agrupar por fecha → un sólo objeto por día
    const diasPorFecha = new Map(); // fecha -> objeto agregado

    for (const d of dias) {
      const fecha = d.fecha;
      if (!fecha) continue;

      const existente = diasPorFecha.get(fecha);

      if (!existente) {
        // Primer registro de ese día
        diasPorFecha.set(fecha, { ...d });
      } else {
        // Ya había algo para ese día → fusionamos
        const estadoNuevo = d.estado;
        const estadoExistente = existente.estado;

        const estadoFinal =
          (estadoPriority[estadoNuevo] || 0) >= (estadoPriority[estadoExistente] || 0)
            ? estadoNuevo
            : estadoExistente;

        // 🔹 Horas: nos quedamos con las del "último" registro (normalmente el ajuste manual)
        const horasFinal = d.horas != null ? d.horas : existente.horas;

        // 🔹 Justificación: preferimos la que exista
        const justificacionFinal = existente.justificacion || d.justificacion || null;

        // 🔹 Observación: concatenamos textos para tener trazabilidad
        const observacionFinal = [existente.observacion, d.observacion]
          .filter(Boolean)
          .join(" | ");

        diasPorFecha.set(fecha, {
          ...existente,
          ...d,
          horas: horasFinal,
          estado: estadoFinal,
          justificacion: justificacionFinal,
          observacion: observacionFinal || null,
          // ⭐ mantenemos id_marcaje si ya estaba seteado
          id_marcaje: existente.id_marcaje || d.id_marcaje || null,
        });
      }
    }

    // 2) Convertir Map a Array para procesamiento
    const diasAgrupados = Array.from(diasPorFecha.values());

    // 3) Construir array para frontend (Mi Asistencia)
    const asistencias = diasAgrupados.map((d) => ({
      id_marcaje: d.id_marcaje || null,      // ⭐ ahora viaja al frontend
      fecha: d.fecha,
      horaIngreso: d.horaIngreso,
      horaSalida: d.horaSalida,
      horasTrabajadas: d.horas || 0,
      estado: d.estado, // 'presente' | 'justificada' | 'no_justificada' | 'falta'
      observacion: d.observacion,
      tipoMarcaje: d.justificacion ? "justificacion" : "qr",
      ubicacion: d.justificacion ? "Justificación" : "Campus",
      justificacion: d.justificacion,
    }));

    console.log("✅ [ASISTENCIA-SERVICE] Resumen v6 (marcajes individuales):", resumen);
    console.log("✅ [ASISTENCIA-SERVICE] Total registros individuales mostrados:", asistencias.length);

    return {
      asistencias,
      resumen,
      periodo,
    };
  } catch (error) {
    console.error("❌ [ASISTENCIA-SERVICE] Error v5:", error);
    throw new Error(`Error obteniendo asistencia: ${error.message}`);
  }
}


/**
 * 📊 SERVICIO - ESTADÍSTICAS DE ASISTENCIA (alineado con reportes)
 */
export async function getEstadisticasAsistenciaService(
  rutUsuario,
  mes = null,
  anio = null
) {
  try {
    console.log("📊 [ESTADISTICAS-SERVICE] === OBTENIENDO ESTADÍSTICAS v3 ===");
    console.log("📊 [ESTADISTICAS-SERVICE] Usuario:", rutUsuario);

    const usuario = await Usuario.findOne({ where: { rut_usuario: rutUsuario } });
    if (!usuario) throw new Error("Usuario no encontrado");

    // 44 horas semanales
    const horasObjetivoSemanal = 44;
    const horasObjetivoDiario = 8;

    // Calcular fechas de la semana actual PRIMERO
    const hoy = new Date();
    const inicioSemanaActual = new Date(hoy);
    const diaSemana = inicioSemanaActual.getDay();
    const diasAlLunes = diaSemana === 0 ? 6 : diaSemana - 1; // Lunes = 0
    inicioSemanaActual.setDate(inicioSemanaActual.getDate() - diasAlLunes);
    inicioSemanaActual.setHours(0, 0, 0, 0);

    const finSemanaActual = new Date(inicioSemanaActual);
    finSemanaActual.setDate(finSemanaActual.getDate() + 6);
    finSemanaActual.setHours(23, 59, 59, 999);

    // Obtener marcajes solo de la semana actual
    const fechaInicioSemana = inicioSemanaActual.toISOString().split("T")[0];
    const fechaFinSemana = finSemanaActual.toISOString().split("T")[0];

    console.log("📅 [ESTADISTICAS-SERVICE] Obteniendo marcajes semana actual:", {
      inicio: fechaInicioSemana,
      fin: fechaFinSemana
    });

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

    console.log("📅 [ESTADISTICAS-SERVICE] Marcajes encontrados semana:", marcajesSemana.length);

    // 🆕 OBTENER JUSTIFICACIONES DE LA SEMANA TAMBIÉN
    const justificacionesSemana = await Justificacion.findAll({
      where: {
        rut_usuario: rutUsuario,
        fecha_justificacion: {
          [Op.between]: [fechaInicioSemana, fechaFinSemana],
        },
      },
    });

    console.log("📅 [ESTADISTICAS-SERVICE] Justificaciones encontradas semana:", justificacionesSemana.length);
    
    // Convertir marcajes de la semana a formato de días agrupados
    const diasAgrupados = {};
    
    // Procesar marcajes
    marcajesSemana.forEach(marcaje => {
      const fecha = marcaje.fecha;
      const horasDelMarcaje = calcularHorasEntreMarcajes(marcaje.hora_ingreso, marcaje.hora_salida);
      
      if (!diasAgrupados[fecha]) {
        diasAgrupados[fecha] = {
          fecha,
          horas: 0,
          horaIngreso: formatTimeToString(marcaje.hora_ingreso),
          horaSalida: formatTimeToString(marcaje.hora_salida),
          estado: 'presente',
        };
      }
      
      diasAgrupados[fecha].horas += horasDelMarcaje;
      
      // Mantener la hora de ingreso más temprana
      const horaIngresoActual = formatTimeToString(marcaje.hora_ingreso);
      if (horaIngresoActual && (!diasAgrupados[fecha].horaIngreso || horaIngresoActual < diasAgrupados[fecha].horaIngreso)) {
        diasAgrupados[fecha].horaIngreso = horaIngresoActual;
      }
      
      // Mantener la hora de salida más tardía
      const horaSalidaActual = formatTimeToString(marcaje.hora_salida);
      if (horaSalidaActual && (!diasAgrupados[fecha].horaSalida || horaSalidaActual > diasAgrupados[fecha].horaSalida)) {
        diasAgrupados[fecha].horaSalida = horaSalidaActual;
      }
    });

    // 🆕 PROCESAR JUSTIFICACIONES (sumar horas compensadas de justificaciones aprobadas)
    justificacionesSemana.forEach(just => {
      const fecha = just.fecha_justificacion;
      
      if (!diasAgrupados[fecha]) {
        diasAgrupados[fecha] = {
          fecha,
          horas: 0,
          horaIngreso: null,
          horaSalida: null,
          estado: just.es_justificada ? 'justificada' : 'no_justificada',
        };
      }
      
      // Solo sumar horas si la justificación está aprobada
      if (just.es_justificada && just.horas_compensadas) {
        diasAgrupados[fecha].horas += Number(just.horas_compensadas);
        console.log(`✅ [ESTADISTICAS] Sumando ${just.horas_compensadas}h compensadas para ${fecha}`);
      }
    });
    
    const dias = Object.values(diasAgrupados);
    
    console.log("📅 [ESTADISTICAS-SERVICE] Días agrupados semana:", dias.map(d => ({fecha: d.fecha, horas: d.horas})));

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

    // Horas reales de la SEMANA ACTUAL (ya filtradas arriba)
    const horasRealesSemana = dias.reduce((sum, d) => sum + d.horas, 0);
    
    console.log("📅 [ESTADISTICAS-SERVICE] Resultado semana actual:", {
      diasEncontrados: dias.length,
      horasTotales: horasRealesSemana
    });

    // Calcular porcentaje de cumplimiento semanal (44 horas = 100%)
    const porcentajeCumplimiento = (horasRealesSemana / horasObjetivoSemanal) * 100;

    // Para tendencias semanales y días más productivos, necesitamos datos del mes completo
    const { dias: marcajesIndividualesMes } = await obtenerMarcajesIndividuales(rutUsuario, mes, anio);
    
    // Agrupar marcajes del mes completo por día
    const diasAgrupadosMes = {};
    marcajesIndividualesMes.forEach(marcaje => {
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

    // Tendencia semanal (basada en datos del mes)
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

    // Días más productivos (basado en datos del mes)
    const diasMasProductivos = [...diasMes]
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5)
      .map((d) => ({
        fecha: d.fecha,
        horas: d.horas,
        horaIngreso: d.horaIngreso || "00:00",
      }));

    // Promedio hora de ingreso (solo días con marcaje real)
    const horasIngresoMin = dias
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
      horasObjetivo: horasObjetivoSemanal, // Cambiar a objetivo semanal (44h)
      horasReales: Math.round(horasRealesSemana * 100) / 100, // Horas de la semana actual
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
 * 📝 CREAR JUSTIFICACIÓN
 */
export async function crearJustificacionService(rutUsuario, datosJustificacion) {
  try {
    console.log('📝 [JUSTIFICACION-SERVICE] === CREANDO ===');

    const {
      fecha,
      fecha_justificacion,
      motivo,
      descripcion,
      tipo
    } = datosJustificacion;

    const fechaFinal = fecha || fecha_justificacion;

    if (!fechaFinal || !motivo) {
      throw new Error('Fecha y motivo son requeridos');
    }

    const justificacionExistente = await Justificacion.findOne({
      where: {
        rut_usuario: rutUsuario,
        fecha_justificacion: fechaFinal
      }
    });

    if (justificacionExistente) {
      throw new Error('Ya existe una justificación para esta fecha');
    }

    const nuevaJustificacion = await Justificacion.create({
      rut_usuario: rutUsuario,
      fecha_justificacion: fechaFinal,
      motivo,
      descripcion: descripcion && descripcion.trim() !== '' ? descripcion : null,
      es_justificada: false,
      horas_compensadas: 0,
      estado: 'REGISTRADA',
      observaciones: null
    });

    console.log('✅ [JUSTIFICACION-SERVICE] Creada:', nuevaJustificacion.id_justificacion);

    return {
      id: nuevaJustificacion.id_justificacion,
      fecha: nuevaJustificacion.fecha_justificacion,
      estado: nuevaJustificacion.estado,
      motivo: nuevaJustificacion.motivo
    };

  } catch (error) {
    console.error('❌ [JUSTIFICACION-SERVICE] Error:', error);
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
