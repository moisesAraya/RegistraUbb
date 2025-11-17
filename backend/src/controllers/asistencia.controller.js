"use strict";

import {
  getAsistenciaUsuarioService,
  getEstadisticasAsistenciaService,
  crearJustificacionService,
  getJustificacionesUsuarioService
} from '../services/asistencia.service.js';
import { 
  getCompleteMetrics, 
  getRealTimeData, 
  getAdvancedAnalytics,  
  getDebugInfo 
} from '../services/dashboard.service.js';

import Marcaje from '../entities/marcaje.entity.js';
import RegistroMarcaje from '../entities/registro_marcaje.entity.js';
import Totem from '../entities/totem.entity.js';

console.log('👤 [ASISTENCIA-CTRL] ✅ CONTROLLER CARGADO ✅');
console.log('🚀 [DASHBOARD-CONTROLLER] Controller cargado y conectado con service real');

/**
 * 🧱 Helper: construir timestamp ISO a partir de fecha + hora
 */
/**
 * 🧱 Helper: construir timestamp local CL a partir de fecha + hora
 */
function buildTimestamp(fecha, hora) {
  if (!fecha || !hora) return null;

  // Normalizar hora a HH:MM:SS
  const time = hora.length === 5 ? `${hora}:00` : hora;

  // 📌 Forzamos zona horaria Chile (-03:00) para evitar desfase 8 → 5
  const isoWithOffset = `${fecha}T${time}-03:00`;

  // Devolvemos un Date; Sequelize lo mapea a timestamptz sin drama
  return new Date(isoWithOffset);
}


/**
 * 📅 CONTROLLER - OBTENER ASISTENCIA DEL USUARIO
 */
export async function getAsistenciaController(req, res) {
  const startTime = Date.now();
  
  try {
    console.log('📅 [ASISTENCIA-CTRL] === INICIANDO ===');
    
    const rutUsuario = req.user?.rut_usuario || req.rut_usuario;
    const { mes, anio } = req.query;
    
    console.log('📅 [ASISTENCIA-CTRL] Usuario:', rutUsuario);
    console.log('📅 [ASISTENCIA-CTRL] Filtros:', { mes, anio });
    console.log('📅 [ASISTENCIA-CTRL] Headers:', {
      authorization: req.headers.authorization ? 'Presente' : 'Ausente',
      contentType: req.headers['content-type']
    });
    
    if (!rutUsuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario requerido'
      });
    }

    // Llamar al servicio
    const resultado = await getAsistenciaUsuarioService(rutUsuario, mes, anio);
    
    const duration = `${Date.now() - startTime}ms`;
    
    console.log('✅ [ASISTENCIA-CTRL] Resultado del servicio:', {
      asistencias: resultado.asistencias.length,
      periodo: resultado.periodo,
      resumen: resultado.resumen
    });
    console.log('✅ [ASISTENCIA-CTRL] Respuesta enviada en', duration);
    
    res.status(200).json({
      success: true,
      data: resultado,
      meta: {
        duration,
        asistencias_count: resultado.asistencias.length,
        periodo: resultado.periodo
      }
    });

  } catch (error) {
    console.error('❌ [ASISTENCIA-CTRL] Error:', error);
    console.error('❌ [ASISTENCIA-CTRL] Stack:', error.stack);
    
    const duration = `${Date.now() - startTime}ms`;
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo asistencia',
      message: error.message,
      meta: { duration }
    });
  }
}

/**
 * 📊 CONTROLLER - OBTENER ESTADÍSTICAS DE ASISTENCIA
 */
export async function getEstadisticasAsistenciaController(req, res) {
  const startTime = Date.now();
  
  try {
    console.log('📊 [ESTADISTICAS-CTRL] === INICIANDO ===');
    
    const rutUsuario = req.user?.rut_usuario || req.rut_usuario;
    
    console.log('📊 [ESTADISTICAS-CTRL] Usuario:', rutUsuario);
    
    if (!rutUsuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario requerido'
      });
    }

    const { mes, anio } = req.query;

    // Llamar al servicio con filtros
    const estadisticas = await getEstadisticasAsistenciaService(rutUsuario, mes, anio);
    
    const duration = `${Date.now() - startTime}ms`;
    
    console.log('✅ [ESTADISTICAS-CTRL] Respuesta enviada en', duration);
    
    res.status(200).json({
      success: true,
      data: estadisticas,
      meta: { duration }
    });

  } catch (error) {
    console.error('❌ [ESTADISTICAS-CTRL] Error:', error);
    
    const duration = `${Date.now() - startTime}ms`;
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
      message: error.message,
      meta: { duration }
    });
  }
}

