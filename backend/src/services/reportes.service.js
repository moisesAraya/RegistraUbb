"use strict";

import { Op } from 'sequelize';
import Asistencia from '../entities/asistencia.entity.js';
import Justificacion from '../entities/justificacion.entity.js';
import { getAsistenciaUsuarioService } from './asistencia.service.js';

/**
 * 📊 SERVICIO DE REPORTES PERSONALES
 */

// ✅ OBTENER REPORTE MENSUAL DETALLADO
export async function getReportePersonalMensual(rut_usuario, mes, anio) {
    console.log('📊 [REPORTES] Generando reporte mensual:', { rut_usuario, mes, anio });

    try {
        // Validación fuerte
        if (!rut_usuario) throw new Error("RUT requerido");
        mes = Number(mes);
        anio = Number(anio);
        if (!mes || !anio || mes < 1 || mes > 12) throw new Error("Mes o año inválido");

        // Rango de fechas del mes
        const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
        // Último día del mes
        const lastDay = new Date(anio, mes, 0).getDate();
        const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // Obtener datos de asistencia base
        const asistenciaData = await getAsistenciaUsuarioService(rut_usuario, mes, anio);

        // Obtener las justificaciones del usuario en el rango de fechas
        const justificaciones = await Justificacion.findAll({
            where: {
                rut_usuario,
                fecha_justificacion: {
                    [Op.between]: [fechaInicio, fechaFin]
                }
            },
            order: [['fecha_justificacion', 'DESC']]
        });

        // Calcular métricas avanzadas
        const asistencias = asistenciaData.asistencias || [];
        const metricas = calcularMetricasAvanzadas(asistencias, justificaciones);

        return {
            periodo: {
                mes,
                anio,
                nombre_mes: new Date(anio, mes - 1).toLocaleDateString('es-CL', { month: 'long' })
            },
            resumen_basico: asistenciaData.resumen,
            asistencias_detalle: asistencias,
            justificaciones,
            metricas_avanzadas: metricas,
            graficos_data: generarDatosGraficos(asistencias),
            tendencias: calcularTendencias(asistencias),
            generated_at: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ [REPORTES] Error:', error);
        throw error;
    }
}

// ✅ OBTENER REPORTE COMPARATIVO (ÚLTIMOS 6 MESES)
export async function getReporteComparativo(rut_usuario) {
    console.log('📊 [REPORTES] Generando reporte comparativo:', rut_usuario);
    
    try {
        const reportesMensuales = [];
        const fechaActual = new Date();
        
        // Obtener últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
            const mes = fecha.getMonth() + 1;
            const anio = fecha.getFullYear();
            
            try {
                const reporte = await getReportePersonalMensual(rut_usuario, mes, anio);
                reportesMensuales.push({
                    mes,
                    anio,
                    nombre_mes: fecha.toLocaleDateString('es-CL', { month: 'short' }),
                    horas_totales: reporte.resumen_basico?.horasTotales || 0,
                    dias_trabajados: reporte.resumen_basico?.diasTrabajados || 0,
                    ausentismos: reporte.resumen_basico?.ausentismos || 0,
                    justificaciones: reporte.justificaciones?.length || 0,
                    porcentaje_asistencia: calcularPorcentajeAsistencia(reporte.resumen_basico)
                });
            } catch (error) {
                console.log(`⚠️ No hay datos para ${mes}/${anio}`);
                reportesMensuales.push({
                    mes, anio,
                    nombre_mes: fecha.toLocaleDateString('es-CL', { month: 'short' }),
                    horas_totales: 0, dias_trabajados: 0, ausentismos: 0, justificaciones: 0, porcentaje_asistencia: 0
                });
            }
        }

        return {
            periodo_analizado: '6 meses',
            reportes_mensuales: reportesMensuales,
            tendencias_generales: calcularTendenciasGenerales(reportesMensuales),
            promedios: calcularPromedios(reportesMensuales),
            generated_at: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ [REPORTES] Error comparativo:', error);
        throw error;
    }
}

export async function getEstadisticasAnuales(rut_usuario, anio) {
    console.log('📊 [REPORTES] Generando estadísticas anuales:', { rut_usuario, anio });
    
    try {
        const reportesMensuales = [];
        
        for (let mes = 1; mes <= 12; mes++) {
            try {
                const reporte = await getReportePersonalMensual(rut_usuario, mes, anio);
                reportesMensuales.push(reporte);
            } catch (error) {
                console.log(`⚠️ No hay datos para ${mes}/${anio}`);
                reportesMensuales.push(null);
            }
        }

        const estadisticas = calcularEstadisticasAnuales(reportesMensuales);

        return {
            anio,
            estadisticas_generales: estadisticas,
            reportes_por_mes: reportesMensuales,
            mejores_meses: estadisticas.mejores_meses,
            areas_mejora: estadisticas.areas_mejora,
            generated_at: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ [REPORTES] Error anual:', error);
        throw error;
    }
}

// ✅ FUNCIONES AUXILIARES

function calcularMetricasAvanzadas(asistencias, justificaciones) {
    const totalAsistencias = asistencias.length;
    const horasTotales = asistencias.reduce((sum, a) => sum + parseFloat(a.horasTrabajadas || 0), 0);
    const promedioHorasDia = totalAsistencias > 0 ? horasTotales / totalAsistencias : 0;
    
    // Análisis de puntualidad
    const llegadasTempranas = asistencias.filter(a => {
        if (!a.horaIngreso) return false;
        const hora = parseInt(a.horaIngreso.split(':')[0]);
        return hora <= 8;
    }).length;
    
    const llegadasTardes = asistencias.filter(a => a.estado === 'tarde').length;
    
    // Análisis de consistencia
    const diasCompletos = asistencias.filter(a => parseFloat(a.horasTrabajadas || 0) >= 8).length;
    const diasIncompletos = asistencias.filter(a => parseFloat(a.horasTrabajadas || 0) < 7 && parseFloat(a.horasTrabajadas || 0) > 0).length;

    return {
        promedio_horas_dia: Math.round(promedioHorasDia * 100) / 100,
        puntualidad: {
            llegadas_tempranas: llegadasTempranas,
            llegadas_tarde: llegadasTardes,
            puntualidad_score: totalAsistencias > 0 ? Math.round(((llegadasTempranas / totalAsistencias) * 100)) : 0
        },
        consistencia: {
            dias_completos: diasCompletos,
            dias_incompletos: diasIncompletos,
            consistencia_score: totalAsistencias > 0 ? Math.round(((diasCompletos / totalAsistencias) * 100)) : 0
        },
        justificaciones: {
            total: justificaciones.length,
            aprobadas: justificaciones.filter(j => j.estado_aprobacion === 'aprobada').length,
            pendientes: justificaciones.filter(j => j.estado_aprobacion === 'pendiente').length,
            rechazadas: justificaciones.filter(j => j.estado_aprobacion === 'rechazada').length
        }
    };
}

function generarDatosGraficos(asistencias) {
    // Gráfico de horas por día
    const horasPorDia = asistencias.map(a => ({
        fecha: a.fecha,
        horas: parseFloat(a.horasTrabajadas || 0),
        dia_semana: new Date(a.fecha).toLocaleDateString('es-CL', { weekday: 'short' })
    }));

    // Gráfico por día de la semana
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horasPorDiaSemana = diasSemana.map(dia => {
        const horasDelDia = asistencias
            .filter(a => {
                const fechaAsistencia = new Date(a.fecha);
                const diaSemana = fechaAsistencia.toLocaleDateString('es-CL', { weekday: 'long' });
                return diaSemana.toLowerCase().includes(dia.toLowerCase().substring(0, 3));
            })
            .reduce((sum, a) => sum + parseFloat(a.horasTrabajadas || 0), 0);
        
        return { dia, horas: Math.round(horasDelDia * 100) / 100 };
    });

    return {
        horas_por_fecha: horasPorDia,
        horas_por_dia_semana: horasPorDiaSemana.filter(d => d.horas > 0)
    };
}

function calcularTendencias(asistencias) {
    if (asistencias.length < 5) return { tendencia: 'insuficientes_datos' };
    
    const primeraMitad = asistencias.slice(0, Math.floor(asistencias.length / 2));
    const segundaMitad = asistencias.slice(Math.floor(asistencias.length / 2));
    
    const promedioInicial = primeraMitad.reduce((sum, a) => sum + parseFloat(a.horasTrabajadas || 0), 0) / primeraMitad.length;
    const promedioFinal = segundaMitad.reduce((sum, a) => sum + parseFloat(a.horasTrabajadas || 0), 0) / segundaMitad.length;
    
    const diferencia = promedioFinal - promedioInicial;
    const porcentajeCambio = promedioInicial > 0 ? (diferencia / promedioInicial) * 100 : 0;
    
    return {
        tendencia: diferencia > 0.5 ? 'mejorando' : diferencia < -0.5 ? 'empeorando' : 'estable',
        promedio_inicial: Math.round(promedioInicial * 100) / 100,
        promedio_final: Math.round(promedioFinal * 100) / 100,
        cambio_porcentual: Math.round(porcentajeCambio * 100) / 100
    };
}

function calcularPorcentajeAsistencia(resumen) {
    if (!resumen || !resumen.diasTrabajados) return 0;
    const diasLaborales = 22; // Aproximado mensual
    return Math.round((resumen.diasTrabajados / diasLaborales) * 100);
}

function calcularTendenciasGenerales(reportes) {
    const horasMensuales = reportes.map(r => r.horas_totales);
    const diasMensuales = reportes.map(r => r.dias_trabajados);
    
    return {
        horas: calcularTendenciaArray(horasMensuales),
        dias: calcularTendenciaArray(diasMensuales),
        asistencia: calcularTendenciaArray(reportes.map(r => r.porcentaje_asistencia))
    };
}

function calcularTendenciaArray(valores) {
    if (valores.length < 2) return 'insuficientes_datos';
    
    const primerValor = valores[0];
    const ultimoValor = valores[valores.length - 1];
    const diferencia = ultimoValor - primerValor;
    
    if (diferencia > 5) return 'mejorando';
    if (diferencia < -5) return 'empeorando';
    return 'estable';
}

function calcularPromedios(reportes) {
    const validos = reportes.filter(r => r.horas_totales > 0);
    if (validos.length === 0) return { horas: 0, dias: 0, asistencia: 0 };
    
    return {
        horas: Math.round((validos.reduce((sum, r) => sum + r.horas_totales, 0) / validos.length) * 100) / 100,
        dias: Math.round(validos.reduce((sum, r) => sum + r.dias_trabajados, 0) / validos.length),
        asistencia: Math.round(validos.reduce((sum, r) => sum + r.porcentaje_asistencia, 0) / validos.length)
    };
}

function calcularEstadisticasAnuales(reportesMensuales) {
    const reportesValidos = reportesMensuales.filter(r => r !== null);
    
    if (reportesValidos.length === 0) {
        return {
            total_horas: 0,
            total_dias: 0,
            promedio_mensual_horas: 0,
            promedio_mensual_dias: 0,
            mejor_mes: null,
            peor_mes: null,
            mejores_meses: [],
            areas_mejora: []
        };
    }
    
    const totalHoras = reportesValidos.reduce((sum, r) => sum + (r.resumen_basico?.horasTotales || 0), 0);
    const totalDias = reportesValidos.reduce((sum, r) => sum + (r.resumen_basico?.diasTrabajados || 0), 0);
    
    const mejorMes = reportesValidos.reduce((mejor, actual) => 
        (actual.resumen_basico?.horasTotales || 0) > (mejor.resumen_basico?.horasTotales || 0) ? actual : mejor
    );
    
    const peorMes = reportesValidos.reduce((peor, actual) => 
        (actual.resumen_basico?.horasTotales || 0) < (peor.resumen_basico?.horasTotales || 0) ? actual : peor
    );

    return {
        total_horas: Math.round(totalHoras * 100) / 100,
        total_dias: totalDias,
        promedio_mensual_horas: Math.round((totalHoras / reportesValidos.length) * 100) / 100,
        promedio_mensual_dias: Math.round(totalDias / reportesValidos.length),
        mejor_mes: {
            mes: mejorMes.periodo.nombre_mes,
            horas: mejorMes.resumen_basico?.horasTotales || 0
        },
        peor_mes: {
            mes: peorMes.periodo.nombre_mes,
            horas: peorMes.resumen_basico?.horasTotales || 0
        },
        mejores_meses: reportesValidos
            .sort((a, b) => (b.resumen_basico?.horasTotales || 0) - (a.resumen_basico?.horasTotales || 0))
            .slice(0, 3)
            .map(r => ({
                mes: r.periodo.nombre_mes,
                horas: r.resumen_basico?.horasTotales || 0
            })),
        areas_mejora: generarAreasdemejora(reportesValidos)
    };
}

function generarAreasdemejora(reportes) {
    const areas = [];
    
    const promedioHoras = reportes.reduce((sum, r) => sum + (r.resumen_basico?.horasTotales || 0), 0) / reportes.length;
    const promedioDias = reportes.reduce((sum, r) => sum + (r.resumen_basico?.diasTrabajados || 0), 0) / reportes.length;
    
    if (promedioHoras < 140) areas.push('Aumentar horas mensuales de trabajo');
    if (promedioDias < 18) areas.push('Mejorar consistencia de asistencia');
    
    const mesesBajos = reportes.filter(r => (r.resumen_basico?.horasTotales || 0) < promedioHoras * 0.8);
    if (mesesBajos.length > reportes.length * 0.3) {
        areas.push('Reducir variabilidad entre meses');
    }
    
    return areas;
}

console.log('📊 [REPORTES-SERVICE] ✅ Servicio de reportes personales cargado');