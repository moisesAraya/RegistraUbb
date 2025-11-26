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

import { Op } from 'sequelize';
import Marcaje from '../entities/marcaje.entity.js';
import Totem from '../entities/totem.entity.js';

console.log('👤 [ASISTENCIA-CTRL] ✅ CONTROLLER CARGADO ✅');
console.log('🚀 [DASHBOARD-CONTROLLER] Controller cargado y conectado con service real');

function buildTimestamp(fecha, hora) {
  if (!fecha || !hora) return null;

  // Normalizar hora a HH:MM:SS
  const time = hora.length === 5 ? `${hora}:00` : hora;

  // 📌 Forzamos zona horaria Chile (-03:00) para evitar desfase 8 → 5
  const isoWithOffset = `${fecha}T${time}-03:00`;

  // Devolvemos un Date; Sequelize lo mapea a timestamptz sin drama
  return new Date(isoWithOffset);
}

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
 * ✅ NUEVA LÓGICA DE MARCAJE MANUAL
 * - Un solo timestamp por registro (hora_ingreso)
 * - NO maneja pares entrada/salida
 * - Máximo 4 marcajes por día
 * - Evita duplicar exactamente la misma hora
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
      activityType,      
      location,
      notes,
      registroTipo,      // ya no se usa para decidir entrada/salida
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

    // ❌ Validación: no se permiten marcajes en el futuro
    const nowMs = Date.now();
    if (timestamp.getTime() > nowMs) {
      console.log("❌ [MANUAL-ENTRY] Intento de marcaje en el futuro detected", { fecha: date, hora: checkInTime });
      return res.status(400).json({
        success: false,
        error: "No se permite registrar marcajes en fechas/hora futuras"
      });
    }

    const observacion = notes || null;

    // 🏷️ Tótem virtual para registros manuales
    const [totemManual] = await Totem.findOrCreate({
      where: { ubicacion: "INGRESO_MANUAL" },
      defaults: {
        descripcion: "Tótem virtual para registros manuales",
      },
    });

    // 🔍 Traer TODOS los marcajes del día para este usuario
    const marcajesDelDia = await Marcaje.findAll({
      where: {
        rut_usuario: rutUsuario,
        fecha: date
      },
      order: [["hora_ingreso", "ASC"]],
    });

    // 🔍 Buscar marcaje ABIERTO (sin hora_salida) ese día
    const marcajeAbierto = marcajesDelDia.find(m => !m.hora_salida);

    // 🧠 REGLA CLAVE:
    // - Si hay marcaje abierto => este nuevo marcaje es SALIDA (cierra el par)
    // - Si NO hay marcaje abierto => este nuevo marcaje es ENTRADA (abre un par)
    let esSalida = false;
    if (marcajeAbierto) {
      esSalida = true;
    }

    // 🕐 2) Regla: NO se puede registrar un marcaje anterior al primero del día
    if (marcajesDelDia.length > 0) {
      const tiempos = marcajesDelDia
        .flatMap(m => [m.hora_ingreso, m.hora_salida].filter(Boolean))
        .map(d => d.getTime());

      if (tiempos.length > 0) {
        const minTime = Math.min(...tiempos);
        if (timestamp.getTime() < minTime) {
          console.log("❌ [MANUAL-ENTRY] Intento de marcaje anterior al primero del día");
          return res.status(400).json({
            success: false,
            error: "No puedes registrar un marcaje anterior a otro ya existente en el mismo día."
          });
        }
      }
    }

    // 🕐 3) Si es ENTRADA: no puede caer dentro de un rango ya cerrado
    if (!esSalida) {
      const tMs = timestamp.getTime();
      const solapa = marcajesDelDia.some(m => {
        if (!m.hora_ingreso || !m.hora_salida) return false;
        const ini = m.hora_ingreso.getTime();
        const fin = m.hora_salida.getTime();
        // Entrada en medio de un rango ya trabajado
        return tMs > ini && tMs < fin;
      });

      if (solapa) {
        console.log("❌ [MANUAL-ENTRY] Entrada se solapa con otro rango de trabajo");
        return res.status(400).json({
          success: false,
          error: "La hora de entrada se solapa con otro marcaje existente del mismo día."
        });
      }
    }

    let marcajeFinal;

    if (marcajeAbierto && esSalida) {
      // ✅ CERRAR MARCAJE EXISTENTE
      console.log("🔒 [MANUAL-ENTRY] Cerrando marcaje abierto:", marcajeAbierto.id_marcaje);

      // 4) Salida no puede ser antes o igual que la entrada
      const ingresoMs = marcajeAbierto.hora_ingreso.getTime();
      if (timestamp.getTime() <= ingresoMs) {
        console.log("❌ [MANUAL-ENTRY] Salida antes o igual que la entrada");
        return res.status(400).json({
          success: false,
          error: "La hora de salida no puede ser anterior o igual a la hora de entrada."
        });
      }

      // 5) Verificar solapamiento con otros marcajes cerrados
      const otrosMarcajes = marcajesDelDia.filter(m => 
        m.id_marcaje !== marcajeAbierto.id_marcaje &&
        m.hora_ingreso &&
        m.hora_salida
      );

      const iniActual = marcajeAbierto.hora_ingreso;
      const finActual = timestamp;

      const seSolapa = otrosMarcajes.some(m => {
        const ini = m.hora_ingreso;
        const fin = m.hora_salida;
        // [iniActual, finActual] solapa con [ini, fin] ?
        return iniActual < fin && finActual > ini;
      });

      if (seSolapa) {
        console.log("❌ [MANUAL-ENTRY] Rango cierre se solapa con otros marcajes");
        return res.status(400).json({
          success: false,
          error: "El rango horario del marcaje se solapa con otros registros del mismo día."
        });
      }

      marcajeAbierto.hora_salida = timestamp; 
      
      if (observacion) {
        marcajeAbierto.observacion = marcajeAbierto.observacion 
          ? `${marcajeAbierto.observacion} | ${observacion}`
          : observacion;
      }

      // 🧮 Calcular y guardar horas_trabajadas (máx 9h)
      const diffMs = marcajeAbierto.hora_salida.getTime() - marcajeAbierto.hora_ingreso.getTime();
      let horasTrabajadas = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      if (horasTrabajadas > 9) horasTrabajadas = 9;

      marcajeAbierto.horas_trabajadas = horasTrabajadas;

      await marcajeAbierto.save();
      console.log(`✅ [MANUAL-ENTRY] Horas trabajadas calculadas y guardadas: ${horasTrabajadas}h`);

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
        horas_trabajadas: 0,
        id_totem: totemManual.id_totem ?? null
      });
    }

    console.log("✅ [MANUAL-ENTRY] Marcaje procesado correctamente:", {
      id_marcaje: marcajeFinal.id_marcaje,
      fecha: marcajeFinal.fecha,
      hora_ingreso: marcajeFinal.hora_ingreso,
      hora_salida: marcajeFinal.hora_salida,
      horas_trabajadas: marcajeFinal.horas_trabajadas
    });

    return res.status(201).json({
      success: true,
      message: "Marcaje manual registrado correctamente",
      data: {
        id_marcaje: marcajeFinal.id_marcaje,
        fecha: marcajeFinal.fecha,
        hora_ingreso: marcajeFinal.hora_ingreso,
        hora_salida: marcajeFinal.hora_salida,
        horas_trabajadas: marcajeFinal.horas_trabajadas
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

export async function getMarcajeAbiertoController(req, res) {
  try {
    const { rut_usuario } = req.params;
    
    console.log('🔓 [ASISTENCIA-CTRL] Verificando marcaje abierto para:', rut_usuario);
    
    // Obtener la fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    console.log('🔓 [ASISTENCIA-CTRL] Fecha de hoy:', hoy);
    
    // Buscar marcajes abiertos del usuario (sin restricción de fecha para detectar marcajes de días anteriores)
    const marcajesAbiertos = await Marcaje.findAll({
      where: {
        rut_usuario,
        [Op.or]: [
          { hora_salida: null },
          { hora_salida: { [Op.lt]: new Date('1971-01-01') } } // Considerar fechas de 1970 como marcajes abiertos
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    console.log('🔓 [ASISTENCIA-CTRL] Marcajes abiertos encontrados:', marcajesAbiertos.length);
    
    // También buscar todos los marcajes del usuario para debug
    const todosLosMarcajes = await Marcaje.findAll({
      where: { rut_usuario }
    });
    
    console.log('🔓 [ASISTENCIA-CTRL] Todos los marcajes del usuario:', todosLosMarcajes.map(m => ({
      id: m.id_marcaje,
      fecha: m.fecha,
      hora_ingreso: m.hora_ingreso,
      hora_salida: m.hora_salida
    })));

    if (marcajesAbiertos.length > 0) {
      const marcajeAbierto = marcajesAbiertos[0];
      
      // Calcular tiempo transcurrido desde el ingreso
      const ahora = new Date();
      const horaIngreso = new Date(marcajeAbierto.hora_ingreso);
      const tiempoTranscurridoHoras = (ahora - horaIngreso) / (1000 * 60 * 60);
      const esAntiguo = tiempoTranscurridoHoras > 9;
      
      // Enviar la hora como ISO string para que el frontend maneje la zona horaria
      const horaIngresoFormatted = marcajeAbierto.hora_ingreso 
        ? marcajeAbierto.hora_ingreso
        : null;
      
      console.log('🔄 [ASISTENCIA-CTRL] Marcaje abierto encontrado:', {
        id: marcajeAbierto.id_marcaje,
        fecha: marcajeAbierto.fecha,
        hora_ingreso_original: marcajeAbierto.hora_ingreso,
        hora_ingreso_formatted: horaIngresoFormatted,
        tiempo_transcurrido_horas: tiempoTranscurridoHoras.toFixed(2),
        es_antiguo: esAntiguo
      });

      return res.status(200).json({
        success: true,
        marcaje_abierto: {
          id_marcaje: marcajeAbierto.id_marcaje,
          fecha: marcajeAbierto.fecha,
          hora_ingreso: horaIngresoFormatted,
          hora_salida: marcajeAbierto.hora_salida,
          tipo_marcaje: 'ingreso',
          tiempo_transcurrido_horas: tiempoTranscurridoHoras,
          es_marcaje_antiguo: esAntiguo,
          mensaje_alerta: esAntiguo ? `Este marcaje lleva abierto ${tiempoTranscurridoHoras.toFixed(1)} horas` : null
        }
      });
    } else {
      console.log('✅ [ASISTENCIA-CTRL] No hay marcajes abiertos');
      
      return res.status(200).json({
        success: true,
        marcaje_abierto: null
      });
    }

  } catch (error) {
    console.error('❌ [ASISTENCIA-CTRL] Error verificando marcaje abierto:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error verificando marcaje abierto',
      details: error.message
    });
  }
}

export async function agregarSalidaController(req, res) {
  try {
    const { id_marcaje, hora_salida, fecha } = req.body;
    
    console.log('🔄 [ASISTENCIA-CTRL] Agregando salida a marcaje:', {
      id_marcaje,
      hora_salida,
      fecha
    });
    
    console.log('🔄 [ASISTENCIA-CTRL] Body completo:', req.body);
    
    // Validar datos requeridos
    if (!id_marcaje || !hora_salida || !fecha) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: id_marcaje, hora_salida, fecha'
      });
    }

    // Buscar el marcaje
    const marcaje = await Marcaje.findByPk(id_marcaje);
    
    if (!marcaje) {
      console.log('❌ [ASISTENCIA-CTRL] Marcaje no encontrado:', id_marcaje);
      return res.status(404).json({
        success: false,
        error: 'Marcaje no encontrado'
      });
    }

    console.log('🔄 [ASISTENCIA-CTRL] Marcaje encontrado:', {
      id: marcaje.id_marcaje,
      hora_ingreso: marcaje.hora_ingreso,
      hora_salida: marcaje.hora_salida
    });

    // Verificar que el marcaje no tenga salida válida (permitir solo si está vacío o con fecha "dummy")
    if (marcaje.hora_salida && new Date(marcaje.hora_salida) > new Date('1971-01-01')) {
      console.log('❌ [ASISTENCIA-CTRL] Marcaje ya tiene salida válida');
      return res.status(400).json({
        success: false,
        error: 'Este marcaje ya tiene hora de salida registrada'
      });
    }

    // Construir timestamp para la salida
    const horaSalidaTimestamp = buildTimestamp(fecha, hora_salida);
    if (!horaSalidaTimestamp || isNaN(horaSalidaTimestamp.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Hora de salida inválida'
      });
    }

    // ⛔ Regla: salida no puede ser antes o igual que la entrada
    const ingresoDate = new Date(marcaje.hora_ingreso);
    if (horaSalidaTimestamp.getTime() <= ingresoDate.getTime()) {
      console.log('❌ [ASISTENCIA-CTRL] Salida antes/igual que la entrada');
      return res.status(400).json({
        success: false,
        error: 'La hora de salida no puede ser anterior o igual a la hora de entrada.'
      });
    }

    // ⛔ Regla: no solaparse con otros marcajes del mismo usuario y fecha
    const otrosMarcajes = await Marcaje.findAll({
      where: {
        rut_usuario: marcaje.rut_usuario,
        fecha,
        id_marcaje: { [Op.ne]: id_marcaje }
      }
    });

    const iniActual = ingresoDate;
    const finActual = horaSalidaTimestamp;

    const seSolapa = otrosMarcajes.some(m => {
      if (!m.hora_ingreso || !m.hora_salida) return false;
      const ini = new Date(m.hora_ingreso);
      const fin = new Date(m.hora_salida);
      // [iniActual, finActual] solapa con [ini, fin] ?
      return iniActual < fin && finActual > ini;
    });

    if (seSolapa) {
      console.log('❌ [ASISTENCIA-CTRL] Rango de salida se solapa con otros marcajes');
      return res.status(400).json({
        success: false,
        error: 'El rango horario del marcaje se solapa con otros registros del mismo día.'
      });
    }

    // Calcular horas trabajadas
    const diffMs = finActual.getTime() - iniActual.getTime();
    const horas = diffMs / (1000 * 60 * 60);

    // Actualizar el marcaje
    const horaSalidaForDB = new Date(`${fecha}T${hora_salida}:00`);
    
    await marcaje.update({
      hora_salida: horaSalidaForDB,
      horas_trabajadas: parseFloat(horas.toFixed(2))
    });

    console.log('✅ [ASISTENCIA-CTRL] Salida agregada exitosamente:', {
      id_marcaje,
      hora_salida,
      horas_trabajadas: horas.toFixed(2)
    });

    return res.status(200).json({
      success: true,
      message: 'Salida agregada exitosamente',
      data: {
        id_marcaje: marcaje.id_marcaje,
        hora_salida: marcaje.hora_salida,
        horas_trabajadas: marcaje.horas_trabajadas
      }
    });

  } catch (error) {
    console.error('❌ [ASISTENCIA-CTRL] Error agregando salida:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error agregando salida al marcaje',
      details: error.message
    });
  }
}

export async function updateManualEntryController(req, res) {
  try {
    const user = req.user;
    const rutUsuario = user?.rut_usuario || user?.rut;
    const { id_marcaje } = req.params;

    console.log("✏️ [MANUAL-UPDATE] Usuario:", rutUsuario, "Marcaje:", id_marcaje);
    console.log("✏️ [MANUAL-UPDATE] BODY:", req.body);

    if (!rutUsuario) {
      return res.status(400).json({ success: false, error: "RUT de usuario requerido" });
    }

    if (!id_marcaje) {
      return res.status(400).json({ success: false, error: "id_marcaje requerido en la URL" });
    }

    const marcaje = await Marcaje.findByPk(id_marcaje);

    if (!marcaje) {
      return res.status(404).json({ success: false, error: "Marcaje no encontrado" });
    }

    if (marcaje.rut_usuario !== rutUsuario) {
      return res.status(403).json({ success: false, error: "No puedes editar marcajes de otro usuario" });
    }

    const {
      date,
      time,
      campo, // 'entrada' | 'salida'
      notes,
      checkInTime,
      checkOutTime,
    } = req.body;

    let fechaBase;
    if (date) {
      fechaBase = date;
    } else if (marcaje.fecha instanceof Date) {
      fechaBase = marcaje.fecha.toISOString().substring(0, 10);
    } else {
      fechaBase = marcaje.fecha;
    }

    if (campo && (time || checkInTime || checkOutTime)) {
      const tipoCampo = campo === "salida" ? "salida" : "entrada";
      const horaStr = time || (tipoCampo === "entrada" ? checkInTime : checkOutTime);

      if (!horaStr) {
        return res.status(400).json({
          success: false,
          error: "Debes enviar la hora a actualizar en 'time'",
        });
      }

      const nuevaHoraTS = buildTimestamp(fechaBase, horaStr);
      if (!nuevaHoraTS || isNaN(nuevaHoraTS.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Hora o fecha inválidas",
        });
      }

      const otrosMarcajes = await Marcaje.findAll({
        where: {
          rut_usuario: marcaje.rut_usuario,
          fecha: fechaBase,
          id_marcaje: { [Op.ne]: marcaje.id_marcaje },
        },
      });

      if (tipoCampo === "entrada") {
        if (marcaje.hora_salida) {
          const salidaTS = new Date(marcaje.hora_salida);
          if (nuevaHoraTS.getTime() >= salidaTS.getTime()) {
            return res.status(400).json({
              success: false,
              error: "La hora de entrada no puede ser posterior o igual a la hora de salida.",
            });
          }

          const diffHoras = (salidaTS.getTime() - nuevaHoraTS.getTime()) / (1000 * 60 * 60);
          if (diffHoras > 9) {
            return res.status(400).json({
              success: false,
              error: "No puedes registrar más de 9 horas en un solo marcaje.",
            });
          }
        }

        const finActual = marcaje.hora_salida ? new Date(marcaje.hora_salida) : null;
        const seSolapa = finActual
          ? otrosMarcajes.some((m) => {
              if (!m.hora_ingreso || !m.hora_salida) return false;
              const ini = new Date(m.hora_ingreso);
              const fin = new Date(m.hora_salida);
              return nuevaHoraTS < fin && finActual > ini;
            })
          : false;

        if (seSolapa) {
          return res.status(400).json({
            success: false,
            error: "El rango horario se solapa con otros marcajes del mismo día.",
          });
        }

        marcaje.fecha = fechaBase;
        marcaje.hora_ingreso = nuevaHoraTS;

      } else {
        if (!marcaje.hora_ingreso) {
          return res.status(400).json({
            success: false,
            error: "No puedes registrar una salida si no existe hora de entrada.",
          });
        }

        const ingresoTS = new Date(marcaje.hora_ingreso);
        if (nuevaHoraTS.getTime() <= ingresoTS.getTime()) {
          return res.status(400).json({
            success: false,
            error: "La hora de salida no puede ser anterior o igual a la hora de entrada.",
          });
        }

        const diffHoras = (nuevaHoraTS.getTime() - ingresoTS.getTime()) / (1000 * 60 * 60);
        if (diffHoras > 9) {
          return res.status(400).json({
            success: false,
            error: "No puedes registrar más de 9 horas en un solo marcaje.",
          });
        }

        const iniActual = ingresoTS;
        const finActual = nuevaHoraTS;

        const seSolapa = otrosMarcajes.some((m) => {
          if (!m.hora_ingreso || !m.hora_salida) return false;
          const ini = new Date(m.hora_ingreso);
          const fin = new Date(m.hora_salida);
          return iniActual < fin && finActual > ini;
        });

        if (seSolapa) {
          return res.status(400).json({
            success: false,
            error: "El rango horario del marcaje se solapa con otros registros del mismo día.",
          });
        }

        marcaje.fecha = fechaBase;
        marcaje.hora_salida = nuevaHoraTS;
      }

      // 🧮 Recalcular y guardar horas_trabajadas si tenemos ambas
      let horasTrabajadas = 0;
      if (marcaje.hora_ingreso && marcaje.hora_salida) {
        const diffMs =
          new Date(marcaje.hora_salida).getTime() -
          new Date(marcaje.hora_ingreso).getTime();
        horasTrabajadas = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        if (horasTrabajadas > 9) horasTrabajadas = 9; // límite 9h
        marcaje.horas_trabajadas = horasTrabajadas;
      }

      if (typeof notes === "string") {
        marcaje.observacion = notes;
      }

      await marcaje.save();

      console.log("✅ [MANUAL-UPDATE/PATCH] Marcaje actualizado:", {
        id_marcaje: marcaje.id_marcaje,
        fecha: marcaje.fecha,
        hora_ingreso: marcaje.hora_ingreso,
        hora_salida: marcaje.hora_salida,
        horas_trabajadas: marcaje.horas_trabajadas,
      });

      return res.status(200).json({
        success: true,
        message: "Marcaje manual actualizado correctamente",
        data: {
          id_marcaje: marcaje.id_marcaje,
          fecha: marcaje.fecha,
          hora_ingreso: marcaje.hora_ingreso,
          hora_salida: marcaje.hora_salida,
          horas_trabajadas: marcaje.horas_trabajadas,
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: "Petición inválida. Debes enviar 'campo' y 'time' para actualizar.",
    });
  } catch (error) {
    console.error("❌ [MANUAL-UPDATE] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Error actualizando marcaje manual",
      message: error.message,
    });
  }
}



export async function deleteManualEntryController(req, res) {
  try {
    const user = req.user;
    const rutUsuario = user?.rut_usuario || user?.rut;
    const { id_marcaje } = req.params;

    console.log("🗑 [MANUAL-DELETE] Usuario:", rutUsuario, "Marcaje:", id_marcaje);

    if (!rutUsuario) {
      return res.status(400).json({ success: false, error: "RUT de usuario requerido" });
    }

    if (!id_marcaje) {
      return res.status(400).json({ success: false, error: "id_marcaje requerido en la URL" });
    }

    const marcaje = await Marcaje.findByPk(id_marcaje, {
      include: [{ model: Totem, as: 'totem', required: false }]
    });

    if (!marcaje) {
      return res.status(404).json({ success: false, error: "Marcaje no encontrado" });
    }

    if (marcaje.rut_usuario !== rutUsuario) {
      return res.status(403).json({ success: false, error: "No puedes eliminar marcajes de otro usuario" });
    }

    await marcaje.destroy();

    console.log("✅ [MANUAL-DELETE] Marcaje eliminado:", id_marcaje);

    return res.status(200).json({
      success: true,
      message: "Marcaje manual eliminado correctamente"
    });

  } catch (error) {
    console.error("❌ [MANUAL-DELETE] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Error eliminando marcaje manual",
      message: error.message
    });
  }
}

// controllers/asistencia.controller.js

// ...importaciones que ya tengas
// por ejemplo: import { isSemanaCerradaService } from '../services/asistencia.service.js';

export async function getEstadoSemanaController(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros fecha_inicio y fecha_fin son requeridos',
      });
    }

    const rut_usuario = req.user?.rut_usuario || req.user?.rut || null;

    // Si quieres que sea por usuario, pásalo al service. Si es global, puedes ignorarlo.
    // Por ahora lo mantengo simple.
    // const cerrada = await isSemanaCerradaService(rut_usuario, fecha_inicio, fecha_fin);

    const cerrada = false; // 🔴 POR AHORA SIEMPRE "NO CERRADA" HASTA CONECTAR CON TU LÓGICA REAL

    return res.json({
      success: true,
      data: { cerrada },
    });
  } catch (error) {
    console.error('❌ [getEstadoSemanaController] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estado de la semana',
    });
  }
}


console.log('👤 [ASISTENCIA-CTRL] ✅ CONTROLLER LIMPIO SIN EXPORTS DUPLICADOS ✅');
console.log('✅ [DASHBOARD-CONTROLLER] Controlador configurado correctamente');
