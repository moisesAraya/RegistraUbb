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
import RegistroMarcaje from '../entities/registro_marcaje.entity.js';
import Totem from '../entities/totem.entity.js';
import Asistencia from '../entities/asistencia.entity.js';

console.log('👤 [ASISTENCIA-CTRL] ✅ CONTROLLER CARGADO ✅');
console.log('🚀 [DASHBOARD-CONTROLLER] Controller cargado y conectado con service real');

/**
 * 📅 CONTROLLER - OBTENER ASISTENCIA DEL USUARIO
 */

function buildTimestamp(fecha, hora) {
    if (!fecha || !hora) return null;

    // Normalizar hora a HH:MM:SS
    const time = hora.length === 5 ? `${hora}:00` : hora;

    // Construir timestamp con zona horaria de Chile (UTC-3)
    // Esto asegura que la hora se guarde correctamente en la base de datos
    return `${fecha}T${time}-03:00`;
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

        // Llamar al servicio
        const estadisticas = await getEstadisticasAsistenciaService(rutUsuario);
        
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
 * 🖊️ CONTROLLER - INGRESO MANUAL DE ASISTENCIA (sin confirmación)
 */
export async function createManualEntryController(req, res) {
  try {
    const rutUsuario = req.user?.rut_usuario;

    const { 
      date, 
      checkInTime, 
      checkOutTime, 
      activityType, 
      location, 
      notes, 
      justificationReason 
    } = req.body;

    console.log("📥 BODY RECIBIDO:", req.body);

    if (!rutUsuario)
      return res.status(400).json({ success: false, error: "RUT de usuario requerido" });

    if (!date)
      return res.status(400).json({ success: false, error: "'date' es requerido" });

    if (!checkInTime)
      return res.status(400).json({ success: false, error: "'checkInTime' es requerido" });

    // Construcción de timestamps
    const horaIngresoTS = buildTimestamp(date, checkInTime);
    const horaSalidaTS = checkOutTime ? buildTimestamp(date, checkOutTime) : null;

    if (!horaIngresoTS)
      return res.status(400).json({ success: false, error: "Hora de ingreso inválida" });

    // Asegurar totem
    const [totem] = await Totem.findOrCreate({
      where: { ubicacion: "INGRESO_MANUAL" },
      defaults: { descripcion: "Tótem virtual para asistencias manuales" }
    });

    // Crear marcaje
    const nuevoMarcaje = await Marcaje.create({
      hora_ingreso: horaIngresoTS,
      hora_salida: horaSalidaTS,
      fecha: date,
      observacion: `Actividad: ${activityType}${notes ? ` | ${notes}` : ''}${location ? ` | ${location}` : ''}`,
      id_totem: totem.id_totem,
      rut_usuario: rutUsuario
    });

    // Registro de marcaje (fecha_registro debe ser timestamp)
    await RegistroMarcaje.create({
      rut_usuario: rutUsuario,
      id_marcaje: nuevoMarcaje.id_marcaje,
      id_totem: totem.id_totem,
      fecha_registro: new Date() // <-- CORRECTO
    });

    // ✅ CALCULAR HORAS TRABAJADAS Y CREAR REGISTRO DE ASISTENCIA
    let horasTrabajadas = 0;
    let tuvoColacion = false;

    if (checkOutTime && checkInTime) {
      // Calcular horas trabajadas
      const ingreso = new Date(`${date}T${checkInTime}:00`);
      const salida = new Date(`${date}T${checkOutTime}:00`);
      const diffMs = salida.getTime() - ingreso.getTime();
      horasTrabajadas = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Convertir a horas con 2 decimales
      
      // Si trabajó más de 6 horas, asumimos que tuvo colación
      tuvoColacion = horasTrabajadas > 6;
    }

    await Asistencia.create({
      colacion: tuvoColacion,
      observacion: `Ingreso manual: ${activityType}${notes ? ` | ${notes}` : ''}`,
      horas_diarias: horasTrabajadas,
      id_marcaje: nuevoMarcaje.id_marcaje,
      id_justificacion: null
    });

    console.log(`✅ [MANUAL-ENTRY] Asistencia creada: ${horasTrabajadas}h, colación: ${tuvoColacion}`);

    return res.status(201).json({
      success: true,
      message: "Asistencia manual registrada correctamente",
      data: {
        marcaje: nuevoMarcaje,
        horas_trabajadas: horasTrabajadas,
        tuvo_colacion: tuvoColacion
      }
    });

  } catch (error) {
    console.error("❌ [MANUAL-ENTRY] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Error registrando ingreso manual",
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

/**
 * 🔓 CONTROLLER - VERIFICAR MARCAJE ABIERTO
 */
export async function getMarcajeAbiertoController(req, res) {
  try {
    const { rut_usuario } = req.params;
    
    console.log('🔓 [ASISTENCIA-CTRL] Verificando marcaje abierto para:', rut_usuario);
    
    // Obtener la fecha actual
    const hoy = new Date().toISOString().split('T')[0];
    console.log('🔓 [ASISTENCIA-CTRL] Fecha de hoy:', hoy);
    
    // Buscar marcajes del usuario hoy a través de RegistroMarcaje
    const registrosMarcaje = await RegistroMarcaje.findAll({
      where: { rut_usuario },
      include: [{
        model: Marcaje,
        as: 'marcaje',
        where: {
          fecha: hoy,
          [Op.or]: [
            { hora_salida: null },
            { hora_salida: { [Op.lt]: new Date('1971-01-01') } } // Considerar fechas de 1970 como marcajes abiertos
          ]
        },
        required: true,
        order: [['createdAt', 'DESC']]
      }]
    });

    console.log('🔓 [ASISTENCIA-CTRL] Registros encontrados:', registrosMarcaje.length);
    
    // También buscar todos los marcajes del usuario para debug
    const todosLosMarcajes = await RegistroMarcaje.findAll({
      where: { rut_usuario },
      include: [{
        model: Marcaje,
        as: 'marcaje',
        required: true
      }]
    });
    
    console.log('🔓 [ASISTENCIA-CTRL] Todos los marcajes del usuario:', todosLosMarcajes.map(r => ({
      id: r.marcaje.id_marcaje,
      fecha: r.marcaje.fecha,
      hora_ingreso: r.marcaje.hora_ingreso,
      hora_salida: r.marcaje.hora_salida
    })));

    if (registrosMarcaje.length > 0) {
      const marcajeAbierto = registrosMarcaje[0].marcaje;
      
      console.log('🔄 [ASISTENCIA-CTRL] Marcaje abierto encontrado:', {
        id: marcajeAbierto.id_marcaje,
        fecha: marcajeAbierto.fecha,
        hora_ingreso: marcajeAbierto.hora_ingreso
      });

      return res.status(200).json({
        success: true,
        marcaje_abierto: {
          id_marcaje: marcajeAbierto.id_marcaje,
          fecha: marcajeAbierto.fecha,
          hora_ingreso: marcajeAbierto.hora_ingreso,
          hora_salida: marcajeAbierto.hora_salida,
          tipo_marcaje: 'ingreso'
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

/**
 * 🔄 CONTROLLER - AGREGAR SALIDA A MARCAJE PENDIENTE
 */
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
      hora_salida: marcaje.hora_salida,
      fecha_hora_salida: new Date(marcaje.hora_salida)
    });

    // Verificar que el marcaje no tenga salida válida (permitir actualizar fechas de 1970)
    if (marcaje.hora_salida && new Date(marcaje.hora_salida) > new Date('1971-01-01')) {
      console.log('❌ [ASISTENCIA-CTRL] Marcaje ya tiene salida válida');
      return res.status(400).json({
        success: false,
        error: 'Este marcaje ya tiene hora de salida registrada'
      });
    }

    // Construir timestamp para la salida
    const horaSalidaTimestamp = buildTimestamp(fecha, hora_salida);
    
    // Calcular horas trabajadas
    // Extraer la hora del objeto Date de marcaje.hora_ingreso
    const horaIngresoString = new Date(marcaje.hora_ingreso).toLocaleTimeString('en-GB', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const horaIngresoTimestamp = buildTimestamp(fecha, horaIngresoString);
    const ingreso = new Date(horaIngresoTimestamp);
    const salida = new Date(horaSalidaTimestamp);
    
    const diffMs = salida.getTime() - ingreso.getTime();
    const horas = diffMs / (1000 * 60 * 60);
    
    // Actualizar el marcaje
    // Convertir hora_salida a timestamp del mismo día
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

console.log('👤 [ASISTENCIA-CTRL] ✅ CONTROLLER LIMPIO SIN EXPORTS DUPLICADOS ✅');
console.log('✅ [DASHBOARD-CONTROLLER] Controlador configurado correctamente');