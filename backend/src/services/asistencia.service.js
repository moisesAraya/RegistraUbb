"use strict";

import { Op } from 'sequelize';
import Usuario from '../entities/usuario.entity.js';
import Marcaje from '../entities/marcaje.entity.js';
import RegistroMarcaje from '../entities/registro_marcaje.entity.js';
import Asistencia from '../entities/asistencia.entity.js';

console.log('🎯 [ASISTENCIA-SERVICE] ✅ SERVICE CARGADO ✅');

function formatTimeToString(value) {
    if (!value) return null;

    // Si ya es string en formato HH:MM o HH:MM:SS
    if (typeof value === "string") {
        // Si viene como "08:32", lo extiendo a "08:32:00"
        if (/^\d{2}:\d{2}$/.test(value)) {
            return value + ":00";
        }

        // Si viene completo como "08:32:12", lo dejo
        if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
            return value;
        }

        // Si viene como ISO timestamp (2025-11-16T00:32:07.940-0300)
        if (value.includes("T")) {
            try {
                const date = new Date(value);
                // Formatear manualmente para evitar problemas de zona horaria
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${hours}:${minutes}:${seconds}`;
            } catch {
                return null;
            }
        }

        return null;
    }

    // Si viene como Date
    if (value instanceof Date) {
        return value.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'America/Santiago'
        });
    }

    // Si viene como objeto { hours, minutes }
    if (typeof value === "object" && value.hours !== undefined) {
        const h = String(value.hours).padStart(2, "0");
        const m = String(value.minutes).padStart(2, "0");
        const s = String(value.seconds || 0).padStart(2, "0");
        return `${h}:${m}:${s}`;
    }

    return null;
}

/**
 * 📅 SERVICIO - OBTENER ASISTENCIA DEL USUARIO (USANDO ASISTENCIA + MARCAJE)
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

        // Buscar todos los marcajes del usuario en el rango de fechas
        const marcajesUsuario = await RegistroMarcaje.findAll({
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

        console.log('📅 [ASISTENCIA-SERVICE] Marcajes del usuario encontrados:', marcajesUsuario.length);

        if (marcajesUsuario.length === 0) {
            console.log('⚠️ [ASISTENCIA-SERVICE] No hay marcajes para el usuario');
            
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

        // Buscar asistencias relacionadas con estos marcajes
        const idsMarce = marcajesUsuario.map(m => m.marcaje.id_marcaje);
        const asistenciasDB = await Asistencia.findAll({
            where: {
                id_marcaje: {
                    [Op.in]: idsMarce
                }
            },
            include: [{
                model: Marcaje,
                as: 'marcajeAsistencia',
                required: true
            }],
            order: [
                [{ model: Marcaje, as: 'marcajeAsistencia' }, 'fecha', 'DESC'],
                [{ model: Marcaje, as: 'marcajeAsistencia' }, 'hora_ingreso', 'DESC']
            ]
        });

        console.log('📅 [ASISTENCIA-SERVICE] Asistencias encontradas:', asistenciasDB.length);
        console.log('📅 [ASISTENCIA-SERVICE] IDs de marcajes usados:', idsMarce);

        if (asistenciasDB.length === 0) {
            console.log('⚠️ [ASISTENCIA-SERVICE] No hay registros de asistencia');
            
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

        // ✅ PROCESAR CADA REGISTRO DE ASISTENCIA
        const asistencias = asistenciasDB.map(asistenciaDB => {
            const marcaje = asistenciaDB.marcajeAsistencia;
            
            console.log('📊 [ASISTENCIA-SERVICE] Procesando registro:', {
                id_asist: asistenciaDB.id_asist,
                fecha: marcaje.fecha,
                hora_ingreso: marcaje.hora_ingreso,
                hora_salida: marcaje.hora_salida,
                horas_diarias: asistenciaDB.horas_diarias
            });
            
            // Determinar estado basado en horas trabajadas
            let estado = 'presente';
            if (asistenciaDB.horas_diarias === 0 || (!marcaje.hora_ingreso && !marcaje.hora_salida)) {
                estado = 'falta';
            }

            const horaIngresoFormateada = formatTimeToString(marcaje.hora_ingreso);
            const horaSalidaFormateada = formatTimeToString(marcaje.hora_salida);

            console.log('📊 [ASISTENCIA-SERVICE] Horas formateadas:', {
                original_ingreso: marcaje.hora_ingreso,
                formateada_ingreso: horaIngresoFormateada,
                original_salida: marcaje.hora_salida,
                formateada_salida: horaSalidaFormateada
            });

            return {
                fecha: marcaje.fecha,
                horaIngreso: horaIngresoFormateada,
                horaSalida: horaSalidaFormateada,
                horasTrabajadas: parseFloat(asistenciaDB.horas_diarias) || 0,
                estado: estado,
                observacion: asistenciaDB.observacion || marcaje.observacion || null,
                tipoMarcaje: 'qr',
                ubicacion: 'Campus',
                colacion: asistenciaDB.colacion || false,
                detalleAsistencia: {
                    id_asist: asistenciaDB.id_asist,
                    id_marcaje: asistenciaDB.id_marcaje,
                    tuvoColacion: asistenciaDB.colacion
                }
            };
        });

        // ✅ CALCULAR RESUMEN CORRECTO
        // Contar días únicos trabajados (no registros)
        const fechasUnicasTrabajadas = new Set(
            asistencias
                .filter(a => a.estado === 'presente' && a.horasTrabajadas > 0)
                .map(a => a.fecha)
        );
        const diasTrabajados = fechasUnicasTrabajadas.size;
        
        const horasTotales = asistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0);
        const horasPromedio = diasTrabajados > 0 ? horasTotales / diasTrabajados : 0;
        
        // Contar días únicos con faltas
        const fechasUnicasConFaltas = new Set(
            asistencias
                .filter(a => a.estado === 'falta')
                .map(a => a.fecha)
        );
        const faltas = fechasUnicasConFaltas.size;

        const resumen = {
            diasTrabajados,
            horasTotales: Math.round(horasTotales * 100) / 100,
            horasPromedio: Math.round(horasPromedio * 100) / 100,
            faltas
        };

        console.log('✅ [ASISTENCIA-SERVICE] Fechas únicas trabajadas:', Array.from(fechasUnicasTrabajadas));
        console.log('✅ [ASISTENCIA-SERVICE] Fechas únicas con faltas:', Array.from(fechasUnicasConFaltas));
        console.log('✅ [ASISTENCIA-SERVICE] Resumen:', resumen);
        console.log('✅ [ASISTENCIA-SERVICE] Asistencias procesadas:', asistencias.length);

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
                    const entradaStr = formatTimeToString(entradas[i].hora);
                    const salidaStr = formatTimeToString(salidas[i].hora);

                    // Si alguna hora es inválida, saltar el par
                    if (!entradaStr || !salidaStr) {
                        console.warn("Registro inválido:", entradas[i].hora, salidas[i].hora);
                        continue;
                    }

                    const [hE, mE] = entradaStr.split(':').map(Number);
                    const [hS, mS] = salidaStr.split(':').map(Number);

                    
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

