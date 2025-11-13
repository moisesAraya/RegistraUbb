"use strict";

import { Op } from 'sequelize';
import Justificacion from '../entities/justificacion.entity.js';
import Usuario from '../entities/usuario.entity.js';

/**
 * 📋 SERVICIO DE JUSTIFICACIONES
 */

// ✅ CREAR NUEVA JUSTIFICACIÓN
export async function crearJustificacion(rut_usuario, datosJustificacion) {
    console.log('📋 [JUSTIFICACIONES] Creando justificación:', { rut_usuario, datos: datosJustificacion });
    
    try {
        const nuevaJustificacion = await Justificacion.create({
            ...datosJustificacion,
            rut_usuario,
            estado_aprobacion: 'aprobada', // ✅ AUTO-APROBADO: No requiere autorización admin
            fecha_solicitud: new Date(),
            documento_adjunto: datosJustificacion.documento_adjunto || null
        });

        console.log('✅ [JUSTIFICACIONES] Justificación creada:', nuevaJustificacion.id_justificacion);
        
        return nuevaJustificacion;

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES] Error creando:', error.message);
        throw error;
    }
}

// ✅ OBTENER JUSTIFICACIONES DEL USUARIO
export async function getJustificacionesUsuario(rut_usuario, filtros = {}) {
    console.log('📋 [JUSTIFICACIONES] Obteniendo justificaciones:', { rut_usuario, filtros });
    
    try {
        const whereCondition = { rut_usuario };
        
        // Aplicar filtros
        if (filtros.estado) {
            whereCondition.estado_aprobacion = filtros.estado;
        }
        
        if (filtros.mes && filtros.anio) {
            whereCondition.fecha_justificacion = {
                [Op.between]: [
                    new Date(filtros.anio, filtros.mes - 1, 1),
                    new Date(filtros.anio, filtros.mes, 0)
                ]
            };
        }
        
        if (filtros.fecha_desde && filtros.fecha_hasta) {
            whereCondition.fecha_justificacion = {
                [Op.between]: [filtros.fecha_desde, filtros.fecha_hasta]
            };
        }

        // Obtener justificaciones de un usuario
        const justificaciones = await Justificacion.findAll({
            where: {
                rut_usuario,
                // ...otros filtros como estado, fecha_justificacion, etc.
            },
            order: [['fecha_justificacion', 'DESC']]
        });

        // Calcular estadísticas
        const estadisticas = {
            total: justificaciones.length,
            pendientes: justificaciones.filter(j => j.estado_aprobacion === 'pendiente').length,
            aprobadas: justificaciones.filter(j => j.estado_aprobacion === 'aprobada').length,
            rechazadas: justificaciones.filter(j => j.estado_aprobacion === 'rechazada').length
        };

        return {
            justificaciones,
            estadisticas,
            filtros_aplicados: filtros
        };

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES] Error obteniendo:', error.message);
        throw error;
    }
}

// ✅ OBTENER DETALLE DE JUSTIFICACIÓN
export async function getDetalleJustificacion(id_justificacion, rut_usuario) {
    console.log('📋 [JUSTIFICACIONES] Obteniendo detalle:', { id_justificacion, rut_usuario });
    
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

        return justificacion;

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES] Error detalle:', error.message);
        throw error;
    }
}

// ✅ ACTUALIZAR JUSTIFICACIÓN (Solo si está pendiente)
export async function actualizarJustificacion(id_justificacion, rut_usuario, datosActualizacion) {
    console.log('📋 [JUSTIFICACIONES] Actualizando:', { id_justificacion, rut_usuario });
    
    try {
        const justificacion = await Justificacion.findOne({
            where: {
                id_justificacion,
                rut_usuario,
                // ✅ Permitir modificar justificaciones sin restricción de estado
            }
        });

        if (!justificacion) {
            throw new Error('Justificación no encontrada');
        }

        await justificacion.update(datosActualizacion);
        
        console.log('✅ [JUSTIFICACIONES] Justificación actualizada');
        
        return justificacion;

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES] Error actualizando:', error.message);
        throw error;
    }
}

// ✅ CANCELAR JUSTIFICACIÓN
export async function cancelarJustificacion(id_justificacion, rut_usuario) {
    console.log('📋 [JUSTIFICACIONES] Cancelando:', { id_justificacion, rut_usuario });
    
    try {
        const justificacion = await Justificacion.findOne({
            where: {
                id_justificacion,
                rut_usuario,
                // ✅ Permitir cancelar justificaciones sin restricción de estado
            }
        });

        if (!justificacion) {
            throw new Error('Justificación no encontrada');
        }

        await justificacion.update({
            estado_aprobacion: 'cancelada',
            fecha_respuesta: new Date(),
            observaciones_aprobador: 'Cancelada por el usuario'
        });
        
        console.log('✅ [JUSTIFICACIONES] Justificación cancelada');
        
        return justificacion;

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES] Error cancelando:', error.message);
        throw error;
    }
}

// ✅ OBTENER MOTIVOS DISPONIBLES (SOLO AUSENCIA)
export async function getMotivosJustificacion() {
    return [
        { id: 'ausencia', label: 'Ausencia', requiere_documento: false, descripcion: 'Registrar día de ausencia con motivo' }
    ];
}

// ✅ VALIDAR FECHA DE JUSTIFICACIÓN
export function validarFechaJustificacion(fecha) {
    const fechaJustificacion = new Date(fecha);
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    if (fechaJustificacion > hoy) {
        throw new Error('No se puede justificar una fecha futura');
    }
    
    if (fechaJustificacion < hace30Dias) {
        throw new Error('No se puede justificar una fecha de más de 30 días');
    }
    
    return true;
}

console.log('📋 [JUSTIFICACIONES-SERVICE] ✅ Servicio de justificaciones cargado');