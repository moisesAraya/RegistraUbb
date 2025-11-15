"use strict";

import Justificacion from '../entities/justificacion.entity.js';
import { Op } from 'sequelize';

/**
 * 📋 SERVICIO DE JUSTIFICACIONES
 */

// ✅ OBTENER MOTIVOS DISPONIBLES
export async function getMotivosJustificacion() {
    console.log('📋 [JUSTIFICACIONES-SERVICE] Obteniendo motivos...');
    
    return [
        { 
            id: 'congreso', 
            nombre: 'Congreso/Conferencia',
            descripcion: 'Asistencia a congresos, seminarios o conferencias académicas',
            es_justificada: true,
            horas_compensadas: 8.0
        },
        { 
            id: 'charla', 
            nombre: 'Charla/Capacitación',
            descripcion: 'Charlas, talleres o capacitaciones relacionadas con el trabajo',
            es_justificada: true,
            horas_compensadas: 8.0
        },
        { 
            id: 'enfermedad', 
            nombre: 'Enfermedad',
            descripcion: 'Ausencia por motivos de salud',
            es_justificada: true,
            horas_compensadas: 8.0
        },
        { 
            id: 'personal', 
            nombre: 'Motivo Personal',
            descripcion: 'Trámites o asuntos personales',
            es_justificada: false,
            horas_compensadas: 0
        },
        { 
            id: 'otro', 
            nombre: 'Otro',
            descripcion: 'Otros motivos no especificados',
            es_justificada: false,
            horas_compensadas: 0
        }
    ];
}

// ✅ VALIDAR FECHA DE JUSTIFICACIÓN
export function validarFechaJustificacion(fecha) {
    const fechaJustificacion = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // No permitir fechas futuras
    if (fechaJustificacion > hoy) {
        throw new Error('No se pueden justificar fechas futuras');
    }
    
    // Opcional: Limitar cuántos días atrás se puede justificar (ej: 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    hace30Dias.setHours(0, 0, 0, 0);
    
    if (fechaJustificacion < hace30Dias) {
        throw new Error('Solo se pueden justificar ausencias de los últimos 30 días');
    }
    
    return true;
}

// ✅ CREAR JUSTIFICACIÓN
export async function crearJustificacion(rut_usuario, datosJustificacion) {
    console.log('📋 [JUSTIFICACIONES-SERVICE] Creando justificación:', { rut_usuario, datosJustificacion });
    
    try {
        // Obtener configuración del motivo
        const motivos = await getMotivosJustificacion();
        const motivoConfig = motivos.find(m => m.id === datosJustificacion.motivo);
        
        if (!motivoConfig) {
            throw new Error('Motivo de justificación no válido');
        }
        
        // Verificar si ya existe una justificación para esa fecha
        const justificacionExistente = await Justificacion.findOne({
            where: {
                rut_usuario,
                fecha_justificacion: datosJustificacion.fecha_justificacion
            }
        });
        
        if (justificacionExistente) {
            throw new Error('Ya existe una justificación para esta fecha');
        }
        
        // Crear justificación con datos calculados
        const nuevaJustificacion = await Justificacion.create({
            rut_usuario,
            fecha_justificacion: datosJustificacion.fecha_justificacion,
            motivo: datosJustificacion.motivo,
            descripcion: datosJustificacion.descripcion || '',
            es_justificada: motivoConfig.es_justificada,
            horas_compensadas: motivoConfig.horas_compensadas,
            estado: 'REGISTRADA',
            observaciones: datosJustificacion.observaciones || null,
            fecha_registro: new Date()
        });
        
        console.log('✅ [JUSTIFICACIONES-SERVICE] Justificación creada:', nuevaJustificacion.id_justificacion);
        
        return nuevaJustificacion;
        
    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-SERVICE] Error crear:', error.message);
        throw error;
    }
}

