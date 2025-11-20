"use strict";

import {
  getReportePersonalMensual,
  getReporteComparativo as getReporteComparativoService,
  getEstadisticasAnuales as getEstadisticasAnualesService
} from "../services/reportes.service.js";
import Usuario from "../entities/usuario.entity.js";

/**
 * 📊 CONTROLADOR DE REPORTES
 * Gestiona los endpoints para obtener reportes mensuales, comparativos y anuales.
 */

// ✅ OBTENER REPORTE MENSUAL O POR RANGO DE FECHAS
export async function getReporteMensual(req, res) {
  console.log("📊 [REPORTES-CONTROLLER] ===== GET REPORTE MENSUAL =====");

  try {
    const user = req.user;
    let rut_usuario = user?.rut_usuario;
    const { mes, anio, rut, todos, fecha_inicio, fecha_fin } = req.query;

    // Validaciones iniciales para rango de fechas o mes/año
    if (!fecha_inicio && !fecha_fin && (!mes || !anio)) {
      return res.status(400).json({ 
        success: false, 
        error: "Se requiere mes/año o rango de fechas (fecha_inicio, fecha_fin)" 
      });
    }

    // Si es admin (rol 1), puede consultar otros usuarios
    if (user?.id_rol === 1 && rut) rut_usuario = rut;

    // Si es admin y pide todos los reportes
    if (user?.id_rol === 1 && todos === "true") {
      console.log("📊 Solicitando reportes para todos los usuarios...");
      const usuarios = await Usuario.findAll({ 
        attributes: ["rut_usuario", "nombres", "apellidos"]
      });

      const reportes = [];
      for (const u of usuarios) {
        try {
          let rep;
          if (fecha_inicio && fecha_fin) {
            rep = await getReportePersonalMensual(u.rut_usuario, null, null, fecha_inicio, fecha_fin);
          } else {
            rep = await getReportePersonalMensual(u.rut_usuario, mes, anio);
          }
          reportes.push({ 
            rut_usuario: u.rut_usuario,
            usuario: {
              nombres: u.nombres,
              apellidos: u.apellidos
            },
            reporte: rep 
          });
        } catch (err) {
          reportes.push({ 
            rut_usuario: u.rut_usuario,
            usuario: {
              nombres: u.nombres,
              apellidos: u.apellidos
            },
            error: err.message 
          });
        }
      }

      return res.status(200).json({ success: true, data: reportes });
    }

    // Si no hay rut definido (no admin)
    if (!rut_usuario) {
      return res.status(400).json({ success: false, error: "RUT requerido para el reporte" });
    }

    // Generar reporte individual
    let reporte;
    if (fecha_inicio && fecha_fin) {
      reporte = await getReportePersonalMensual(rut_usuario, null, null, fecha_inicio, fecha_fin);
    } else {
      reporte = await getReportePersonalMensual(rut_usuario, mes, anio);
    }

    return res.status(200).json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error("❌ [REPORTES-CONTROLLER] Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Error generando reporte mensual",
      details: error.message
    });
  }
}

// ✅ OBTENER REPORTE COMPARATIVO (últimos 6 meses)
export async function getReporteComparativo(req, res) {
  console.log("📊 [REPORTES-CONTROLLER] ===== GET REPORTE COMPARATIVO =====");

  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;

    if (!rut_usuario) {
      return res.status(400).json({ success: false, error: "RUT no encontrado en el token" });
    }

    console.log("📊 Generando reporte comparativo para:", rut_usuario);

    const reporte = await getReporteComparativoService(rut_usuario);

    return res.status(200).json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error("❌ [REPORTES-CONTROLLER] Error comparativo:", error.message);
    return res.status(500).json({
      success: false,
      error: "Error generando reporte comparativo",
      details: error.message
    });
  }
}

// ✅ OBTENER ESTADÍSTICAS ANUALES
export async function getEstadisticasAnuales(req, res) {
  console.log("📊 [REPORTES-CONTROLLER] ===== GET ESTADÍSTICAS ANUALES =====");

  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario || user?.rut;
    const { anio } = req.query;

    if (!rut_usuario) {
      return res.status(400).json({ success: false, error: "RUT no encontrado en el token" });
    }

    const anioConsulta = anio ? parseInt(anio) : new Date().getFullYear();

    console.log("📊 Generando estadísticas anuales:", { rut_usuario, anio: anioConsulta });

    const estadisticas = await getEstadisticasAnualesService(rut_usuario, anioConsulta);

    return res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error("❌ [REPORTES-CONTROLLER] Error anual:", error.message);
    return res.status(500).json({
      success: false,
      error: "Error generando estadísticas anuales",
      details: error.message
    });
  }
}

console.log("📊 [REPORTES-CONTROLLER] ✅ Controlador de reportes cargado correctamente");