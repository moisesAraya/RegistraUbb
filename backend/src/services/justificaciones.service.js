"use strict";

import { Op } from "sequelize";
import Justificacion from "../entities/justificacion.entity.js";

/**
 * 📋 Catálogo de motivos
 * (coincide con lo que muestras en el controller / front)
 */
const MOTIVOS_JUSTIFICACION = [
  { id: "congreso", nombre: "Congreso", es_justificada: true, horas_compensadas: 8 },
  { id: "charla", nombre: "Charla / Capacitación", es_justificada: true, horas_compensadas: 8 },
  { id: "enfermedad", nombre: "Enfermedad", es_justificada: true, horas_compensadas: 8 },
  { id: "personal", nombre: "Motivo personal", es_justificada: false, horas_compensadas: 0 },
  { id: "otro", nombre: "Otro", es_justificada: false, horas_compensadas: 0 },
  {
    id: "permiso_administrativo",
    nombre: "Permiso administrativo",
    es_justificada: true,
    horas_compensadas: 8,   // valor por defecto (jornada completa)
    permite_media_jornada: true,
  },
];

/**
 * ✅ Export usado por el controller (si algún día lo llamas desde ahí)
 */
export async function getMotivosJustificacion() {
  console.log("📋 [JUSTIFICACIONES-SERVICE] Obteniendo motivos...");
  return MOTIVOS_JUSTIFICACION;
}

/**
 * ✅ Validar fecha de justificación (últimos 30 días, no futura)
 */
