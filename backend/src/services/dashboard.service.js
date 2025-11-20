import Marcaje from "../entities/marcaje.entity.js";
import Justificacion from "../entities/justificacion.entity.js";
/**
 * 📊 NUEVO: Calcular progreso semanal directo desde Marcaje y Justificacion
 */
export async function getWeeklyProgressDirectFromMarcajes(rut_usuario) {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    // Obtener marcajes de la semana
    const marcajes = await Marcaje.findAll({
      where: {
        rut_usuario,
        fecha: {
          // Entre domingo y sábado
          [Marcaje.sequelize.Op.between]: [
            startOfWeek.toISOString().slice(0,10),
            endOfWeek.toISOString().slice(0,10)
          ]
        }
      }
    });

    // Obtener justificaciones de la semana
    const justificaciones = await Justificacion.findAll({
      where: {
        rut_usuario,
        fecha_justificacion: {
          [Justificacion.sequelize.Op.between]: [
            startOfWeek.toISOString().slice(0,10),
            endOfWeek.toISOString().slice(0,10)
          ]
        }
      }
    });

    // Generar array de días de la semana (domingo a sábado)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const fechaStr = date.toISOString().slice(0, 10);
      let horas = 0;
      let justificacion = null;
      let status = "none";

      // Buscar marcaje
      const marcaje = marcajes.find(m => m.fecha === fechaStr);
      if (marcaje && marcaje.hora_ingreso && marcaje.hora_salida) {
        const h1 = new Date(marcaje.hora_ingreso);
        const h2 = new Date(marcaje.hora_salida);
        const diff = (h2 - h1) / (1000*60*60);
        if (diff > 0) horas += diff;
      }

      // Buscar justificación
      const justif = justificaciones.find(j => j.fecha_justificacion === fechaStr);
      if (justif) {
        justificacion = {
          motivo: justif.motivo,
          descripcion: justif.descripcion,
          es_justificada: !!justif.es_justificada,
          horas_compensadas: Number(justif.horas_compensadas) || 0,
        };
        if (justif.es_justificada && justif.horas_compensadas) {
          horas += Number(justif.horas_compensadas);
        }
      }

      // Status
      if (justificacion) {
        status = justificacion.es_justificada ? "justified" : "unjustified";
      } else if (horas >= 7) {
        status = "success";
      } else if (horas >= 4) {
        status = "warning";
      } else if (horas > 0) {
        status = "error";
      }

      weekDays.push({
        date: fechaStr,
        hours: Math.round(horas * 100) / 100,
        status,
        justificacion,
      });
    }

    // Calcular totales
    const hours_this_week = weekDays.reduce((a, d) => a + d.hours, 0);
    const target_weekly_hours = 44;
    const progress_percentage = Math.min(100, Math.round((hours_this_week / target_weekly_hours) * 100));
    const hours_remaining = Math.max(0, target_weekly_hours - hours_this_week);
    const days_worked_this_week = weekDays.filter(d => d.hours > 0 || d.status === "justified").length;
    const avg_daily_hours = days_worked_this_week > 0 ? hours_this_week / days_worked_this_week : 0;
    let days_to_complete = 0;
    if (hours_remaining > 0 && avg_daily_hours > 0) {
      days_to_complete = Math.ceil(hours_remaining / avg_daily_hours);
    }
    let status;
    if (progress_percentage >= 100) status = "completed";
    else if (progress_percentage >= 80) status = "on_track";
    else if (progress_percentage >= 60) status = "behind";
    else status = "needs_attention";

    return {
      hours_this_week: Math.round(hours_this_week * 100) / 100,
      target_weekly_hours,
      progress_percentage,
      hours_remaining: Math.round(hours_remaining * 100) / 100,
      days_worked_this_week,
      avg_daily_hours: Math.round(avg_daily_hours * 100) / 100,
      days_to_complete,
      week_start: startOfWeek.toISOString().slice(0,10),
      week_end: endOfWeek.toISOString().slice(0,10),
      status,
      week_days: weekDays,
    };
  } catch (error) {
    console.error("❌ [WEEKLY-PROGRESS-DIRECT] Error:", error);
    return {
      hours_this_week: 0,
      target_weekly_hours: 44,
      progress_percentage: 0,
      hours_remaining: 44,
      days_worked_this_week: 0,
      avg_daily_hours: 0,
      days_to_complete: 0,
      week_start: "",
      week_end: "",
      status: "needs_attention",
    };
  }
}
"use strict";

