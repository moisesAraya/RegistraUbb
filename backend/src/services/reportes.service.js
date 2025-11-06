"use strict";

import { Op } from 'sequelize';
import Marcaje from '../entities/marcaje.entity.js';
import RegistroMarcaje from '../entities/registro_marcaje.entity.js';
import Justificacion from '../entities/justificacion.entity.js';

/**
 * 📊 SERVICIO DE REPORTES PERSONALES
 */

// ✅ OBTENER REPORTE MENSUAL DETALLADO O POR RANGO DE FECHAS
export async function getReportePersonalMensual(rut_usuario, mes, anio, fecha_inicio = null, fecha_fin = null) {
    console.log('📊 [REPORTES] Generando reporte:', { rut_usuario, mes, anio, fecha_inicio, fecha_fin });

    try {
        // Validación fuerte
        if (!rut_usuario) throw new Error("RUT requerido");

        let fechaInicioReal, fechaFinReal, periodoNombre;

        // Determinar rango de fechas
        if (fecha_inicio && fecha_fin) {
            // Usar rango personalizado
            fechaInicioReal = fecha_inicio;
            fechaFinReal = fecha_fin;
            periodoNombre = `${fecha_inicio} a ${fecha_fin}`;
        } else {
            // Usar mes y año
            mes = Number(mes);
            anio = Number(anio);
            if (!mes || !anio || mes < 1 || mes > 12) throw new Error("Mes o año inválido");

            fechaInicioReal = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const lastDay = new Date(anio, mes, 0).getDate();
            fechaFinReal = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            periodoNombre = new Date(anio, mes - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
        }

        // Obtener registros de marcaje del usuario
        const registrosMarcaje = await RegistroMarcaje.findAll({
            where: { rut_usuario }
        });

        if (registrosMarcaje.length === 0) {
            console.log('⚠️ [REPORTES] No hay registros de marcaje para:', rut_usuario);
            return generarReporteVacio(mes, anio, fechaInicioReal, fechaFinReal, periodoNombre);
        }

        // Obtener marcajes en el rango de fechas
        const marcajeIds = registrosMarcaje.map(r => r.id_marcaje);
        const marcajes = await Marcaje.findAll({
            where: {
                id_marcaje: { [Op.in]: marcajeIds },
                fecha: {
                    [Op.between]: [fechaInicioReal, fechaFinReal]
                }
            },
            order: [['fecha', 'ASC'], ['hora_ingreso', 'ASC']]
        });

        console.log(`📊 [REPORTES] Marcajes encontrados: ${marcajes.length}`);

        // Obtener justificaciones
        const justificaciones = await Justificacion.findAll({
            where: {
                rut_usuario,
                fecha_justificacion: {
                    [Op.between]: [fechaInicioReal, fechaFinReal]
                }
            },
            order: [['fecha_justificacion', 'DESC']]
        });

        // Agrupar marcajes por fecha y organizarlos en pares
        const marcajesPorFecha = agruparMarcajesPorFecha(marcajes);
        
        // Generar detalle de asistencias con estructura de mañana/tarde
        const asistencias_detalle = procesarAsistenciasDetalle(marcajesPorFecha);

        // Calcular resumen
        const resumen = calcularResumenAsistencias(asistencias_detalle);

        // Calcular métricas avanzadas
        const metricas = calcularMetricasAvanzadas(asistencias_detalle, justificaciones);

        return {
            periodo: {
                mes: mes || null,
                anio: anio || null,
                fecha_inicio: fechaInicioReal,
                fecha_fin: fechaFinReal,
                nombre_periodo: periodoNombre
            },
            resumen_basico: resumen,
            asistencias_detalle,
            dias_detallados: marcajesPorFecha, // Para reportes detallados
            justificaciones,
            metricas_avanzadas: metricas,
            graficos_data: generarDatosGraficos(asistencias_detalle),
            tendencias: calcularTendencias(asistencias_detalle),
            generated_at: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ [REPORTES] Error:', error);
        throw error;
    }
}

// ✅ FUNCIÓN AUXILIAR: Generar reporte vacío
function generarReporteVacio(mes, anio, fechaInicio, fechaFin, periodo) {
    return {
        periodo: {
            mes: mes || null,
            anio: anio || null,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            nombre_periodo: periodo
        },
        resumen_basico: {
            horasTotales: 0,
            diasTrabajados: 0,
            ausentismos: 0,
            promedioHorasDia: 0
        },
        asistencias_detalle: [],
        dias_detallados: {},
        justificaciones: [],
        metricas_avanzadas: {
            promedio_horas_dia: 0,
            puntualidad: { llegadas_tempranas: 0, llegadas_tarde: 0, puntualidad_score: 0 },
            consistencia: { dias_completos: 0, dias_incompletos: 0, consistencia_score: 0 },
            justificaciones: { total: 0, aprobadas: 0, pendientes: 0, rechazadas: 0 }
        },
        graficos_data: { horas_por_fecha: [], horas_por_dia_semana: [] },
        tendencias: { tendencia: 'insuficientes_datos' },
        generated_at: new Date().toISOString()
    };
}

// ✅ FUNCIÓN AUXILIAR: Agrupar marcajes por fecha
function agruparMarcajesPorFecha(marcajes) {
    const marcajesPorFecha = {};
    
    marcajes.forEach(marcaje => {
        const fecha = marcaje.fecha;
        
        if (!marcajesPorFecha[fecha]) {
            marcajesPorFecha[fecha] = [];
        }
        
        marcajesPorFecha[fecha].push({
            id_marcaje: marcaje.id_marcaje,
            hora_entrada: marcaje.hora_ingreso,
            hora_salida: marcaje.hora_salida,
            observacion: marcaje.observacion
        });
    });
    
    return marcajesPorFecha;
}

// ✅ FUNCIÓN AUXILIAR: Procesar asistencias con detalle mañana/tarde
function procesarAsistenciasDetalle(marcajesPorFecha) {
    const asistencias = [];
    
    Object.entries(marcajesPorFecha).forEach(([fecha, marcajes]) => {
        // Ordenar marcajes por hora de entrada
        marcajes.sort((a, b) => {
            const horaA = a.hora_entrada || '00:00:00';
            const horaB = b.hora_entrada || '00:00:00';
            return horaA.localeCompare(horaB);
        });

        // Identificar marcajes de mañana y tarde
        const manana = { entrada: null, salida: null };
        const tarde = { entrada: null, salida: null };
        
        // Lógica: 
        // - Primeros 2 marcajes (o primer marcaje completo) = mañana
        // - Siguientes marcajes = tarde
        // - Si solo hay 1 marcaje con salida muy tarde, va todo a mañana con salida en tarde
        
        if (marcajes.length >= 1) {
            const primerMarcaje = marcajes[0];
            manana.entrada = primerMarcaje.hora_entrada;
            
            // Si la salida del primer marcaje es después de las 14:00, considerar que no hubo colación
            if (primerMarcaje.hora_salida) {
                const horaSalida = primerMarcaje.hora_salida.split(':')[0];
                
                if (parseInt(horaSalida) >= 14) {
                    // Salida tardía, probablemente no hubo colación
                    tarde.salida = primerMarcaje.hora_salida;
                } else {
                    manana.salida = primerMarcaje.hora_salida;
                }
            }
        }
        
        if (marcajes.length >= 2) {
            const segundoMarcaje = marcajes[1];
            
            // Si el primer marcaje no tiene salida o la salida fue antes de las 14:00
            if (!tarde.salida) {
                tarde.entrada = segundoMarcaje.hora_entrada;
                tarde.salida = segundoMarcaje.hora_salida;
            }
        }
        
        // Si hay más marcajes, asumimos que son correcciones o marcajes adicionales
        if (marcajes.length >= 3 && !tarde.entrada) {
            tarde.entrada = marcajes[1].hora_entrada;
            tarde.salida = marcajes[1].hora_salida || marcajes[2]?.hora_salida;
        }

        // Calcular horas trabajadas
        const horasMañana = calcularHorasEntreMarcajes(manana.entrada, manana.salida);
        const horasTarde = calcularHorasEntreMarcajes(tarde.entrada, tarde.salida);
        const horasTotalesDia = horasMañana + horasTarde;

        // Determinar estado del día
        let estado = 'presente';
        if (horasTotalesDia === 0) {
            estado = 'ausente';
        } else if (manana.entrada && parseInt(manana.entrada.split(':')[0]) > 9) {
            estado = 'tarde';
        }

        asistencias.push({
            fecha,
            fecha_formateada: new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
                weekday: 'long',
                day: '2-digit',
                month: 'short'
            }),
            dia_semana: new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long' }),
            manana: {
                entrada: manana.entrada || 'X',
                salida: manana.salida || 'X',
                horas: Math.round(horasMañana * 100) / 100
            },
            tarde: {
                entrada: tarde.entrada || 'X',
                salida: tarde.salida || 'X',
                horas: Math.round(horasTarde * 100) / 100
            },
            horas_totales: Math.round(horasTotalesDia * 100) / 100,
            estado,
            marcajes_raw: marcajes // Para debugging
        });
    });
    
    return asistencias;
}

