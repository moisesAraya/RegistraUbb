"use strict";

import { Op } from 'sequelize';
import Usuario from '../entities/usuario.entity.js';

// ✅ IMPORTAR EL SERVICIO REAL
let getAsistenciaUsuarioService, getEstadisticasAsistenciaService;

try {
    const asistenciaModule = await import('./asistencia.service.js');
    getAsistenciaUsuarioService = asistenciaModule.getAsistenciaUsuarioService;
    getEstadisticasAsistenciaService = asistenciaModule.getEstadisticasAsistenciaService;
    
    console.log('✅ [DASHBOARD-SIMPLE] Servicios importados exitosamente');
} catch (importError) {
    console.error('❌ [DASHBOARD-SIMPLE] Error importando servicios:', importError);
}

/**
 * 📊 SERVICIO SIMPLIFICADO - SOLO REGISTRO DE HORAS
 */
export async function getSimpleMetrics(rut_usuario) {
    console.log('🚀 [DASHBOARD-SIMPLE] ===== INICIANDO DASHBOARD SIMPLIFICADO =====');
    console.log('📥 Input recibido:', { rut_usuario, tipo: typeof rut_usuario });
    
    try {
        if (!getAsistenciaUsuarioService) {
            throw new Error('getAsistenciaUsuarioService no está disponible');
        }

        console.log('✅ [DASHBOARD-SIMPLE] Obteniendo datos básicos...');
        
        // ✅ OBTENER SOLO DATOS BÁSICOS
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
                weekly_trends: attendance_analytics.weekly_trends || [],
                monthly_comparison: attendance_analytics.monthly_comparison || []
            },
            organization_overview,
            weekly_progress,
            
            metadata: {
                generated_at: new Date().toISOString(),
                user_rut: rut_usuario,
                version: '6.0.0-SIMPLE',
                source: 'simple_dashboard_service',
                modules: ['basic_stats', 'attendance_analytics', 'weekly_progress']
            }
        };

        console.log('✅ [DASHBOARD-SIMPLE] Dashboard simplificado generado:', {
            modulos: response.metadata.modules.length,
            hoy: personal_basic_stats.today_hours,
            semana: weekly_progress.hours_this_week,
            progreso: weekly_progress.progress_percentage
        });

        return response;

    } catch (error) {
        console.error('❌ [DASHBOARD-SIMPLE] Error:', error.message);
        throw error;
    }
}

/**
 * 👤 OBTENER STATS BÁSICOS (SOLO HORAS)
 */