import Usuario from "../entities/usuario.entity.js";
import QR from "../entities/qr.entity.js";
import Totem from "../entities/totem.entity.js";

// ⬅️ AJUSTA ESTA RUTA/NOMBRE SI TU SERVICE SE LLAMA DISTINTO
import { getReportePersonalMensual } from "./reportes.service.js";

/**
 * 📊 SERVICIO - DASHBOARD (basado en getReportePersonalMensual)
 * TODO lo que ve el dashboard sale del MISMO cálculo que los reportes
 */
export async function getSimpleMetrics(rut_usuario) {
  console.log("🚀 [DASHBOARD-SERVICE] ===== INICIANDO DASHBOARD =====");
  console.log("📥 Input recibido:", { rut_usuario });

  try {
    if (!rut_usuario) {
      throw new Error("RUT de usuario requerido");
    }

    console.log("✅ [DASHBOARD-SERVICE] Obteniendo datos de reportes...");

    const personal_basic_stats = await getPersonalStatsFromReportes(rut_usuario);
    const attendance_analytics = await getAttendanceAnalyticsFromReportes(
      rut_usuario
    );
    const organization_overview = await getOrganizationOverview();
    // Usar la nueva función directa para progreso semanal
    const weekly_progress = await getWeeklyProgressDirectFromMarcajes(rut_usuario);

    const response = {
      personal_basic_stats,
      attendance_analytics: {
        attendance_by_period: {
          today: attendance_analytics.today || 0,
          this_week: attendance_analytics.this_week || 0,
          this_month: attendance_analytics.this_month || 0,
        },
        weekly_trends: attendance_analytics.weekly_trends || [],
      },
      organization_overview,
      weekly_progress,

      metadata: {
        generated_at: new Date().toISOString(),
        user_rut: rut_usuario,
        version: "8.0.0-REPORTES",
        source: "dashboard_service",
        target_weekly_hours: 44,
      },
    };

    console.log("✅ [DASHBOARD-SERVICE] Dashboard generado:", {
      hoy: personal_basic_stats.today_hours,
      semana: personal_basic_stats.week_hours,
      mes: personal_basic_stats.month_hours,
      asistencia: personal_basic_stats.attendance_rate,
    });

    return response;
  } catch (error) {
    console.error("❌ [DASHBOARD-SERVICE] Error:", error.message);
    throw error;
  }
}

/* =========================================================
 * 👤 STATS PERSONALES - basado en getReportePersonalMensual
 * ========================================================= */
