"use strict";

import { Op } from 'sequelize';
import Usuario from '../entities/usuario.entity.js';
import Marcaje from '../entities/marcaje.entity.js';
import RegistroMarcaje from '../entities/registro_marcaje.entity.js';

console.log('🎯 [ASISTENCIA-SERVICE] ✅ SERVICE CARGADO ✅');

/**
 * 📅 SERVICIO - OBTENER ASISTENCIA DEL USUARIO (CORREGIDO)
 */
export async function getAsistenciaUsuarioService(rutUsuario, mes = null, anio = null) {
    try {
        console.log('📅 [ASISTENCIA-SERVICE] === OBTENIENDO ASISTENCIA ===');
        console.log('📅 [ASISTENCIA-SERVICE] Usuario:', rutUsuario);
        console.log('📅 [ASISTENCIA-SERVICE] Filtros:', { mes, anio });

        // Calcular rango de fechas
        const now = new Date();
        const targetAnio = anio ? parseInt(anio) : now.getFullYear();
        const targetMes = mes ? parseInt(mes) : now.getMonth() + 1;
        
        const startDate = new Date(targetAnio, targetMes - 1, 1);
        const endDate = new Date(targetAnio, targetMes, 0);
        
        console.log('📅 [ASISTENCIA-SERVICE] Rango:', startDate.toISOString().split('T')[0], 'a', endDate.toISOString().split('T')[0]);

        // Buscar registros de marcaje del usuario
        const registrosMarcaje = await RegistroMarcaje.findAll({
            where: { rut_usuario: rutUsuario },
            include: [{
                model: Marcaje,
                as: 'marcaje',
                where: {
                    fecha: {
                        [Op.between]: [
                            startDate.toISOString().split('T')[0],
                            endDate.toISOString().split('T')[0]
                        ]
                    }
                },
                required: true
            }],
            order: [[{ model: Marcaje, as: 'marcaje' }, 'fecha', 'DESC']]
        });

        if (registrosMarcaje.length === 0) {
            console.log('⚠️ [ASISTENCIA-SERVICE] No hay registros de marcaje');
            
            return {
                asistencias: [],
                resumen: {
                    diasTrabajados: 0,
                    horasTotales: 0,
                    horasPromedio: 0,
                    faltas: 0
                },
                periodo: {
                    mes: targetMes,
                    anio: targetAnio,
                    fechaInicio: startDate.toISOString().split('T')[0],
                    fechaFin: endDate.toISOString().split('T')[0]
                }
            };
        }

        // ✅ AGRUPAR MARCAJES POR FECHA (múltiples registros del mismo día)
        const marcajesPorDia = {};
        
        registrosMarcaje.forEach(registro => {
            const marcaje = registro.marcaje;
            const fecha = marcaje.fecha;
            
            if (!marcajesPorDia[fecha]) {
                marcajesPorDia[fecha] = {
                    fecha: fecha,
                    registros: [],
                    observaciones: []
                };
            }
            
            // Agregar hora de ingreso si existe
            if (marcaje.hora_ingreso) {
                marcajesPorDia[fecha].registros.push({
                    tipo: 'ingreso',
                    hora: marcaje.hora_ingreso
                });
            }
            
            // Agregar hora de salida si existe
            if (marcaje.hora_salida) {
                marcajesPorDia[fecha].registros.push({
                    tipo: 'salida',
                    hora: marcaje.hora_salida
                });
            }
            
            if (marcaje.observacion) {
                marcajesPorDia[fecha].observaciones.push(marcaje.observacion);
            }
        });

        console.log('📅 [ASISTENCIA-SERVICE] Días con marcajes:', Object.keys(marcajesPorDia).length);

        // ✅ PROCESAR CADA DÍA Y CALCULAR HORAS TRABAJADAS
        const asistencias = Object.values(marcajesPorDia).map(dia => {
            // Ordenar registros por hora
            dia.registros.sort((a, b) => {
                const horaAStr = formatTimeToString(a.hora) || '00:00:00';
                const horaBStr = formatTimeToString(b.hora) || '00:00:00';
                const horaA = horaAStr.split(':').map(Number);
                const horaB = horaBStr.split(':').map(Number);
                return (horaA[0] * 60 + horaA[1]) - (horaB[0] * 60 + horaB[1]);
            });

            // Separar entradas y salidas
            const entradas = dia.registros.filter(r => r.tipo === 'ingreso');
            const salidas = dia.registros.filter(r => r.tipo === 'salida');

            // Primera entrada del día
            const primeraEntrada = entradas.length > 0 ? entradas[0].hora : null;
            
            // Última salida del día
            const ultimaSalida = salidas.length > 0 ? salidas[salidas.length - 1].hora : null;

            // ✅ CALCULAR HORAS TRABAJADAS CORRECTAMENTE
            let horasTrabajadas = 0;

            if (entradas.length > 0 && salidas.length > 0) {
                // Emparejar entradas con salidas
                const pares = Math.min(entradas.length, salidas.length);
                
                for (let i = 0; i < pares; i++) {
                    const entrada = entradas[i].hora;
                    const salida = salidas[i].hora;
                    
                    const [hE, mE] = entrada.split(':').map(Number);
                    const [hS, mS] = salida.split(':').map(Number);
                    
                    const minutosEntrada = hE * 60 + mE;
                    const minutosSalida = hS * 60 + mS;
                    
                    // Calcular diferencia en minutos
                    let diff = minutosSalida - minutosEntrada;
                    
                    // Si la salida es antes que la entrada, asumimos que cruzó medianoche
                    if (diff < 0) {
                        diff += 24 * 60;
                    }
                    
                    horasTrabajadas += diff / 60;
                }
            } else if (entradas.length > 0 && !ultimaSalida) {
                // Solo entrada, sin salida - considerar 0 horas
                horasTrabajadas = 0;
            }

            // Limitar horas trabajadas a un rango razonable (0-14 horas)
            horasTrabajadas = Math.max(0, Math.min(14, horasTrabajadas));

            // Determinar estado
            let estado = 'presente';
            if (entradas.length === 0) {
                estado = 'falta';
            }

            return {
                fecha: dia.fecha,
                horaIngreso: primeraEntrada,
                horaSalida: ultimaSalida,
                horasTrabajadas: Math.round(horasTrabajadas * 100) / 100,
                estado: estado,
                observacion: dia.observaciones.length > 0 ? dia.observaciones.join(' | ') : null,
                tipoMarcaje: 'qr',
                ubicacion: 'Campus',
                detalleRegistros: {
                    totalEntradas: entradas.length,
                    totalSalidas: salidas.length,
                    registros: dia.registros
                }
            };
        });

        // Ordenar por fecha descendente
        asistencias.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // ✅ CALCULAR RESUMEN CORRECTO
        const diasTrabajados = asistencias.filter(a => a.estado === 'presente' && a.horasTrabajadas > 0).length;
        const horasTotales = asistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0);
        const horasPromedio = diasTrabajados > 0 ? horasTotales / diasTrabajados : 0;
        const faltas = asistencias.filter(a => a.estado === 'falta').length;

        const resumen = {
            diasTrabajados,
            horasTotales: Math.round(horasTotales * 100) / 100,
            horasPromedio: Math.round(horasPromedio * 100) / 100,
            faltas
        };

        console.log('✅ [ASISTENCIA-SERVICE] Resumen:', resumen);

        return {
            asistencias,
            resumen,
            periodo: {
                mes: targetMes,
                anio: targetAnio,
                fechaInicio: startDate.toISOString().split('T')[0],
                fechaFin: endDate.toISOString().split('T')[0]
            }
        };

    } catch (error) {
        console.error('❌ [ASISTENCIA-SERVICE] Error:', error);
        throw new Error(`Error obteniendo asistencia: ${error.message}`);
    }
}
/**
 * 📊 SERVICIO - OBTENER ESTADÍSTICAS DE ASISTENCIA (CORREGIDO)
 */