export function validarFechaJustificacion(fechaStr) {
  if (!fechaStr) {
    throw new Error("Fecha de justificación requerida");
  }

  // yyyy-mm-dd → Date
  const fecha = new Date(fechaStr + "T00:00:00");
  if (Number.isNaN(fecha.getTime())) {
    throw new Error("Fecha de justificación inválida");
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const hace30 = new Date(hoy);
  hace30.setDate(hoy.getDate() - 30);

  if (fecha > hoy) {
    throw new Error("No puedes justificar fechas futuras");
  }
  if (fecha < hace30) {
    throw new Error("Solo puedes justificar fechas de los últimos 30 días");
  }
}

/**
 * 📝 CREAR JUSTIFICACIÓN
 * datosJustificacion: { fecha_justificacion, motivo, descripcion, tipo? }
 */
export async function crearJustificacion(rutUsuario, datosJustificacion) {
  console.log("📝 [JUSTIFICACIONES-SERVICE] === CREAR ===");
  console.log("📥 Datos:", datosJustificacion);

  const {
    fecha,
    fecha_justificacion,
    motivo,
    descripcion,
    tipo, // usado para permiso_administrativo (jornada_completa | media_manana | media_tarde)
  } = datosJustificacion;

  const fechaFinal = fecha || fecha_justificacion;

  if (!fechaFinal || !motivo) {
    throw new Error("Fecha y motivo son requeridos");
  }

  // Validar fecha (mismo criterio que en el controller)
  validarFechaJustificacion(fechaFinal);

  // Validar motivo
  const motivoConfig = MOTIVOS_JUSTIFICACION.find((m) => m.id === motivo);
  if (!motivoConfig) {
    console.error("❌ Motivo no válido:", motivo);
    throw new Error("Motivo de justificación no válido");
  }

  // Evitar duplicado por fecha
  const existente = await Justificacion.findOne({
    where: {
      rut_usuario: rutUsuario,
      fecha_justificacion: fechaFinal,
    },
  });

  if (existente) {
    throw new Error("Ya existe una justificación para esta fecha");
  }

  // Calcular horas y estado
  let esJustificada = !!motivoConfig.es_justificada;
  let horasCompensadas = Number(motivoConfig.horas_compensadas) || 0;

  // Lógica especial permiso administrativo
  if (motivo === "permiso_administrativo") {
    switch (tipo) {
      case "jornada_completa":
        horasCompensadas = 8;
        break;
      case "media_manana":
      case "media_tarde":
        horasCompensadas = 4;
        break;
      default:
        // si el front aún no manda tipo, asumimos jornada completa
        horasCompensadas = 8;
        break;
    }
    esJustificada = true;
  }

  const nueva = await Justificacion.create({
    rut_usuario: rutUsuario,
    fecha_justificacion: fechaFinal,
    motivo,
    descripcion: descripcion && descripcion.trim() !== "" ? descripcion : null,
    es_justificada: esJustificada,
    horas_compensadas: horasCompensadas,
    estado: "REGISTRADA",
    observaciones: null,
  });

  console.log(
    "✅ [JUSTIFICACIONES-SERVICE] Creada:",
    nueva.id_justificacion,
    "-",
    horasCompensadas,
    "h"
  );

  const motivoNombre =
    MOTIVOS_JUSTIFICACION.find((m) => m.id === nueva.motivo)?.nombre ||
    nueva.motivo;

  return {
    id_justificacion: nueva.id_justificacion,
    fecha_justificacion: nueva.fecha_justificacion,
    motivo: nueva.motivo,
    motivo_nombre: motivoNombre,
    descripcion: nueva.descripcion,
    es_justificada: nueva.es_justificada,
    horas_compensadas: Number(nueva.horas_compensadas) || 0,
    estado: nueva.estado,
    observaciones: nueva.observaciones,
    fecha_registro: nueva.fecha_registro,
  };
}

/**
 * 📋 OBTENER JUSTIFICACIONES DEL USUARIO (con filtros + estadísticas)
 * filtros: { estado, mes, anio, fecha_desde, fecha_hasta, limit }
 */
export async function getJustificacionesUsuario(rutUsuario, filtros = {}) {
  console.log("📋 [JUSTIFICACIONES-SERVICE] === LISTAR ===");
  console.log("📋 Filtros:", filtros);

  const {
    estado,
    mes,
    anio,
    fecha_desde,
    fecha_hasta,
    limit = 50,
  } = filtros;

  const where = {
    rut_usuario: rutUsuario,
  };

  // 📅 Filtro por rango de fechas
  if (fecha_desde || fecha_hasta || (mes && anio)) {
    let desde = fecha_desde || null;
    let hasta = fecha_hasta || null;

    if (mes && anio && !fecha_desde && !fecha_hasta) {
      // si sólo viene mes/anio, armamos 1..último día
      const m = Number(mes);
      const y = Number(anio);
      const first = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const last = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      desde = first;
      hasta = last;
    }

    where.fecha_justificacion = {};
    if (desde) where.fecha_justificacion[Op.gte] = desde;
    if (hasta) where.fecha_justificacion[Op.lte] = hasta;
  }

  // Filtro por estado simple (REGISTRADA, etc.) si lo usas
  if (estado) {
    where.estado = estado;
  }

  const justificaciones = await Justificacion.findAll({
    where,
    order: [["fecha_registro", "DESC"]],
    limit,
  });

  const mapped = justificaciones.map((j) => {
    const motivoConfig = MOTIVOS_JUSTIFICACION.find((m) => m.id === j.motivo);

    return {
      id_justificacion: j.id_justificacion,
      fecha_justificacion: j.fecha_justificacion,
      motivo: j.motivo,
      motivo_nombre: motivoConfig?.nombre || j.motivo,
      descripcion: j.descripcion,
      es_justificada: j.es_justificada,
      horas_compensadas: Number(j.horas_compensadas) || 0,
      estado: j.estado,
      observaciones: j.observaciones,
      fecha_registro: j.fecha_registro,
    };
  });

  // 📊 Estadísticas para el widget del front
  const total = mapped.length;
  const justificadas = mapped.filter((j) => j.es_justificada).length;
  const no_justificadas = total - justificadas;
  const horas_compensadas_total = mapped
    .filter((j) => j.es_justificada)
    .reduce((sum, j) => sum + (j.horas_compensadas || 0), 0);

  const estadisticas = {
    total,
    justificadas,
    no_justificadas,
    horas_compensadas_total,
  };

  return {
    justificaciones: mapped,
    estadisticas,
  };
}

/**
 * 🔍 DETALLE DE UNA JUSTIFICACIÓN
 */
export async function getDetalleJustificacion(idJustificacion, rutUsuario) {
  console.log("🔍 [JUSTIFICACIONES-SERVICE] Detalle:", {
    idJustificacion,
    rutUsuario,
  });

  const just = await Justificacion.findOne({
    where: {
      id_justificacion: idJustificacion,
      rut_usuario: rutUsuario,
    },
  });

  if (!just) {
    throw new Error("Justificación no encontrada");
  }

  const motivoConfig = MOTIVOS_JUSTIFICACION.find((m) => m.id === just.motivo);

  return {
    id_justificacion: just.id_justificacion,
    fecha_justificacion: just.fecha_justificacion,
    motivo: just.motivo,
    motivo_nombre: motivoConfig?.nombre || just.motivo,
    descripcion: just.descripcion,
    es_justificada: just.es_justificada,
    horas_compensadas: Number(just.horas_compensadas) || 0,
    estado: just.estado,
    observaciones: just.observaciones,
    fecha_registro: just.fecha_registro,
  };
}

/**
 * ✏️ ACTUALIZAR JUSTIFICACIÓN
 */
export async function actualizarJustificacion(
  idJustificacion,
  rutUsuario,
  datosActualizacion
) {
  console.log("✏️ [JUSTIFICACIONES-SERVICE] Actualizar:", {
    idJustificacion,
    rutUsuario,
    datosActualizacion,
  });

  const just = await Justificacion.findOne({
    where: {
      id_justificacion: idJustificacion,
      rut_usuario: rutUsuario,
    },
  });

  if (!just) {
    throw new Error("Justificación no encontrada");
  }

  // Por ahora permitimos actualizar sólo descripción / observaciones
  if (datosActualizacion.descripcion !== undefined) {
    just.descripcion =
      datosActualizacion.descripcion &&
      datosActualizacion.descripcion.trim() !== ""
        ? datosActualizacion.descripcion
        : null;
  }

  if (datosActualizacion.observaciones !== undefined) {
    just.observaciones =
      datosActualizacion.observaciones &&
      datosActualizacion.observaciones.trim() !== ""
        ? datosActualizacion.observaciones
        : null;
  }

  await just.save();

  const motivoConfig = MOTIVOS_JUSTIFICACION.find((m) => m.id === just.motivo);

  return {
    id_justificacion: just.id_justificacion,
    fecha_justificacion: just.fecha_justificacion,
    motivo: just.motivo,
    motivo_nombre: motivoConfig?.nombre || just.motivo,
    descripcion: just.descripcion,
    es_justificada: just.es_justificada,
    horas_compensadas: Number(just.horas_compensadas) || 0,
    estado: just.estado,
    observaciones: just.observaciones,
    fecha_registro: just.fecha_registro,
  };
}

/**
 * 🗑️ CANCELAR / ELIMINAR JUSTIFICACIÓN
 * (usado por eliminarJustificacionController)
 */
export async function cancelarJustificacion(idJustificacion, rutUsuario) {
  console.log("🗑️ [JUSTIFICACIONES-SERVICE] Eliminar:", {
    idJustificacion,
    rutUsuario,
  });

  const just = await Justificacion.findOne({
    where: {
      id_justificacion: idJustificacion,
      rut_usuario: rutUsuario,
    },
  });

  if (!just) {
    throw new Error("Justificación no encontrada");
  }

  await just.destroy();

  return {
    id_justificacion: idJustificacion,
    eliminado: true,
  };
}

console.log("📋 [JUSTIFICACIONES-SERVICE] ✅ Servicio cargado");