async function getPersonalStatsFromRealService(rut_usuario) {
    console.log('👤 [PERSONAL-STATS] Obteniendo estadísticas personales básicas...');
    
    try {
        const now = new Date();
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();
        
        const asistenciaData = await getAsistenciaUsuarioService(rut_usuario, mes, anio);
        const asistencias = asistenciaData.asistencias || [];
        
        // Horas de hoy
        const today = now.toISOString().split('T')[0];
        const todayRecord = asistencias.find(a => a.fecha === today);
        const today_hours = todayRecord ? parseFloat(todayRecord.horasTrabajadas || 0) : 0;
        
        // Horas totales del mes
        const total_hours_month = asistencias.reduce((sum, a) => 
            sum + parseFloat(a.horasTrabajadas || 0), 0);
        
        // Días trabajados
        const days_worked = asistencias.filter(a => 
            parseFloat(a.horasTrabajadas || 0) > 0).length;
        
        // Promedio de horas por día trabajado
        const avg_hours_per_day = days_worked > 0 ? total_hours_month / days_worked : 0;
        
        // Porcentaje de asistencia (días con registro)
        const workDaysInMonth = getWorkDaysInMonth(now);
        const attendance_rate = workDaysInMonth > 0 ? 
            Math.round((days_worked / workDaysInMonth) * 100) : 0;

        return {
            today_hours: Math.round(today_hours * 100) / 100,
            total_hours_month: Math.round(total_hours_month * 100) / 100,
            days_worked_month: days_worked,
            avg_hours_per_day: Math.round(avg_hours_per_day * 100) / 100,
            attendance_rate,
            last_updated: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ [PERSONAL-STATS] Error:', error);
        return {
            today_hours: 0,
            total_hours_month: 0,
            days_worked_month: 0,
            avg_hours_per_day: 0,
            attendance_rate: 0,
            last_updated: new Date().toISOString()
        };
    }
}

/**
 * 📈 PROGRESO SEMANAL HACIA 40 HORAS
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
        
        // Filtrar solo registros de esta semana
        const thisWeekRecords = asistencias.filter(a => {
            const recordDate = new Date(a.fecha);
            return recordDate >= startOfWeek && recordDate <= endOfWeek;
        });
        
        // Calcular horas de esta semana
        const hours_this_week = thisWeekRecords.reduce((sum, a) => 
            sum + parseFloat(a.horasTrabajadas || 0), 0);
        
        // Progreso hacia 40 horas
        const target_weekly_hours = 40;
        const progress_percentage = Math.min(100, Math.round((hours_this_week / target_weekly_hours) * 100));
        const hours_remaining = Math.max(0, target_weekly_hours - hours_this_week);
        
        // Días trabajados esta semana
        const days_worked_this_week = thisWeekRecords.filter(a => 
            parseFloat(a.horasTrabajadas || 0) > 0).length;
        
        // Promedio diario esta semana
        const avg_daily_hours = days_worked_this_week > 0 ? 
            hours_this_week / days_worked_this_week : 0;
        
        // Estimación para completar las 40 horas
        let days_to_complete = 0;
        if (hours_remaining > 0 && avg_daily_hours > 0) {
            days_to_complete = Math.ceil(hours_remaining / avg_daily_hours);
        }

        return {
            hours_this_week: Math.round(hours_this_week * 100) / 100,
            target_weekly_hours,
            progress_percentage,
            hours_remaining: Math.round(hours_remaining * 100) / 100,
            days_worked_this_week,
            avg_daily_hours: Math.round(avg_daily_hours * 100) / 100,
            days_to_complete,
            week_start: startOfWeek.toISOString().split('T')[0],
            week_end: endOfWeek.toISOString().split('T')[0],
            status: progress_percentage >= 100 ? 'completed' : 
                    progress_percentage >= 75 ? 'on_track' : 
                    progress_percentage >= 50 ? 'behind' : 'needs_attention'
        };
        
    } catch (error) {
        console.error('❌ [WEEKLY-PROGRESS] Error:', error);
        return {
            hours_this_week: 0,
            target_weekly_hours: 40,
            progress_percentage: 0,
            hours_remaining: 40,
            days_worked_this_week: 0,
            avg_daily_hours: 0,
            days_to_complete: 0,
            status: 'needs_attention'
        };
    }
}

/**
 * 📊 ANALÍTICAS DE ASISTENCIA SIMPLIFICADAS
 */
async function getAttendanceAnalyticsFromRealService(rut_usuario) {
    console.log('📊 [ATTENDANCE-ANALYTICS] Obteniendo analíticas de asistencia...');
    
    try {
        const now = new Date();
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();
        
        const asistenciaData = await getAsistenciaUsuarioService(rut_usuario, mes, anio);
        const asistencias = asistenciaData.asistencias || [];
        
        // Registros por período
        const today = now.toISOString().split('T')[0];
        const startOfWeek = getStartOfWeek(now);
        
        const today_count = asistencias.filter(a => a.fecha === today).length;
        const this_week = asistencias.filter(a => {
            const recordDate = new Date(a.fecha);
            return recordDate >= startOfWeek;
        }).length;
        const this_month = asistencias.length;
        
        // Tendencias semanales (últimas 4 semanas)
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
                week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
                hours: Math.round(weekHours * 100) / 100,
                days: weekRecords.filter(a => parseFloat(a.horasTrabajadas || 0) > 0).length
            });
        }
        
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
    console.log('🏢 [ORGANIZATION] Obteniendo overview organizacional...');
    
    try {
        const totalUsers = await Usuario.count({
            where: { activo: true }
        });
        
        return {
            total_active_users: totalUsers,
            system_status: 'operational',
            last_updated: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ [ORGANIZATION] Error:', error);
        return {
            total_active_users: 0,
            system_status: 'unknown',
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
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No domingo ni sábado
            workDays++;
        }
    }
    
    return workDays;
}

// ✅ EXPORTAR FUNCIONES
export async function getRealTimeData(rut_usuario) {
    return {
        timestamp: new Date().toISOString(),
        currently_active: Math.floor(Math.random() * 15) + 5,
        recent_marcajes: [
            { user: 'Usuario 1', time: '08:30', type: 'entrada' },
            { user: 'Usuario 2', time: '09:15', type: 'entrada' },
            { user: 'Usuario 3', time: '17:45', type: 'salida' }
        ]
    };
}

export async function getAdvancedAnalytics(rut_usuario) {
    const baseMetrics = await getSimpleMetrics(rut_usuario);
    return baseMetrics;
}

export async function getDebugInfo(rut_usuario) {
    return {
        timestamp: new Date().toISOString(),
        user: rut_usuario,
        message: 'Dashboard simplificado v6.0 - Solo registro de horas',
        source: 'simple_dashboard_service',
        modules_active: 3
    };
}