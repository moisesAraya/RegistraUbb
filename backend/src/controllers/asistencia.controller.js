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

console.log('👤 [ASISTENCIA-CTRL] ✅ CONTROLLER CARGADO ✅');
console.log('🚀 [DASHBOARD-CONTROLLER] Controller cargado y conectado con service real');

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
        
        if (!rutUsuario) {
            return res.status(400).json({
                success: false,
                error: 'RUT de usuario requerido'
            });
        }

        // Llamar al servicio
        const resultado = await getAsistenciaUsuarioService(rutUsuario, mes, anio);
        
        const duration = `${Date.now() - startTime}ms`;
        
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