export async function getEstadisticasAsistenciaService(rutUsuario, mes = null, anio = null) {
    try {
        console.log('📊 [ESTADISTICAS-SERVICE] === OBTENIENDO ESTADÍSTICAS ===');
        console.log('📊 [ESTADISTICAS-SERVICE] Usuario:', rutUsuario);

        // Buscar usuario para obtener horas objetivo
        const usuario = await Usuario.findOne({
            where: { rut_usuario: rutUsuario }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // ✅ HORAS OBJETIVO: 44 horas semanales
        const horasObjetivoSemanal = 44;
        const horasObjetivoDiario = 8; // Promedio esperado por día

        // Calcular rango de fechas (mes actual o especificado)
        const now = new Date();
        const targetAnio = anio ? parseInt(anio) : now.getFullYear();
        const targetMes = mes ? parseInt(mes) : now.getMonth() + 1;
        
        const startDate = new Date(targetAnio, targetMes - 1, 1);
        const endDate = new Date(targetAnio, targetMes, 0);

        // Buscar registros del mes
        const registrosMarcaje = await RegistroMarcaje.findAll({
            where: { rut_usuario: rutUsuario },
            include: [{
                model: Marcaje,
                as: 'marcaje',
                where: {
                    fecha: {
                        [Op.between]: [
                            startDate.toISOString().split('T')[0],
                            endDate.toISOString().split('T')[0]
                        ]
                    }
                },
                required: true
            }]
        });

        if (registrosMarcaje.length === 0) {
            return {
                horasObjetivo: horasObjetivoDiario,
                horasReales: 0,
                porcentajeCumplimiento: 0,
                tendenciaSemanal: [],
                diasMasProductivos: [],
                promedioHoraIngreso: '00:00'
            };
        }

        // ✅ AGRUPAR POR DÍA (igual que en getAsistenciaUsuarioService)
        const marcajesPorDia = {};
        
        registrosMarcaje.forEach(registro => {
            const marcaje = registro.marcaje;
            const fecha = marcaje.fecha;
            
            if (!marcajesPorDia[fecha]) {
                marcajesPorDia[fecha] = {
                    fecha: fecha,
                    registros: [],
                    observaciones: []
                };
            }
            
            if (marcaje.hora_ingreso) {
                marcajesPorDia[fecha].registros.push({
                    tipo: 'ingreso',
                    hora: marcaje.hora_ingreso
                });
            }
            
            if (marcaje.hora_salida) {
                marcajesPorDia[fecha].registros.push({
                    tipo: 'salida',
                    hora: marcaje.hora_salida
                });
            }
        });

        // ✅ CALCULAR HORAS POR DÍA
        const diasConHoras = Object.values(marcajesPorDia).map(dia => {
            dia.registros.sort((a, b) => {
                const horaAStr = formatTimeToString(a.hora) || '00:00:00';
                const horaBStr = formatTimeToString(b.hora) || '00:00:00';
                const horaA = horaAStr.split(':').map(Number);
                const horaB = horaBStr.split(':').map(Number);
                return (horaA[0] * 60 + horaA[1]) - (horaB[0] * 60 + horaB[1]);
            });

            const entradas = dia.registros.filter(r => r.tipo === 'ingreso');
            const salidas = dia.registros.filter(r => r.tipo === 'salida');

            let horasTrabajadas = 0;

            if (entradas.length > 0 && salidas.length > 0) {
                const pares = Math.min(entradas.length, salidas.length);
                
                for (let i = 0; i < pares; i++) {
                    const entrada = entradas[i].hora;
                    const salida = salidas[i].hora;
                    
                    const [hE, mE] = entrada.split(':').map(Number);
                    const [hS, mS] = salida.split(':').map(Number);
                    
                    const minutosEntrada = hE * 60 + mE;
                    const minutosSalida = hS * 60 + mS;
                    
                    let diff = minutosSalida - minutosEntrada;
                    if (diff < 0) diff += 24 * 60;
                    
                    horasTrabajadas += diff / 60;
                }
            }

            horasTrabajadas = Math.max(0, Math.min(14, horasTrabajadas));

            return {
                fecha: dia.fecha,
                horas: Math.round(horasTrabajadas * 100) / 100,
                horaIngreso: entradas.length > 0 ? entradas[0].hora : null
            };
        });

        // ✅ CALCULAR HORAS TOTALES DEL MES
        const horasReales = diasConHoras.reduce((sum, d) => sum + d.horas, 0);

        // ✅ CALCULAR SEMANAS DEL MES PARA OBJETIVO
        const diasDelMes = endDate.getDate();
        const diasLaborables = Math.floor(diasDelMes / 7) * 5; // Aproximación de días laborables
        const semanasCompletas = Math.floor(diasDelMes / 7);
        const horasObjetivoMes = semanasCompletas * horasObjetivoSemanal;

        // ✅ PORCENTAJE DE CUMPLIMIENTO CORRECTO
        const porcentajeCumplimiento = horasObjetivoMes > 0 ? 
            (horasReales / horasObjetivoMes) * 100 : 0;

        // ✅ TENDENCIA SEMANAL (últimas 4 semanas)
        const tendenciaSemanal = [];
        const fechaActual = new Date();
        
        for (let i = 3; i >= 0; i--) {
            const inicioSemana = new Date(fechaActual);
            inicioSemana.setDate(inicioSemana.getDate() - (i * 7 + 7));
            
            const finSemana = new Date(fechaActual);
            finSemana.setDate(finSemana.getDate() - (i * 7));

            const diasSemana = diasConHoras.filter(d => {
                const fechaDia = new Date(d.fecha);
                return fechaDia >= inicioSemana && fechaDia < finSemana;
            });

            const horasSemana = diasSemana.reduce((sum, d) => sum + d.horas, 0);

            tendenciaSemanal.push({
                semana: `Semana ${4 - i}`,
                horas: Math.round(horasSemana * 100) / 100,
                dias: diasSemana.length
            });
        }

        // ✅ DÍAS MÁS PRODUCTIVOS
        const diasMasProductivos = [...diasConHoras]
            .sort((a, b) => b.horas - a.horas)
            .slice(0, 5)
            .map(d => ({
                fecha: d.fecha,
                horas: d.horas,
                horaIngreso: d.horaIngreso || '00:00'
            }));

        // ✅ PROMEDIO HORA DE INGRESO
        const horasIngreso = diasConHoras
            .filter(d => d.horaIngreso)
            .map(d => {
                const horaStr = formatTimeToString(d.horaIngreso) || '00:00:00';
                const [hora, minuto] = horaStr.split(':').map(Number);
                return hora * 60 + minuto;
            });

        const promedioMinutos = horasIngreso.length > 0 ? 
            horasIngreso.reduce((sum, m) => sum + m, 0) / horasIngreso.length : 0;

        const horaPromedio = Math.floor(promedioMinutos / 60);
        const minutoPromedio = Math.floor(promedioMinutos % 60);
        const promedioHoraIngreso = `${horaPromedio.toString().padStart(2, '0')}:${minutoPromedio.toString().padStart(2, '0')}`;

        console.log('✅ [ESTADISTICAS-SERVICE] Procesadas correctamente');

        return {
            horasObjetivo: horasObjetivoDiario,
            horasReales: Math.round(horasReales * 100) / 100,
            porcentajeCumplimiento: Math.round(porcentajeCumplimiento * 100) / 100,
            tendenciaSemanal,
            diasMasProductivos,
            promedioHoraIngreso
        };

    } catch (error) {
        console.error('❌ [ESTADISTICAS-SERVICE] Error:', error);
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
}

/**
 * 📝 SERVICIO - CREAR JUSTIFICACIÓN
 */
export async function crearJustificacionService(rutUsuario, datosJustificacion) {
    try {
        console.log('📝 [JUSTIFICACION-SERVICE] === CREANDO ===');

        const { fecha, motivo, descripcion, tipo } = datosJustificacion;

        if (!fecha || !motivo || !descripcion) {
            throw new Error('Fecha, motivo y descripción son requeridos');
        }

        const Justificacion = (await import('../entities/justificacion.entity.js')).default;

        const justificacionExistente = await Justificacion.findOne({
            where: {
                rut_usuario: rutUsuario,
                fecha: fecha
            }
        });

        if (justificacionExistente) {
            throw new Error('Ya existe una justificación para esta fecha');
        }

        const nuevaJustificacion = await Justificacion.create({
            rut_usuario: rutUsuario,
            fecha: fecha,
            motivo: motivo,
            descripcion: descripcion,
            tipo: tipo || 'ausencia',
            estado: 'pendiente',
            fecha_solicitud: new Date()
        });

        console.log('✅ [JUSTIFICACION-SERVICE] Creada:', nuevaJustificacion.id_justificacion);

        return {
            id: nuevaJustificacion.id_justificacion,
            fecha: nuevaJustificacion.fecha,
            estado: nuevaJustificacion.estado,
            motivo: nuevaJustificacion.motivo
        };

    } catch (error) {
        console.error('❌ [JUSTIFICACION-SERVICE] Error:', error);
        throw new Error(`Error creando justificación: ${error.message}`);
    }
}

/**
 * 📋 SERVICIO - OBTENER JUSTIFICACIONES DEL USUARIO
 */
export async function getJustificacionesUsuarioService(rutUsuario) {
    try {
        console.log('📋 [JUSTIFICACIONES-SERVICE] === OBTENIENDO ===');

        const Justificacion = (await import('../entities/justificacion.entity.js')).default;

        const justificaciones = await Justificacion.findAll({
            where: { rut_usuario: rutUsuario },
            order: [['fecha_solicitud', 'DESC']]
        });

        console.log('📋 [JUSTIFICACIONES-SERVICE] Encontradas:', justificaciones.length);

        return justificaciones.map(j => ({
            id: j.id_justificacion,
            fecha: j.fecha,
            motivo: j.motivo,
            descripcion: j.descripcion,
            tipo: j.tipo,
            estado: j.estado,
            fechaSolicitud: j.fecha_solicitud,
            fechaRevision: j.fecha_revision,
            comentarioAdmin: j.comentario_admin
        }));

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-SERVICE] Error:', error);
        throw new Error(`Error obteniendo justificaciones: ${error.message}`);
    }
}

