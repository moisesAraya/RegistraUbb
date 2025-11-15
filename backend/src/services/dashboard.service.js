"use strict";

import { Op } from 'sequelize';
import Usuario from '../entities/usuario.entity.js';
import QR from '../entities/qr.entity.js';
import Totem from '../entities/totem.entity.js';

// ✅ IMPORTAR EL SERVICIO REAL
let getAsistenciaUsuarioService, getEstadisticasAsistenciaService;

try {
    const asistenciaModule = await import('./asistencia.service.js');
    getAsistenciaUsuarioService = asistenciaModule.getAsistenciaUsuarioService;
    getEstadisticasAsistenciaService = asistenciaModule.getEstadisticasAsistenciaService;
    
    console.log('✅ [DASHBOARD-SERVICE] Servicios importados exitosamente');
} catch (importError) {
    console.error('❌ [DASHBOARD-SERVICE] Error importando servicios:', importError);
}

/**
 * 📊 SERVICIO - DASHBOARD CON 44 HORAS SEMANALES
 */
export async function getSimpleMetrics(rut_usuario) {
    console.log('🚀 [DASHBOARD-SERVICE] ===== INICIANDO DASHBOARD =====');
    console.log('📥 Input recibido:', { rut_usuario });
    
    try {
        if (!getAsistenciaUsuarioService) {
            throw new Error('getAsistenciaUsuarioService no está disponible');
        }

        console.log('✅ [DASHBOARD-SERVICE] Obteniendo datos...');
        
        const personal_basic_stats = await getPersonalStatsFromRealService(rut_usuario);
        const attendance_analytics = await getAttendanceAnalyticsFromRealService(rut_usuario);
        const organization_overview = await getOrganizationOverview();
        const weekly_progress = await getWeeklyProgress(rut_usuario);

        const response = {
            personal_basic_stats,
            attendance_analytics: {
                attendance_by_period: {
                    today: attendance_analytics.today || 0,
                    this_week: attendance_analytics.this_week || 0,
                    this_month: attendance_analytics.this_month || 0
                },
                weekly_trends: attendance_analytics.weekly_trends || []
            },
            organization_overview,
            weekly_progress,
            
            metadata: {
                generated_at: new Date().toISOString(),
                user_rut: rut_usuario,
                version: '7.0.0-FIXED',
                source: 'dashboard_service',
                target_weekly_hours: 44
            }
        };

        console.log('✅ [DASHBOARD-SERVICE] Dashboard generado:', {
            hoy: personal_basic_stats.today_hours,
            semana: personal_basic_stats.week_hours,
            mes: personal_basic_stats.month_hours,
            asistencia: personal_basic_stats.attendance_rate
        });

        return response;

    } catch (error) {
        console.error('❌ [DASHBOARD-SERVICE] Error:', error.message);
        throw error;
    }
}

/**
 * 👤 OBTENER STATS BÁSICOS PERSONALES
 */
