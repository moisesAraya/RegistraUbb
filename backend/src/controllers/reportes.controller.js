"use strict";

import {
  getReportePersonalMensual,
  getReporteComparativo as getReporteComparativoService,
  getEstadisticasAnuales as getEstadisticasAnualesService
} from "../services/reportes.service.js";
import Usuario from "../entities/usuario.entity.js";

/**
 * 📊 CONTROLADOR DE REPORTES
 * Gestiona reportes mensuales, comparativos y anuales.
 */

// ===========================================
// ✅ REPORTE MENSUAL / POR RANGO (PERSONAL O ADMIN)
// ===========================================
export async function getReporteMensual(req, res) {
  console.log("📊 [REPORTES-CONTROLLER] GET REPORTE MENSUAL");

  try {
    const user = req.user;
    let rut_usuario = user?.rut_usuario;

    const {
      mes,
      anio,
      rut,
      todos,
      fecha_inicio,
      fecha_fin
    } = req.query;

    // --- Validación básica ---
    const usandoRango = fecha_inicio && fecha_fin;
    const usandoMes = mes && anio;

    if (!usandoRango && !usandoMes) {
      return res.status(400).json({
        success: false,
        error:
          "Debe enviar mes/año o un rango de fechas (fecha_inicio, fecha_fin)",
      });
    }

    // --- Admin puede consultar otros usuarios ---
    const esAdmin = user?.id_rol === 1;
    if (esAdmin && rut) rut_usuario = rut;

    // --- Admin → obtener TODOS ---
    if (esAdmin && todos === "true") {
      console.log("📊 Enviando reportes de TODOS los usuarios…");

      const usuarios = await Usuario.findAll({
        attributes: ["rut_usuario", "nombres", "apellidos", "id_rol"],
        include: ["cargo"],
      });

      const reportes = [];

      for (const u of usuarios) {
        try {
          let rep;

          if (usandoRango) {
            rep = await getReportePersonalMensual(
              u.rut_usuario,
              null,
              null,
              fecha_inicio,
              fecha_fin
            );
          } else {
            rep = await getReportePersonalMensual(
              u.rut_usuario,
              mes,
              anio
            );
          }

          reportes.push({
            usuario: {
              rut_usuario: u.rut_usuario,
              nombres: u.nombres,
              apellidos: u.apellidos,
              id_rol: u.id_rol,
              cargo: u.cargo?.nombre_cargo || null,
            },
            reporte: rep,
          });
        } catch (err) {
          reportes.push({
            usuario: {
              rut_usuario: u.rut_usuario,
              nombres: u.nombres,
              apellidos: u.apellidos,
            },
            error: err.message,
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: reportes,
      });
    }

    // --- No admin y sin rut válido ---
    if (!rut_usuario) {
      return res.status(400).json({
        success: false,
        error: "RUT no encontrado en el token",
      });
    }

    // --- Reporte individual ---
    let reporte;

    if (usandoRango) {
      reporte = await getReportePersonalMensual(
        rut_usuario,
        null,
        null,
        fecha_inicio,
        fecha_fin
      );
    } else {
      reporte = await getReportePersonalMensual(
        rut_usuario,
        mes,
        anio
      );
    }

    return res.status(200).json({
      success: true,
      data: reporte,
    });
  } catch (error) {
    console.error("❌ [REPORTES-CONTROLLER] Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Error generando reporte mensual",
      details: error.message,
    });
  }
}

// ===========================================
// ✅ REPORTE COMPARATIVO (6 meses)
// ===========================================
export async function getReporteComparativo(req, res) {
  console.log("📊 [REPORTES-CONTROLLER] GET REPORTE COMPARATIVO");

  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario;

    if (!rut_usuario) {
      return res.status(400).json({
        success: false,
        error: "RUT no encontrado en el token",
      });
    }

    const reporte = await getReporteComparativoService(rut_usuario);

    return res.status(200).json({
      success: true,
      data: reporte,
    });
  } catch (error) {
    console.error("❌ Error comparativo:", error.message);
    return res.status(500).json({
      success: false,
      error: "Error generando reporte comparativo",
    });
  }
}

// ===========================================
// ✅ ESTADÍSTICAS ANUALES
// ===========================================
export async function getEstadisticasAnuales(req, res) {
  console.log("📊 [REPORTES-CONTROLLER] GET ESTADÍSTICAS ANUALES");

  try {
    const user = req.user;
    const rut_usuario = user?.rut_usuario;
    const { anio } = req.query;

    if (!rut_usuario) {
      return res.status(400).json({
        success: false,
        error: "RUT no encontrado en el token",
      });
    }

    const anioConsulta = anio
      ? parseInt(anio)
      : new Date().getFullYear();

    const estadisticas = await getEstadisticasAnualesService(
      rut_usuario,
      anioConsulta
    );

    return res.status(200).json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error("❌ Error anual:", error.message);
    return res.status(500).json({
      success: false,
      error: "Error generando estadísticas anuales",
    });
  }
}

console.log("📊 [REPORTES-CONTROLLER] Cargado correctamente");