async function getPersonalStatsFromReportes(rut_usuario) {
  console.log("👤 [PERSONAL-STATS] Obteniendo estadísticas personales...");

  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    // 🔑 MISMO SERVICE QUE REPORTES/EXCEL/PDF
    const reporte = await getReportePersonalMensual(rut_usuario, mes, anio);

    const asistencias = reporte.asistencias_detalle || [];
    const resumen = reporte.resumen_basico || {
      horasTotales: 0,
      diasTrabajados: 0,
      faltas: 0,
    };

    // -----------------------------
    // HORAS DE HOY
    // -----------------------------
    const todayStr = now.toISOString().split("T")[0];
    const todayRecord = asistencias.find((a) => a.fecha === todayStr);
    const today_hours = todayRecord ? Number(todayRecord.horas_totales || 0) : 0;

    // -----------------------------
    // HORAS TOTALES DEL MES
    // (ya vienen calculadas y correctas)
    // -----------------------------
    const month_hours = Number(resumen.horasTotales || 0);
    const days_worked_month = Number(resumen.diasTrabajados || 0);
    const faltas = Number(resumen.faltas || 0);
    const total_dias_mes = days_worked_month + faltas;

    // -----------------------------
    // HORAS DE ESTA SEMANA
    // -----------------------------
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const thisWeekRecords = asistencias.filter((a) => {
      const fecha = new Date(a.fecha + "T00:00:00");
      return fecha >= startOfWeek && fecha <= endOfWeek;
    });

    const week_hours = thisWeekRecords.reduce(
      (sum, a) => sum + Number(a.horas_totales || 0),
      0
    );

    // -----------------------------
    // PROMEDIO HORAS / DÍA TRABAJADO
    // -----------------------------
    const avg_hours_per_day =
      days_worked_month > 0 ? month_hours / days_worked_month : 0;

    // -----------------------------
    // PORCENTAJE DE ASISTENCIA
    // (días trabajados / (trabajados + faltas))
    // -----------------------------
    const attendance_rate =
      total_dias_mes > 0
        ? Math.round((days_worked_month / total_dias_mes) * 100)
        : 0;

    // -----------------------------
    // JUSTIFICACIONES PENDIENTES
    // (por ahora 0, se puede conectar luego al service de justificaciones)
    // -----------------------------
    const pending_justifications = 0;

    // -----------------------------
    // ACTIVIDADES RECIENTES (últimas 5 filas)
    // -----------------------------
    const asistenciasOrdenadas = [...asistencias].sort(
      (a, b) => b.fecha.localeCompare(a.fecha)
    );

    const recent_activities = asistenciasOrdenadas.slice(0, 5).map((a) => {
      const horas = Number(a.horas_totales || 0);
      let status = a.estado || "presente";

      if (a.justificacion) {
        status = a.justificacion.es_justificada ? "justificado" : "no_justificado";
      }

      return {
        date: a.fecha,
        time:
          a.manana?.entrada && a.manana.entrada !== "X"
            ? String(a.manana.entrada).toString().substring(0, 5)
            : "-",
        description: `${horas}h trabajadas`,
        status,
        type: "asistencia",
      };
    });

    const stats = {
      today_hours: redondear2(today_hours),
      week_hours: redondear2(week_hours),
      month_hours: redondear2(month_hours),
      total_hours_month: redondear2(month_hours),
      days_worked_month,
      avg_hours_per_day: redondear2(avg_hours_per_day),
      attendance_rate,
      pending_justifications,
      recent_activities,
      last_updated: new Date().toISOString(),
    };

    console.log("✅ [PERSONAL-STATS] Stats calculados:", {
      hoy: stats.today_hours,
      semana: stats.week_hours,
      mes: stats.month_hours,
      tasa: stats.attendance_rate,
    });

    return stats;
  } catch (error) {
    console.error("❌ [PERSONAL-STATS] Error:", error);
    return {
      today_hours: 0,
      week_hours: 0,
      month_hours: 0,
      total_hours_month: 0,
      days_worked_month: 0,
      avg_hours_per_day: 0,
      attendance_rate: 0,
      pending_justifications: 0,
      recent_activities: [],
      last_updated: new Date().toISOString(),
    };
  }
}

/* =========================================================
 * 📈 PROGRESO SEMANAL HACIA 44 HORAS (usa reportes)
 * ========================================================= */