/**
 * 📝 CONTROLLER - SOLICITAR JUSTIFICACIÓN
 */
export async function solicitarJustificacionController(req, res) {
  const startTime = Date.now();
  
  try {
    console.log('📝 [JUSTIFICACION-CTRL] === INICIANDO ===');
    
    const rutUsuario = req.user?.rut_usuario || req.rut_usuario;
    const datosJustificacion = req.body;
    
    console.log('📝 [JUSTIFICACION-CTRL] Usuario:', rutUsuario);
    console.log('📝 [JUSTIFICACION-CTRL] Datos:', datosJustificacion);
    
    if (!rutUsuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario requerido'
      });
    }

    // Llamar al servicio
    const resultado = await crearJustificacionService(rutUsuario, datosJustificacion);
    
    const duration = `${Date.now() - startTime}ms`;
    
    console.log('✅ [JUSTIFICACION-CTRL] Creada en', duration);
    
    res.status(201).json({
      success: true,
      message: 'Justificación enviada correctamente',
      data: resultado,
      meta: { duration }
    });

  } catch (error) {
    console.error('❌ [JUSTIFICACION-CTRL] Error:', error);
    
    const duration = `${Date.now() - startTime}ms`;
    
    res.status(500).json({
      success: false,
      error: 'Error creando justificación',
      message: error.message,
      meta: { duration }
    });
  }
}

/**
 * 📋 CONTROLLER - OBTENER JUSTIFICACIONES DEL USUARIO
 */
export async function getJustificacionesController(req, res) {
  const startTime = Date.now();
  
  try {
    console.log('📋 [JUSTIFICACIONES-CTRL] === INICIANDO ===');
    
    const rutUsuario = req.user?.rut_usuario || req.rut_usuario;
    
    console.log('📋 [JUSTIFICACIONES-CTRL] Usuario:', rutUsuario);
    
    if (!rutUsuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario requerido'
      });
    }

    // Llamar al servicio
    const justificaciones = await getJustificacionesUsuarioService(rutUsuario);
    
    const duration = `${Date.now() - startTime}ms`;
    
    console.log('✅ [JUSTIFICACIONES-CTRL] Respuesta enviada en', duration);
    
    res.status(200).json({
      success: true,
      data: justificaciones,
      meta: { 
        duration,
        count: justificaciones.length
      }
    });

  } catch (error) {
    console.error('❌ [JUSTIFICACIONES-CTRL] Error:', error);
    
    const duration = `${Date.now() - startTime}ms`;
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo justificaciones',
      message: error.message,
      meta: { duration }
    });
  }
}

/**
 * 🏷️ CONTROLLER ORIGINAL - MARCAR ASISTENCIA (QR)
 */
