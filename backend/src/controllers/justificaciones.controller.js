"use strict";

import {
    crearJustificacion,
    getJustificacionesUsuario,
    getDetalleJustificacion,
    actualizarJustificacion,
    cancelarJustificacion,
    getMotivosJustificacion,
    validarFechaJustificacion
} from '../services/justificaciones.service.js';

/**
 * 📋 CONTROLADOR DE JUSTIFICACIONES
 */

// ✅ CREAR JUSTIFICACIÓN
export async function crearJustificacionController(req, res) {
    console.log('📋 [JUSTIFICACIONES-CONTROLLER] ===== CREAR JUSTIFICACIÓN =====');
    
    try {
        const user = req.user;
        const rut_usuario = user?.rut_usuario || user?.rut;
        const datosJustificacion = req.body;

        // Validar datos requeridos
        if (!datosJustificacion.fecha_justificacion || !datosJustificacion.motivo || !datosJustificacion.descripcion) {
            return res.status(400).json({
                success: false,
                error: 'Fecha, motivo y descripción son requeridos'
            });
        }

        // Validar fecha
        try {
            validarFechaJustificacion(datosJustificacion.fecha_justificacion);
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                error: validationError.message
            });
        }

        console.log('📋 Creando justificación para:', rut_usuario);

        const nuevaJustificacion = await crearJustificacion(rut_usuario, datosJustificacion);

        return res.status(201).json({
            success: true,
            message: 'Justificación creada exitosamente',
            data: nuevaJustificacion
        });

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-CONTROLLER] Error crear:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error creando justificación',
            details: error.message
        });
    }
}

// ✅ OBTENER JUSTIFICACIONES
export async function getJustificacionesController(req, res) {
    console.log('📋 [JUSTIFICACIONES-CONTROLLER] ===== GET JUSTIFICACIONES =====');
    
    try {
        const user = req.user;
        const rut_usuario = user?.rut_usuario || user?.rut;
        
        const filtros = {
            estado: req.query.estado,
            mes: req.query.mes ? parseInt(req.query.mes) : undefined,
            anio: req.query.anio ? parseInt(req.query.anio) : undefined,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };

        console.log('📋 Obteniendo justificaciones:', { rut_usuario, filtros });

        const resultado = await getJustificacionesUsuario(rut_usuario, filtros);

        return res.status(200).json({
            success: true,
            data: resultado
        });

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-CONTROLLER] Error get:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error obteniendo justificaciones',
            details: error.message
        });
    }
}

// ✅ OBTENER DETALLE DE JUSTIFICACIÓN
export async function getDetalleJustificacionController(req, res) {
    console.log('📋 [JUSTIFICACIONES-CONTROLLER] ===== GET DETALLE =====');
    
    try {
        const user = req.user;
        const rut_usuario = user?.rut_usuario || user?.rut;
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID de justificación requerido'
            });
        }

        console.log('📋 Obteniendo detalle:', { id, rut_usuario });

        const justificacion = await getDetalleJustificacion(parseInt(id), rut_usuario);

        return res.status(200).json({
            success: true,
            data: justificacion
        });

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-CONTROLLER] Error detalle:', error.message);
        return res.status(404).json({
            success: false,
            error: 'Justificación no encontrada',
            details: error.message
        });
    }
}

// ✅ ACTUALIZAR JUSTIFICACIÓN
export async function actualizarJustificacionController(req, res) {
    console.log('📋 [JUSTIFICACIONES-CONTROLLER] ===== ACTUALIZAR =====');
    
    try {
        const user = req.user;
        const rut_usuario = user?.rut_usuario || user?.rut;
        const { id } = req.params;
        const datosActualizacion = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID de justificación requerido'
            });
        }

        console.log('📋 Actualizando justificación:', { id, rut_usuario });

        const justificacionActualizada = await actualizarJustificacion(
            parseInt(id), 
            rut_usuario, 
            datosActualizacion
        );

        return res.status(200).json({
            success: true,
            message: 'Justificación actualizada exitosamente',
            data: justificacionActualizada
        });

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-CONTROLLER] Error actualizar:', error.message);
        return res.status(400).json({
            success: false,
            error: 'Error actualizando justificación',
            details: error.message
        });
    }
}

// ✅ CANCELAR/ELIMINAR JUSTIFICACIÓN
export async function eliminarJustificacionController(req, res) {
    console.log('📋 [JUSTIFICACIONES-CONTROLLER] ===== ELIMINAR =====');
    
    try {
        const user = req.user;
        const rut_usuario = user?.rut_usuario || user?.rut;
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID de justificación requerido'
            });
        }

        console.log('📋 Eliminando justificación:', { id, rut_usuario });

        const justificacionCancelada = await cancelarJustificacion(
            parseInt(id), 
            rut_usuario
        );

        return res.status(200).json({
            success: true,
            message: 'Justificación eliminada exitosamente',
            data: justificacionCancelada
        });

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-CONTROLLER] Error eliminar:', error.message);
        return res.status(400).json({
            success: false,
            error: 'Error eliminando justificación',
            details: error.message
        });
    }
}

// ✅ OBTENER MOTIVOS
export async function getMotivosController(req, res) {
    console.log('📋 [JUSTIFICACIONES-CONTROLLER] ===== GET MOTIVOS =====');
    
    try {
        const motivos = await getMotivosJustificacion();

        return res.status(200).json({
            success: true,
            data: motivos
        });

    } catch (error) {
        console.error('❌ [JUSTIFICACIONES-CONTROLLER] Error motivos:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error obteniendo motivos'
        });
    }
}

console.log('📋 [JUSTIFICACIONES-CONTROLLER] ✅ Controlador de justificaciones cargado');