async function getWeeklyProgressFromReportes(rut_usuario) {
  console.log("📈 [WEEKLY-PROGRESS] Calculando progreso semanal (reportes)...");

  try {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const reporte = await getReportePersonalMensual(rut_usuario, mes, anio);
    const asistencias = reporte.asistencias_detalle || [];

    const thisWeekRecords = asistencias.filter((a) => {
      const fecha = new Date(a.fecha + "T00:00:00");
      return fecha >= startOfWeek && fecha <= endOfWeek;
    });

    // Sumar horas trabajadas + horas compensadas por justificación justificada
    const hours_this_week = thisWeekRecords.reduce((sum, a) => {
      const horas = Number(a.horas_totales || 0);
      const horasCompensadas = a.justificacion?.es_justificada ? Number(a.justificacion.horas_compensadas || 0) : 0;
      return sum + horas + horasCompensadas;
    }, 0);

    const target_weekly_hours = 44;
    const progress_percentage = Math.min(
      100,
      Math.round((hours_this_week / target_weekly_hours) * 100)
    );
    const hours_remaining = Math.max(0, target_weekly_hours - hours_this_week);

    // Día trabajado esta semana: horas > 0 o justificación justificada
    const days_worked_this_week = thisWeekRecords.filter((a) => {
      const tieneHoras = Number(a.horas_totales || 0) > 0;
      const justificada = a.justificacion?.es_justificada === true;
      return tieneHoras || justificada;
    }).length;

    const avg_daily_hours =
      days_worked_this_week > 0 ? hours_this_week / days_worked_this_week : 0;

    let days_to_complete = 0;
    if (hours_remaining > 0 && avg_daily_hours > 0) {
      days_to_complete = Math.ceil(hours_remaining / avg_daily_hours);
    }

    let status;
    if (progress_percentage >= 100) status = "completed";
    else if (progress_percentage >= 80) status = "on_track";
    else if (progress_percentage >= 60) status = "behind";
    else status = "needs_attention";

    const progress = {
      hours_this_week: redondear2(hours_this_week),
      target_weekly_hours,
      progress_percentage,
      hours_remaining: redondear2(hours_remaining),
      days_worked_this_week,
      avg_daily_hours: redondear2(avg_daily_hours),
      days_to_complete,
      week_start: startOfWeek.toISOString().split("T")[0],
      week_end: endOfWeek.toISOString().split("T")[0],
      status,
    };

    console.log("✅ [WEEKLY-PROGRESS] Progreso calculado:", {
      horas: progress.hours_this_week,
      objetivo: progress.target_weekly_hours,
      porcentaje: progress.progress_percentage,
      estado: progress.status,
    });

    return progress;
  } catch (error) {
    console.error("❌ [WEEKLY-PROGRESS] Error:", error);
    return {
      hours_this_week: 0,
      target_weekly_hours: 44,
      progress_percentage: 0,
      hours_remaining: 44,
      days_worked_this_week: 0,
      avg_daily_hours: 0,
      days_to_complete: 0,
      week_start: "",
      week_end: "",
      status: "needs_attention",
    };
  }
}

/* =========================================================
 * 📊 ANALÍTICAS DE ASISTENCIA (también con reportes)
 * ========================================================= */
async function getAttendanceAnalyticsFromReportes(rut_usuario) {
  console.log("📊 [ATTENDANCE-ANALYTICS] Obteniendo analíticas (reportes)...");

  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const reporte = await getReportePersonalMensual(rut_usuario, mes, anio);
    const asistencias = reporte.asistencias_detalle || [];

    const todayStr = now.toISOString().split("T")[0];
    const startOfWeek = getStartOfWeek(now);

    const isWorkedDay = (a) => {
      const horas = Number(a.horas_totales || 0);
      const justificada = a.justificacion?.es_justificada === true;
      return horas > 0 || justificada;
    };

    const today = asistencias.filter((a) => a.fecha === todayStr && isWorkedDay(a))
      .length;

    const this_week = asistencias.filter((a) => {
      const fecha = new Date(a.fecha + "T00:00:00");
      return fecha >= startOfWeek && isWorkedDay(a);
    }).length;

    const this_month = asistencias.filter((a) => isWorkedDay(a)).length;

    // Tendencias últimas 4 semanas
    const weekly_trends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekRecords = asistencias.filter((a) => {
        const fecha = new Date(a.fecha + "T00:00:00");
        return fecha >= weekStart && fecha <= weekEnd;
      });

      const weekHours = weekRecords.reduce(
        (sum, a) => sum + Number(a.horas_totales || 0),
        0
      );

      const diasSemana = weekRecords.filter((a) => isWorkedDay(a)).length;

      weekly_trends.push({
        week: `Semana ${4 - i}`,
        hours: redondear2(weekHours),
        days: diasSemana,
      });
    }

    console.log("✅ [ATTENDANCE-ANALYTICS] Analíticas calculadas");

    return {
      today,
      this_week,
      this_month,
      weekly_trends,
    };
  } catch (error) {
    console.error("❌ [ATTENDANCE-ANALYTICS] Error:", error);
    return {
      today: 0,
      this_week: 0,
      this_month: 0,
      weekly_trends: [],
    };
  }
}