async function getPersonalStatsFromRealService(rut_usuario) {
    console.log('👤 [PERSONAL-STATS] Obteniendo estadísticas personales...');
    
    try {
        const now = new Date();
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();
        
        const asistenciaData = await getAsistenciaUsuarioService(rut_usuario, mes, anio);
        const asistencias = asistenciaData.asistencias || [];
        
        // ✅ HORAS DE HOY
        const today = now.toISOString().split('T')[0];
        const todayRecord = asistencias.find(a => a.fecha === today);
        const today_hours = todayRecord ? parseFloat(todayRecord.horasTrabajadas || 0) : 0;
        
        // ✅ HORAS DE ESTA SEMANA
        const startOfWeek = getStartOfWeek(now);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const thisWeekRecords = asistencias.filter(a => {
            const recordDate = new Date(a.fecha);
            return recordDate >= startOfWeek && recordDate <= endOfWeek;
        });
        
        const week_hours = thisWeekRecords.reduce((sum, a) => 
            sum + parseFloat(a.horasTrabajadas || 0), 0);
        
        // ✅ HORAS TOTALES DEL MES
        const month_hours = asistencias.reduce((sum, a) => 
            sum + parseFloat(a.horasTrabajadas || 0), 0);
        
        // ✅ DÍAS TRABAJADOS (con al menos 1 hora)
        const days_worked_month = asistencias.filter(a => 
            parseFloat(a.horasTrabajadas || 0) > 0).length;
        
        // ✅ PROMEDIO DE HORAS POR DÍA TRABAJADO
        const avg_hours_per_day = days_worked_month > 0 ? 
            month_hours / days_worked_month : 0;
        
        // ✅ PORCENTAJE DE ASISTENCIA (días trabajados vs días laborables)
        const workDaysInMonth = getWorkDaysInMonth(now);
        const attendance_rate = workDaysInMonth > 0 ? 
            Math.round((days_worked_month / workDaysInMonth) * 100) : 0;

        // ✅ JUSTIFICACIONES PENDIENTES
        const pending_justifications = 0; // TODO: implementar cuando tengas el servicio

        // ✅ ACTIVIDADES RECIENTES (últimos 5 registros)
        const recent_activities = asistencias.slice(0, 5).map(a => ({
            date: a.fecha,
            time: a.horaIngreso ? a.horaIngreso.substring(0, 5) : '-',
            description: `${a.horasTrabajadas}h trabajadas`,
            status: a.estado,
            type: 'asistencia'
        }));

        const stats = {
            today_hours: Math.round(today_hours * 100) / 100,
            week_hours: Math.round(week_hours * 100) / 100,
            month_hours: Math.round(month_hours * 100) / 100,
            total_hours_month: Math.round(month_hours * 100) / 100,
            days_worked_month,
            avg_hours_per_day: Math.round(avg_hours_per_day * 100) / 100,
            attendance_rate,
            pending_justifications,
            recent_activities,
            last_updated: new Date().toISOString()
        };

        console.log('✅ [PERSONAL-STATS] Stats calculados:', {
            hoy: stats.today_hours,
            semana: stats.week_hours,
            mes: stats.month_hours,
            tasa: stats.attendance_rate
        });

        return stats;
        
    } catch (error) {
        console.error('❌ [PERSONAL-STATS] Error:', error);
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
            last_updated: new Date().toISOString()
        };
    }
}

/**
 * 📈 PROGRESO SEMANAL HACIA 44 HORAS
 */
/**
 * 📈 PROGRESO SEMANAL HACIA 44 HORAS
 */
async function getWeeklyProgress(rut_usuario) {
    console.log('📈 [WEEKLY-PROGRESS] Calculando progreso semanal...');
    
    try {
        const now = new Date();
        const startOfWeek = getStartOfWeek(now);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();
        
        const asistenciaData = await getAsistenciaUsuarioService(rut_usuario, mes, anio);
        const asistencias = asistenciaData.asistencias || [];
        
        // ✅ FILTRAR SOLO REGISTROS DE ESTA SEMANA
        const thisWeekRecords = asistencias.filter(a => {
            const recordDate = new Date(a.fecha);
            return recordDate >= startOfWeek && recordDate <= endOfWeek;
        });
        
        // ✅ CALCULAR HORAS DE ESTA SEMANA
        const hours_this_week = thisWeekRecords.reduce((sum, a) => 
            sum + parseFloat(a.horasTrabajadas || 0), 0);
        
        // ✅ OBJETIVO: 44 HORAS SEMANALES
        const target_weekly_hours = 44;
        const progress_percentage = Math.min(100, Math.round((hours_this_week / target_weekly_hours) * 100));
        const hours_remaining = Math.max(0, target_weekly_hours - hours_this_week);
        
        // ✅ DÍAS TRABAJADOS ESTA SEMANA
        const days_worked_this_week = thisWeekRecords.filter(a => 
            parseFloat(a.horasTrabajadas || 0) > 0).length;
        
        // ✅ PROMEDIO DIARIO ESTA SEMANA
        const avg_daily_hours = days_worked_this_week > 0 ? 
            hours_this_week / days_worked_this_week : 0;
        
        // ✅ DÍAS NECESARIOS PARA COMPLETAR 44H
        let days_to_complete = 0;
        if (hours_remaining > 0 && avg_daily_hours > 0) {
            days_to_complete = Math.ceil(hours_remaining / avg_daily_hours);
        }

        // ✅ ESTADO DEL PROGRESO (SIN TYPESCRIPT)
        let status;
        if (progress_percentage >= 100) {
            status = 'completed';
        } else if (progress_percentage >= 80) {
            status = 'on_track';
        } else if (progress_percentage >= 60) {
            status = 'behind';
        } else {
            status = 'needs_attention';
        }

        const progress = {
            hours_this_week: Math.round(hours_this_week * 100) / 100,
            target_weekly_hours,
            progress_percentage,
            hours_remaining: Math.round(hours_remaining * 100) / 100,
            days_worked_this_week,
            avg_daily_hours: Math.round(avg_daily_hours * 100) / 100,
            days_to_complete,
            week_start: startOfWeek.toISOString().split('T')[0],
            week_end: endOfWeek.toISOString().split('T')[0],
            status
        };

        console.log('✅ [WEEKLY-PROGRESS] Progreso calculado:', {
            horas: progress.hours_this_week,
            objetivo: progress.target_weekly_hours,
            porcentaje: progress.progress_percentage,
            estado: progress.status
        });

        return progress;
        
    } catch (error) {
        console.error('❌ [WEEKLY-PROGRESS] Error:', error);
        return {
            hours_this_week: 0,
            target_weekly_hours: 44,
            progress_percentage: 0,
            hours_remaining: 44,
            days_worked_this_week: 0,
            avg_daily_hours: 0,
            days_to_complete: 0,
            week_start: '',
            week_end: '',
            status: 'needs_attention'
        };
    }
}

