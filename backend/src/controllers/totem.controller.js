"use strict";

import { 
    getAllTotems, 
    getTotemById, 
    createTotem, 
    updateTotem, 
    deleteTotem, 
    searchTotemsByUbicacion,
    getTotemStats 
} from '../services/totem.service.js';

console.log('🏢 [TOTEM-CONTROLLER] ✅ Controlador de totems cargado');

/**
 * 🔍 OBTENER TODOS LOS TOTEMS
 */
export async function getTotems(req, res) {
    console.log('🔍 [TOTEM-CONTROLLER] ===== GET TOTEMS =====');
    
    try {
        const { search } = req.query;

        let result;
        if (search) {
            console.log('🔍 Búsqueda de totems por ubicación:', search);
            result = await searchTotemsByUbicacion(search);
        } else {
            console.log('📋 Obteniendo todos los totems');
            result = await getAllTotems();
        }

        console.log('✅ [TOTEM-CONTROLLER] Totems obtenidos exitosamente');
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ [TOTEM-CONTROLLER] Error en getTotems:', error.message);
        
        return res.status(500).json({
            success: false,
            error: 'Error al obtener los totems',
            details: error.message
        });
    }
}

/**
 * 🔍 OBTENER TOTEM POR ID
 */
export async function getTotem(req, res) {
    console.log('🔍 [TOTEM-CONTROLLER] ===== GET TOTEM BY ID =====');
    
    try {
        const { id } = req.params;
        
        console.log('🔍 Obteniendo totem ID:', id);
        
        const result = await getTotemById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }

        console.log('✅ [TOTEM-CONTROLLER] Totem obtenido exitosamente');
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ [TOTEM-CONTROLLER] Error en getTotem:', error.message);
        
        return res.status(500).json({
            success: false,
            error: 'Error al obtener el totem',
            details: error.message
        });
    }
}

/**
 * ➕ CREAR NUEVO TOTEM
 */
export async function createTotemController(req, res) {
    console.log('➕ [TOTEM-CONTROLLER] ===== CREATE TOTEM =====');
    
    try {
        const user = req.user;
        console.log('👤 Usuario creando totem:', user?.nombres, 'Rol:', user?.id_rol);

        // Verificar que sea administrador o desarrollador
        if (!user || (user.id_rol !== 1 && user.id_rol !== 3)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para crear totems'
            });
        }

        const { ubicacion, descripcion } = req.body;
        
        console.log('➕ Datos del nuevo totem:', { ubicacion, descripcion });

        if (!ubicacion) {
            return res.status(400).json({
                success: false,
                error: 'La ubicación es requerida'
            });
        }

        const result = await createTotem({ ubicacion, descripcion });

        console.log('✅ [TOTEM-CONTROLLER] Totem creado exitosamente');
        
        return res.status(201).json(result);

    } catch (error) {
        console.error('❌ [TOTEM-CONTROLLER] Error en createTotem:', error.message);
        
        return res.status(400).json({
            success: false,
            error: 'Error al crear el totem',
            details: error.message
        });
    }
}

/**
 * ✏️ ACTUALIZAR TOTEM
 */
export async function updateTotemController(req, res) {
    console.log('✏️ [TOTEM-CONTROLLER] ===== UPDATE TOTEM =====');
    
    try {
        const user = req.user;
        console.log('👤 Usuario actualizando totem:', user?.nombres, 'Rol:', user?.id_rol);

        // Verificar que sea administrador o desarrollador
        if (!user || (user.id_rol !== 1 && user.id_rol !== 3)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para actualizar totems'
            });
        }

        const { id } = req.params;
        const { ubicacion, descripcion } = req.body;
        
        console.log('✏️ Actualizando totem ID:', id, 'con datos:', { ubicacion, descripcion });

        if (!ubicacion) {
            return res.status(400).json({
                success: false,
                error: 'La ubicación es requerida'
            });
        }

        const result = await updateTotem(id, { ubicacion, descripcion });

        console.log('✅ [TOTEM-CONTROLLER] Totem actualizado exitosamente');
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ [TOTEM-CONTROLLER] Error en updateTotem:', error.message);
        
        const statusCode = error.message.includes('no encontrado') ? 404 : 400;
        
        return res.status(statusCode).json({
            success: false,
            error: 'Error al actualizar el totem',
            details: error.message
        });
    }
}

/**
 * 🗑️ ELIMINAR TOTEM
 */
export async function deleteTotemController(req, res) {
    console.log('🗑️ [TOTEM-CONTROLLER] ===== DELETE TOTEM =====');
    
    try {
        const user = req.user;
        console.log('👤 Usuario eliminando totem:', user?.nombres, 'Rol:', user?.id_rol);

        // Verificar que sea administrador o desarrollador
        if (!user || (user.id_rol !== 1 && user.id_rol !== 3)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar totems'
            });
        }

        const { id } = req.params;
        
        console.log('🗑️ Eliminando totem ID:', id);

        const result = await deleteTotem(id);

        console.log('✅ [TOTEM-CONTROLLER] Totem eliminado exitosamente');
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ [TOTEM-CONTROLLER] Error en deleteTotem:', error.message);
        
        const statusCode = error.message.includes('no encontrado') ? 404 : 500;
        
        return res.status(statusCode).json({
            success: false,
            error: 'Error al eliminar el totem',
            details: error.message
        });
    }
}

/**
 * 📊 OBTENER ESTADÍSTICAS DE TOTEMS
 */
export async function getTotemStatistics(req, res) {
    console.log('📊 [TOTEM-CONTROLLER] ===== GET TOTEM STATS =====');
    
    try {
        const user = req.user;
        console.log('👤 Usuario obteniendo estadísticas:', user?.nombres, 'Rol:', user?.id_rol);

        // Verificar que sea administrador o desarrollador
        if (!user || (user.id_rol !== 1 && user.id_rol !== 3)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para ver estadísticas de totems'
            });
        }

        const result = await getTotemStats();

        console.log('✅ [TOTEM-CONTROLLER] Estadísticas obtenidas exitosamente');
        
        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ [TOTEM-CONTROLLER] Error en getTotemStats:', error.message);
        
        return res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas de totems',
            details: error.message
        });
    }
}

console.log('✅ [TOTEM-CONTROLLER] ✅ CONTROLADOR DE TOTEMS LISTO ✅');