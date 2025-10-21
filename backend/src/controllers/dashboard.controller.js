"use strict";

import { 
  getCompleteMetrics, 
  getRealTimeData, 
  getAdvancedAnalytics, 
  getDebugInfo 
} from '../services/dashboard.service.js';

console.log('🚀 [DASHBOARD-CONTROLLER] ✅ CONTROLLER CONFIGURADO CON SERVICIO REAL ✅');

/**
 * 📊 OBTENER MÉTRICAS BÁSICAS DEL DASHBOARD
 */
export async function getBasicStats(req, res) {
  console.log('📊 [DASHBOARD-CONTROLLER] ===== GET BASIC STATS =====');
  console.log('👤 Usuario del request:', req.user);
  
  try {
    // ✅ OBTENER USUARIO DEL TOKEN
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;
    
    console.log('👤 [DASHBOARD-CONTROLLER] Datos del usuario:', {
      user_completo: user,
      rut_extraido: rut_usuario,
      tipo_rut: typeof rut_usuario
    });

    if (!rut_usuario) {
      console.error('❌ [DASHBOARD-CONTROLLER] No se pudo obtener RUT del usuario');
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario no encontrado en el token'
      });
    }

    console.log('🔥 [DASHBOARD-CONTROLLER] Llamando a getCompleteMetrics con RUT:', rut_usuario);

    // ✅ LLAMAR AL SERVICIO REAL QUE CONFIGURAMOS
    const metrics = await getCompleteMetrics(rut_usuario);
    
    console.log('✅ [DASHBOARD-CONTROLLER] Métricas obtenidas del servicio:', {
      tipo: typeof metrics,
      keys: metrics ? Object.keys(metrics) : 'null',
      tiene_personal_stats: !!metrics?.personal_basic_stats,
      today_hours: metrics?.personal_basic_stats?.today_hours,
      week_hours: metrics?.personal_basic_stats?.week_hours,
      month_hours: metrics?.personal_basic_stats?.month_hours,
      attendance_rate: metrics?.personal_basic_stats?.attendance_rate
    });

    console.log('📤 [DASHBOARD-CONTROLLER] Enviando respuesta con métricas reales');

    // ✅ DEVOLVER EN EL FORMATO ESPERADO
    return res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('❌ [DASHBOARD-CONTROLLER] Error en getBasicStats:', error.message);
    console.error('❌ [DASHBOARD-CONTROLLER] Stack completo:', error.stack);
    
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

    console.log('🔥 [DASHBOARD-CONTROLLER] Obteniendo datos tiempo real para:', rut_usuario);

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

    console.log('🔥 [DASHBOARD-CONTROLLER] Obteniendo analíticas avanzadas para:', rut_usuario);

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

console.log('✅ [DASHBOARD-CONTROLLER] ✅ CONTROLADOR LISTO PARA USAR SERVICIO REAL ✅');