/**
 * 📊 ANALÍTICAS DE ASISTENCIA
 */
async function getAttendanceAnalyticsFromRealService(rut_usuario) {
    console.log('📊 [ATTENDANCE-ANALYTICS] Obteniendo analíticas...');
    
    try {
        const now = new Date();
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();
        
        const asistenciaData = await getAsistenciaUsuarioService(rut_usuario, mes, anio);
        const asistencias = asistenciaData.asistencias || [];
        
        // ✅ REGISTROS POR PERÍODO
        const today = now.toISOString().split('T')[0];
        const startOfWeek = getStartOfWeek(now);
        
        const today_count = asistencias.filter(a => a.fecha === today).length;
        const this_week = asistencias.filter(a => {
            const recordDate = new Date(a.fecha);
            return recordDate >= startOfWeek;
        }).length;
        const this_month = asistencias.length;
        
        // ✅ TENDENCIAS SEMANALES (últimas 4 semanas)
        const weekly_trends = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(startOfWeek);
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const weekRecords = asistencias.filter(a => {
                const recordDate = new Date(a.fecha);
                return recordDate >= weekStart && recordDate <= weekEnd;
            });
            
            const weekHours = weekRecords.reduce((sum, a) => 
                sum + parseFloat(a.horasTrabajadas || 0), 0);
            
            weekly_trends.push({
                week: `Semana ${4 - i}`,
                hours: Math.round(weekHours * 100) / 100,
                days: weekRecords.filter(a => parseFloat(a.horasTrabajadas || 0) > 0).length
            });
        }
        
        console.log('✅ [ATTENDANCE-ANALYTICS] Analíticas calculadas');
        
        return {
            today: today_count,
            this_week,
            this_month,
            weekly_trends
        };
        
    } catch (error) {
        console.error('❌ [ATTENDANCE-ANALYTICS] Error:', error);
        return {
            today: 0,
            this_week: 0,
            this_month: 0,
            weekly_trends: []
        };
    }
}

/**
 * 🏢 OVERVIEW ORGANIZACIONAL
 */
async function getOrganizationOverview() {
    console.log('🏢 [ORGANIZATION] Obteniendo overview...');
    
    try {
        const totalUsers = await Usuario.count();
        const totalQRsActivos = await QR.count({ where: { estado_qr: true } });
        const totalQRs = await QR.count();
        const totalTotems = await Totem.count();

        const result = {
            total_active_users: totalUsers,
            qr_code_stats: {
                active: totalQRsActivos,
                total: totalQRs
            },
            totems_count: totalTotems,
            system_status: 'operational',
            last_updated: new Date().toISOString()
        };

        console.log('✅ [ORGANIZATION] Overview generado');
        return result;
        
    } catch (error) {
        console.error('❌ [ORGANIZATION] Error:', error);
        return {
            total_active_users: 0,
            qr_code_stats: { active: 0, total: 0 },
            totems_count: 0,
            system_status: 'error',
            last_updated: new Date().toISOString()
        };
    }
}

// ✅ FUNCIONES AUXILIARES

function getStartOfWeek(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
}

function getWorkDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let workDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workDays++;
        }
    }
    
    return workDays;
}

// ✅ EXPORTAR FUNCIONES
export async function getRealTimeData(rut_usuario) {
    return {
        timestamp: new Date().toISOString(),
        currently_active: 0,
        recent_marcajes: []
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
        message: 'Dashboard v7.0 - 44 horas semanales',
        source: 'dashboard_service'
    };
}