// ✅ FUNCIÓN AUXILIAR: Calcular horas entre dos marcajes
function calcularHorasEntreMarcajes(entrada, salida) {
    if (!entrada || !salida || entrada === 'X' || salida === 'X') {
        return 0;
    }
    
    try {
        const [horaEnt, minEnt, segEnt = 0] = entrada.split(':').map(Number);
        const [horaSal, minSal, segSal = 0] = salida.split(':').map(Number);
        
        const minutosEntrada = horaEnt * 60 + minEnt + segEnt / 60;
        let minutosSalida = horaSal * 60 + minSal + segSal / 60;
        
        // Si la salida es menor que la entrada, asumimos que cruzó medianoche
        if (minutosSalida < minutosEntrada) {
            minutosSalida += 24 * 60;
        }
        
        const horas = (minutosSalida - minutosEntrada) / 60;
        return Math.max(0, Math.min(14, horas)); // Limitar a 14 horas máximo
    } catch (error) {
        console.error('Error calculando horas:', error);
        return 0;
    }
}

// ✅ FUNCIÓN AUXILIAR: Calcular resumen de asistencias
function calcularResumenAsistencias(asistencias) {
    const horasTotales = asistencias.reduce((sum, a) => sum + (a.horas_totales || 0), 0);
    const diasTrabajados = asistencias.filter(a => a.horas_totales > 0).length;
    const ausentismos = asistencias.filter(a => a.estado === 'ausente').length;
    
    return {
        horasTotales: Math.round(horasTotales * 100) / 100,
        diasTrabajados,
        ausentismos,
        promedioHorasDia: diasTrabajados > 0 ? Math.round((horasTotales / diasTrabajados) * 100) / 100 : 0
    };
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
    const horasTotales = asistencias.reduce((sum, a) => sum + parseFloat(a.horasTrabajadas || a.horas_trabajadas || 0), 0);
    const promedioHorasDia = totalAsistencias > 0 ? horasTotales / totalAsistencias : 0;
    
    // Análisis de puntualidad
    const llegadasTempranas = asistencias.filter(a => {
        const horaIngreso = a.horaIngreso || a.hora_ingreso;
        if (!horaIngreso) return false;
        const hora = parseInt(horaIngreso.split(':')[0]);
        return hora <= 8;
    }).length;
    
    const llegadasTardes = asistencias.filter(a => a.estado === 'tarde').length;
    
    // Análisis de consistencia
    const diasCompletos = asistencias.filter(a => parseFloat(a.horasTrabajadas || a.horas_trabajadas || 0) >= 8).length;
    const diasIncompletos = asistencias.filter(a => {
        const horas = parseFloat(a.horasTrabajadas || a.horas_trabajadas || 0);
        return horas < 7 && horas > 0;
    }).length;

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
        horas: parseFloat(a.horasTrabajadas || a.horas_trabajadas || 0),
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
            .reduce((sum, a) => sum + parseFloat(a.horasTrabajadas || a.horas_trabajadas || 0), 0);
        
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
    
    const promedioInicial = primeraMitad.reduce((sum, a) => 
        sum + parseFloat(a.horasTrabajadas || a.horas_trabajadas || 0), 0) / primeraMitad.length;
    const promedioFinal = segundaMitad.reduce((sum, a) => 
        sum + parseFloat(a.horasTrabajadas || a.horas_trabajadas || 0), 0) / segundaMitad.length;
    
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