export async function marcar(req, res) {
  try {
    const { codigo_unico } = req.body;

    console.log('🏷️ [MARCAR] Código recibido:', codigo_unico);
    
    res.json({ 
      ok: true, 
      message: `Marcaje procesado para código: ${codigo_unico}`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ [MARCAR] Error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

/**
 * 🖊️ CONTROLLER - INGRESO MANUAL DE ASISTENCIA
 */
/**
 * 🖊️ CONTROLLER - MARCAJE MANUAL (una sola marca de entrada/salida)
 */
/**
 * 🖊️ CONTROLLER - MARCAJE MANUAL (una sola marca)
 */
/**
 * 🖊️ CONTROLLER - MARCAJE MANUAL (una sola marca que abre o cierra)
 */
/**
 * 🖊️ CONTROLLER - MARCAJE MANUAL (abre/cierra par en el día)
 */
/**
 * 🖊️ CONTROLLER - MARCAJE MANUAL (abre o cierra marcaje del día)
 */
export async function createManualEntryController(req, res) {
  try {
    const user = req.user;
    const rutUsuario = user?.rut_usuario || user?.rut;

    console.log("📥 [MANUAL-ENTRY] BODY RECIBIDO:", req.body);
    console.log("👤 [MANUAL-ENTRY] Usuario del token:", rutUsuario);

    if (!rutUsuario) {
      return res.status(400).json({ success: false, error: "RUT de usuario requerido" });
    }

    const { 
      date,              // '2025-11-16'
      checkInTime,       // '08:00'
      activityType,      // 'teaching' | 'research' | ...
      location,
      notes,
      registroTipo,      // 'entrada_manana', 'salida_almuerzo', etc.
      justificationReason
    } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: "'date' es requerido" });
    }

    if (!checkInTime) {
      return res.status(400).json({ success: false, error: "'checkInTime' es requerido" });
    }

    // 🕒 Timestamp completo local CL (fecha + hora -03:00)
    const timestamp = buildTimestamp(date, checkInTime);
    if (!timestamp || isNaN(timestamp.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Fecha u hora inválidas"
      });
    }

    // 🎭 Labels bonitos
    const activityLabels = {
      teaching: "Docencia",
      research: "Investigación",
      management: "Gestión Administrativa",
      other: "Otra actividad"
    };

    const registroTipoLabels = {
      entrada_manana: "Entrada mañana",
      salida_almuerzo: "Salida a almorzar",
      entrada_tarde: "Entrada tarde",
      salida_dia: "Salida día",
      entrada_otro: "Entrada (otro)",
      salida_otro: "Salida (otro)"
    };

    const actividadTexto = activityLabels[activityType] || "Actividad no especificada";
    const tipoTexto = registroTipoLabels[registroTipo] || registroTipo || "Marcaje manual";

    const observacionBase = `Actividad: ${actividadTexto} | Tipo: ${tipoTexto}`;
    const observacionExtra = [
      notes ? `Notas: ${notes}` : null,
      location ? `Ubicación: ${location}` : null,
      justificationReason ? `Justificación: ${justificationReason}` : null
    ].filter(Boolean).join(" | ");

    const observacion = observacionExtra
      ? `${observacionBase} | ${observacionExtra}`
      : observacionBase;

    // 🏷️ Tótem virtual para registros manuales
    const [totemManual] = await Totem.findOrCreate({
      where: { ubicacion: "INGRESO_MANUAL" },
      defaults: {
        descripcion: "Tótem virtual para registros manuales",
      },
    });

    // 🔍 Buscar marcaje ABIERTO (sin hora_salida) ese día
    const marcajeAbierto = await Marcaje.findOne({
      where: {
        rut_usuario: rutUsuario,
        fecha: date,
        hora_salida: null
      },
      order: [["hora_ingreso", "DESC"]],
    });

    // Helper: ver si este registro es de salida
    const esSalida = registroTipo && registroTipo.startsWith("salida");

    let marcajeFinal;

    if (marcajeAbierto && esSalida) {
      // ✅ CERRAR MARCAJE EXISTENTE
      console.log("🔒 [MANUAL-ENTRY] Cerrando marcaje abierto:", marcajeAbierto.id_marcaje);

      marcajeAbierto.hora_salida = timestamp; // usamos timestamp completo
      marcajeAbierto.observacion = [
        marcajeAbierto.observacion,
        observacion
      ].filter(Boolean).join(" | ");

      await marcajeAbierto.save();
      marcajeFinal = marcajeAbierto;

    } else {
      // ✅ CREAR NUEVO MARCAJE (entrada)
      console.log("🆕 [MANUAL-ENTRY] Creando nuevo marcaje para el día", date);

      marcajeFinal = await Marcaje.create({
        rut_usuario: rutUsuario,
        fecha: date,
        hora_ingreso: timestamp,
        hora_salida: null,
        observacion,
        id_totem: totemManual.id_totem ?? null
      });
    }

    // 🧾 Registrar en RegistroMarcaje
    await RegistroMarcaje.create({
      rut_usuario: rutUsuario,
      id_marcaje: marcajeFinal.id_marcaje,
      id_totem: totemManual.id_totem,
      fecha_registro: new Date()
    });

    console.log("✅ [MANUAL-ENTRY] Marcaje procesado correctamente:", {
      id_marcaje: marcajeFinal.id_marcaje,
      fecha: marcajeFinal.fecha,
      hora_ingreso: marcajeFinal.hora_ingreso,
      hora_salida: marcajeFinal.hora_salida
    });

    return res.status(201).json({
      success: true,
      message: "Marcaje manual registrado correctamente",
      data: {
        id_marcaje: marcajeFinal.id_marcaje,
        fecha: marcajeFinal.fecha,
        hora_ingreso: marcajeFinal.hora_ingreso,
        hora_salida: marcajeFinal.hora_salida
      }
    });

  } catch (error) {
    console.error("❌ [MANUAL-ENTRY] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Error registrando marcaje manual",
      message: error.message
    });
  }
}