/* =========================================================
 * 🏢 OVERVIEW ORGANIZACIONAL
 * ========================================================= */
async function getOrganizationOverview() {
  console.log("🏢 [ORGANIZATION] Obteniendo overview...");

  try {
    const totalUsers = await Usuario.count();
    const totalQRsActivos = await QR.count({ where: { estado_qr: true } });
    const totalQRs = await QR.count();
    const totalTotems = await Totem.count();

    const result = {
      total_active_users: totalUsers,
      qr_code_stats: {
        active: totalQRsActivos,
        total: totalQRs,
      },
      totems_count: totalTotems,
      system_status: "operational",
      last_updated: new Date().toISOString(),
    };

    console.log("✅ [ORGANIZATION] Overview generado");
    return result;
  } catch (error) {
    console.error("❌ [ORGANIZATION] Error:", error);
    return {
      total_active_users: 0,
      qr_code_stats: { active: 0, total: 0 },
      totems_count: 0,
      system_status: "error",
      last_updated: new Date().toISOString(),
    };
  }
}

/* =========================================================
 * 🔧 AUXILIARES
 * ========================================================= */

function getStartOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // lunes
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function redondear2(num) {
  return Math.round(Number(num || 0) * 100) / 100;
}

/* =========================================================
 * EXPORTS EXTRA (para otras rutas)
 * ========================================================= */

export async function getRealTimeData(rut_usuario) {
  return {
    timestamp: new Date().toISOString(),
    currently_active: 0,
    recent_marcajes: [],
  };
}

export async function getAdvancedAnalytics(rut_usuario) {
  return await getSimpleMetrics(rut_usuario);
}

export async function getCompleteMetrics(rut_usuario) {
  return await getSimpleMetrics(rut_usuario);
}

export async function getDebugInfo(rut_usuario) {
  return {
    timestamp: new Date().toISOString(),
    user: rut_usuario,
    message: "Dashboard v8.0 - basado en reportes",
    source: "dashboard_service",
  };
}

/* =========================================================
 * 👑 MÉTRICAS GLOBALES PARA DASHBOARD ADMIN
 * ========================================================= */
