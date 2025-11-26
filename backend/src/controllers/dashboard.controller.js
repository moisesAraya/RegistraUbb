"use strict";

import { 
  getCompleteMetrics, 
  getRealTimeData, 
  getAdvancedAnalytics, 
  getDebugInfo,
  getAdminDashboardMetrics
} from '../services/dashboard.service.js';


/**
 * 📊 OBTENER MÉTRICAS BÁSICAS DEL DASHBOARD (usuario)
 */
export async function getBasicStats(req, res) {
  
  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;
    

    if (!rut_usuario) {
      return res.status(400).json({
        success: false,
        error: 'RUT de usuario no encontrado en el token'
      });
    }

    console.log('🔥 [DASHBOARD-CONTROLLER] Llamando a getCompleteMetrics con RUT:', rut_usuario);

    const metrics = await getCompleteMetrics(rut_usuario);
    

    console.log('📤 [DASHBOARD-CONTROLLER] Enviando respuesta con métricas reales');

    return res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    
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

/**
 * 👑 DASHBOARD ADMIN - MÉTRICAS GLOBALES
 */
export async function getAdminDashboard(req, res) {
  console.log('👑 [ADMIN-DASHBOARD-CTRL] Solicitud de dashboard admin');

  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;
    const id_rol = user?.id_rol;

    console.log('👑 [ADMIN-DASHBOARD-CTRL] Usuario:', { rut_usuario, id_rol });

    // Ajusta este check si tu rol de admin no es 1
    if (!id_rol || id_rol !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Acceso restringido al panel de administración'
      });
    }

    const stats = await getAdminDashboardMetrics();

    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ [ADMIN-DASHBOARD-CTRL] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas administrativas',
      message: error.message
    });
  }
}

console.log('✅ [DASHBOARD-CONTROLLER] ✅ CONTROLADOR LISTO PARA USAR SERVICIO REAL ✅');