/**
 * 📊 OBTENER MÉTRICAS BÁSICAS DEL DASHBOARD
 */
export async function getBasicStats(req, res) {
  console.log('📊 [DASHBOARD-CONTROLLER] ===== GET BASIC STATS =====');
  
  try {
    // ✅ OBTENER USUARIO DEL TOKEN
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;
    
    console.log('👤 Usuario del token:', {
      user_completo: user,
      rut_extraido: rut_usuario
    });

    if (!rut_usuario) {
      console.error('❌ No se pudo obtener RUT del usuario');
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario no encontrado en el token'
      });
    }

    console.log('🔥 Llamando a getCompleteMetrics con RUT:', rut_usuario);

    // ✅ LLAMAR AL SERVICIO REAL QUE CONFIGURAMOS
    const metrics = await getCompleteMetrics(rut_usuario);
    
    console.log('✅ Métricas obtenidas del servicio:', {
      tiene_personal_stats: !!metrics.personal_basic_stats,
      today_hours: metrics.personal_basic_stats?.today_hours,
      week_hours: metrics.personal_basic_stats?.week_hours,
      month_hours: metrics.personal_basic_stats?.month_hours,
      attendance_rate: metrics.personal_basic_stats?.attendance_rate
    });

    // ✅ DEVOLVER EN EL FORMATO ESPERADO
    return res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('❌ [DASHBOARD-CONTROLLER] Error en getBasicStats:', error);
    console.error('❌ Stack completo:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas del dashboard',
      details: error.message
    });
  }
}

/**
 * ⚡ OBTENER DATOS EN TIEMPO REAL
 */
export async function getRealTime(req, res) {
  console.log('⚡ [DASHBOARD-CONTROLLER] ===== GET REAL TIME =====');
  
  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;

    if (!rut_usuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario no encontrado'
      });
    }

    console.log('🔥 Obteniendo datos tiempo real para:', rut_usuario);

    const realTimeData = await getRealTimeData(rut_usuario);
    
    return res.status(200).json({
      success: true,
      data: realTimeData
    });

  } catch (error) {
    console.error('❌ [DASHBOARD-CONTROLLER] Error en getRealTime:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo datos en tiempo real',
      details: error.message
    });
  }
}

/**
 * 📈 OBTENER ANALÍTICAS AVANZADAS
 */
export async function getAdvanced(req, res) {
  console.log('📈 [DASHBOARD-CONTROLLER] ===== GET ADVANCED =====');
  
  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;

    if (!rut_usuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario no encontrado'
      });
    }

    console.log('🔥 Obteniendo analíticas avanzadas para:', rut_usuario);

    const advancedData = await getAdvancedAnalytics(rut_usuario);
    
    return res.status(200).json({
      success: true,
      data: advancedData
    });

  } catch (error) {
    console.error('❌ [DASHBOARD-CONTROLLER] Error en getAdvanced:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo analíticas avanzadas',
      details: error.message
    });
  }
}

/**
 * 🔍 OBTENER INFO DE DEBUG
 */
export async function getDebug(req, res) {
  console.log('🔍 [DASHBOARD-CONTROLLER] ===== GET DEBUG =====');
  
  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;

    if (!rut_usuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario no encontrado'
      });
    }

    console.log('🔥 Obteniendo debug info para:', rut_usuario);

    const debugInfo = await getDebugInfo(rut_usuario);
    
    return res.status(200).json({
      success: true,
      data: debugInfo
    });

  } catch (error) {
    console.error('❌ [DASHBOARD-CONTROLLER] Error en getDebug:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo información de debug',
      details: error.message
    });
  }
}

console.log('👤 [ASISTENCIA-CTRL] ✅ CONTROLLER LIMPIO SIN EXPORTS DUPLICADOS ✅');
console.log('✅ [DASHBOARD-CONTROLLER] Controlador configurado correctamente');