export async function getAdminDashboardMetrics() {
  console.log("👑 [ADMIN-DASHBOARD-SERVICE] Calculando métricas globales...");

  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const usuarios = await Usuario.findAll({
      attributes: ["rut_usuario", "id_rol"],
    });

    const overview = await getOrganizationOverview();

    let totalHorasMes = 0;
    let today = 0;
    let this_week = 0;
    let this_month = 0;

    const todayStr = now.toISOString().split("T")[0];
    const startOfWeek = getStartOfWeek(now);

    // 📊 NUEVAS MÉTRICAS PARA ADMIN DASHBOARD
    let totalAcademicos = 0;
    let academicosPresentes = 0;
    let totalDiasConMarcajes = 0;
    let semanaAnteriorHoras = {};

    const isWorkedDay = (a) => {
      const horas = Number(a.horas_totales || 0);
      const justificada = a.justificacion?.es_justificada === true;
      return horas > 0 || justificada;
    };

    // 📅 Calcular semana anterior para el gráfico
    const startOfPreviousWeek = new Date(startOfWeek);
    startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
    const endOfPreviousWeek = new Date(startOfWeek);
    endOfPreviousWeek.setDate(endOfPreviousWeek.getDate() - 1);

    console.log("📅 [ADMIN-DASHBOARD] Rangos de fechas:", {
      today: todayStr,
      startOfWeek: startOfWeek.toISOString().split("T")[0],
      startOfPreviousWeek: startOfPreviousWeek.toISOString().split("T")[0],
      endOfPreviousWeek: endOfPreviousWeek.toISOString().split("T")[0]
    });

    for (const u of usuarios) {
      const rut = u.rut_usuario;
      const rol = u.id_rol;
      if (!rut) continue;

      // Contar académicos (excluir administradores y otros roles no académicos)
      if (rol && rol !== 1) { // No contar admins como académicos
        totalAcademicos++;
      }

      const reporte = await getReportePersonalMensual(rut, mes, anio);
      const asistencias = reporte.asistencias_detalle || [];
      const resumen = reporte.resumen_basico || {};

      const horas = Number(resumen.horasTotales || 0);
      totalHorasMes += horas;

      // Verificar si el académico está presente hoy
      const presenteHoy = asistencias.some((a) => a.fecha === todayStr && isWorkedDay(a));
      if (presenteHoy && rol !== 1) {
        academicosPresentes++;
      }

      // Contar días con marcajes para promedio diario
      const diasConMarcajes = asistencias.filter((a) => isWorkedDay(a)).length;
      if (diasConMarcajes > 0 && rol !== 1) {
        totalDiasConMarcajes += diasConMarcajes;
      }

      // Calcular horas de semana anterior por día para el gráfico
      if (rol !== 1) { // Solo académicos para el gráfico
        asistencias.forEach((a) => {
          const fechaMarcaje = new Date(a.fecha + "T00:00:00");
          if (fechaMarcaje >= startOfPreviousWeek && fechaMarcaje <= endOfPreviousWeek && isWorkedDay(a)) {
            const dia = a.fecha;
            const horas = Number(a.horas_totales || 0);
            if (!semanaAnteriorHoras[dia]) {
              semanaAnteriorHoras[dia] = 0;
            }
            semanaAnteriorHoras[dia] += horas;
          }
        });
      }

      today += asistencias.filter(
        (a) => a.fecha === todayStr && isWorkedDay(a)
      ).length;

      this_week += asistencias.filter((a) => {
        const fecha = new Date(a.fecha + "T00:00:00");
        return fecha >= startOfWeek && isWorkedDay(a);
      }).length;

      this_month += asistencias.filter((a) => isWorkedDay(a)).length;
    }

    const totalUsuarios = usuarios.length || 1;
    const semanasAprox = 4;
    const averageWeeklyHours =
      totalUsuarios > 0 ? (totalHorasMes / semanasAprox) / totalUsuarios : 0;

    // Calcular promedio diario de académicos
    const promedioDiarioAcademicos = totalAcademicos > 0 ? totalDiasConMarcajes / 30 : 0; // Asumiendo 30 días del mes

    // Convertir horas de semana anterior a array para el gráfico
    const semanaAnteriorArray = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(startOfPreviousWeek);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().split("T")[0];
      const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
      semanaAnteriorArray.push({
        dia: nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1),
        fecha: fechaStr,
        horas: redondear2(semanaAnteriorHoras[fechaStr] || 0)
      });
    }

    const result = {
      organization_overview: {
        ...overview,
        total_hours_month: redondear2(totalHorasMes),
        average_weekly_hours: redondear2(averageWeeklyHours),
        total_academicos: totalAcademicos,
        academicos_presentes: academicosPresentes,
        promedio_diario_academicos: redondear2(promedioDiarioAcademicos),
      },
      attendance_analytics: {
        attendance_by_period: {
          today,
          this_week,
          this_month,
        },
        semana_anterior_horas: semanaAnteriorArray,
      },
    };

    console.log("✅ [ADMIN-DASHBOARD-SERVICE] Métricas globales calculadas:", {
      totalHorasMes: result.organization_overview.total_hours_month,
      totalAcademicos: result.organization_overview.total_academicos,
      academicosPresentes: result.organization_overview.academicos_presentes,
      promedioDiarioAcademicos: result.organization_overview.promedio_diario_academicos,
      semanaAnteriorDias: result.attendance_analytics.semana_anterior_horas.length,
      today,
      this_week,
      this_month,
    });

    return result;
  } catch (error) {
    console.error("❌ [ADMIN-DASHBOARD-SERVICE] Error:", error);
    return {
      organization_overview: {
        total_active_users: 0,
        qr_code_stats: { active: 0, total: 0 },
        totems_count: 0,
        system_status: "error",
        last_updated: new Date().toISOString(),
        total_hours_month: 0,
        average_weekly_hours: 0,
        total_academicos: 0,
        academicos_presentes: 0,
        promedio_diario_academicos: 0,
      },
      attendance_analytics: {
        attendance_by_period: {
          today: 0,
          this_week: 0,
          this_month: 0,
        },
        semana_anterior_horas: [],
      },
    };
  }
}