// ✅ OBTENER JUSTIFICACIONES DEL USUARIO
export async function getJustificacionesUsuario(rut_usuario, filtros = {}) {
    console.log('📋 [JUSTIFICACIONES-SERVICE] Obteniendo justificaciones:', { rut_usuario, filtros });
    
    try {
        const where = { rut_usuario };
        
        // Filtros opcionales
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        
        if (filtros.mes && filtros.anio) {
            const primerDia = new Date(filtros.anio, filtros.mes - 1, 1);
            const ultimoDia = new Date(filtros.anio, filtros.mes, 0);
            
            where.fecha_justificacion = {
                [Op.between]: [primerDia, ultimoDia]
            };
        } else if (filtros.fecha_desde && filtros.fecha_hasta) {
            where.fecha_justificacion = {
                [Op.between]: [filtros.fecha_desde, filtros.fecha_hasta]
            };
        }
        
        const justificaciones = await Justificacion.findAll({
            where,
            order: [['fecha_justificacion', 'DESC']],
            limit: filtros.limit || 50
        });
        
        console.log('✅ [JUSTIFICACIONES-SERVICE] Justificaciones encontradas:', justificaciones.length);
        
        return {
            justificaciones,
            total: justificaciones.length
        };
        
    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-SERVICE] Error get:', error.message);
        throw error;
    }
}

// ✅ OBTENER DETALLE DE JUSTIFICACIÓN
export async function getDetalleJustificacion(id_justificacion, rut_usuario) {
    console.log('📋 [JUSTIFICACIONES-SERVICE] Obteniendo detalle:', { id_justificacion, rut_usuario });
    
    try {
        const justificacion = await Justificacion.findOne({
            where: {
                id_justificacion,
                rut_usuario
            }
        });
        
        if (!justificacion) {
            throw new Error('Justificación no encontrada');
        }
        
        console.log('✅ [JUSTIFICACIONES-SERVICE] Justificación encontrada');
        
        return justificacion;
        
    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-SERVICE] Error detalle:', error.message);
        throw error;
    }
}

// ✅ ACTUALIZAR JUSTIFICACIÓN
export async function actualizarJustificacion(id_justificacion, rut_usuario, datosActualizacion) {
    console.log('📋 [JUSTIFICACIONES-SERVICE] Actualizando:', { id_justificacion, rut_usuario });
    
    try {
        const justificacion = await Justificacion.findOne({
            where: {
                id_justificacion,
                rut_usuario
            }
        });
        
        if (!justificacion) {
            throw new Error('Justificación no encontrada');
        }
        
        // Solo permitir actualizar descripción y observaciones
        const datosPermitidos = {
            descripcion: datosActualizacion.descripcion,
            observaciones: datosActualizacion.observaciones
        };
        
        // Si se cambia el motivo, recalcular es_justificada y horas
        if (datosActualizacion.motivo && datosActualizacion.motivo !== justificacion.motivo) {
            const motivos = await getMotivosJustificacion();
            const motivoConfig = motivos.find(m => m.id === datosActualizacion.motivo);
            
            if (!motivoConfig) {
                throw new Error('Motivo no válido');
            }
            
            datosPermitidos.motivo = datosActualizacion.motivo;
            datosPermitidos.es_justificada = motivoConfig.es_justificada;
            datosPermitidos.horas_compensadas = motivoConfig.horas_compensadas;
        }
        
        await justificacion.update(datosPermitidos);
        
        console.log('✅ [JUSTIFICACIONES-SERVICE] Justificación actualizada');
        
        return justificacion;
        
    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-SERVICE] Error actualizar:', error.message);
        throw error;
    }
}

// ✅ CANCELAR JUSTIFICACIÓN
export async function cancelarJustificacion(id_justificacion, rut_usuario) {
    console.log('📋 [JUSTIFICACIONES-SERVICE] Cancelando:', { id_justificacion, rut_usuario });
    
    try {
        const justificacion = await Justificacion.findOne({
            where: {
                id_justificacion,
                rut_usuario
            }
        });
        
        if (!justificacion) {
            throw new Error('Justificación no encontrada');
        }
        
        // Eliminar la justificación
        await justificacion.destroy();
        
        console.log('✅ [JUSTIFICACIONES-SERVICE] Justificación eliminada');
        
        return { mensaje: 'Justificación eliminada exitosamente' };
        
    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-SERVICE] Error cancelar:', error.message);
        throw error;
    }
}

console.log('📋 [JUSTIFICACIONES-SERVICE] ✅ Servicio de justificaciones cargado');