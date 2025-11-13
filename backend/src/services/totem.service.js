"use strict";

import Totem from '../entities/totem.entity.js';
import { Op } from 'sequelize';

console.log('🏢 [TOTEM-SERVICE] ✅ Servicio de totems cargado');

/**
 * 🔍 OBTENER TODOS LOS TOTEMS
 */
export async function getAllTotems() {
    console.log('🔍 [TOTEM-SERVICE] Obteniendo todos los totems');
    
    try {
        const totems = await Totem.findAll({
            order: [['ubicacion', 'ASC']]
        });

        console.log(`✅ [TOTEM-SERVICE] ${totems.length} totems encontrados`);
        
        return {
            success: true,
            data: totems,
            count: totems.length
        };

    } catch (error) {
        console.error('❌ [TOTEM-SERVICE] Error obteniendo totems:', error);
        throw new Error('Error al obtener los totems');
    }
}

/**
 * 🔍 OBTENER TOTEM POR ID
 */
export async function getTotemById(id_totem) {
    console.log('🔍 [TOTEM-SERVICE] Obteniendo totem por ID:', id_totem);
    
    try {
        if (!id_totem) {
            throw new Error('ID de totem es requerido');
        }

        const totem = await Totem.findByPk(id_totem);

        if (!totem) {
            return {
                success: false,
                message: 'Totem no encontrado'
            };
        }

        console.log('✅ [TOTEM-SERVICE] Totem encontrado:', totem.ubicacion);
        
        return {
            success: true,
            data: totem
        };

    } catch (error) {
        console.error('❌ [TOTEM-SERVICE] Error obteniendo totem:', error);
        throw new Error(error.message || 'Error al obtener el totem');
    }
}

/**
 * ➕ CREAR NUEVO TOTEM
 */
export async function createTotem(totemData) {
    console.log('➕ [TOTEM-SERVICE] Creando nuevo totem:', totemData);
    
    try {
        // Validaciones
        if (!totemData.ubicacion) {
            throw new Error('La ubicación es requerida');
        }

        // Verificar que no exista otro totem con la misma ubicación
        const existingTotem = await Totem.findOne({
            where: { ubicacion: totemData.ubicacion }
        });

        if (existingTotem) {
            throw new Error('Ya existe un totem en esa ubicación');
        }

        const nuevoTotem = await Totem.create({
            ubicacion: totemData.ubicacion.trim(),
            descripcion: totemData.descripcion?.trim() || null
        });

        console.log('✅ [TOTEM-SERVICE] Totem creado:', nuevoTotem.id_totem);
        
        return {
            success: true,
            data: nuevoTotem,
            message: 'Totem creado exitosamente'
        };

    } catch (error) {
        console.error('❌ [TOTEM-SERVICE] Error creando totem:', error);
        
        // Manejo de errores de validación de Sequelize
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => err.message);
            throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw new Error('Ya existe un totem con esa ubicación');
        }

        throw new Error(error.message || 'Error al crear el totem');
    }
}

/**
 * ✏️ ACTUALIZAR TOTEM
 */
export async function updateTotem(id_totem, totemData) {
    console.log('✏️ [TOTEM-SERVICE] Actualizando totem:', id_totem, totemData);
    
    try {
        if (!id_totem) {
            throw new Error('ID de totem es requerido');
        }

        if (!totemData.ubicacion) {
            throw new Error('La ubicación es requerida');
        }

        // Verificar que el totem existe
        const totem = await Totem.findByPk(id_totem);
        if (!totem) {
            throw new Error('Totem no encontrado');
        }

        // Verificar que no exista otro totem con la misma ubicación (excepto el actual)
        const existingTotem = await Totem.findOne({
            where: { 
                ubicacion: totemData.ubicacion,
                id_totem: { [Op.ne]: id_totem }
            }
        });

        if (existingTotem) {
            throw new Error('Ya existe otro totem en esa ubicación');
        }

        // Actualizar el totem
        await totem.update({
            ubicacion: totemData.ubicacion.trim(),
            descripcion: totemData.descripcion?.trim() || null
        });

        console.log('✅ [TOTEM-SERVICE] Totem actualizado:', totem.ubicacion);
        
        return {
            success: true,
            data: totem,
            message: 'Totem actualizado exitosamente'
        };

    } catch (error) {
        console.error('❌ [TOTEM-SERVICE] Error actualizando totem:', error);
        
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => err.message);
            throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw new Error('Ya existe un totem con esa ubicación');
        }

        throw new Error(error.message || 'Error al actualizar el totem');
    }
}

/**
 * 🗑️ ELIMINAR TOTEM
 */
export async function deleteTotem(id_totem) {
    console.log('🗑️ [TOTEM-SERVICE] Eliminando totem:', id_totem);
    
    try {
        if (!id_totem) {
            throw new Error('ID de totem es requerido');
        }

        const totem = await Totem.findByPk(id_totem);
        if (!totem) {
            throw new Error('Totem no encontrado');
        }

        const ubicacionEliminada = totem.ubicacion;
        await totem.destroy();

        console.log('✅ [TOTEM-SERVICE] Totem eliminado:', ubicacionEliminada);
        
        return {
            success: true,
            message: `Totem "${ubicacionEliminada}" eliminado exitosamente`
        };

    } catch (error) {
        console.error('❌ [TOTEM-SERVICE] Error eliminando totem:', error);
        throw new Error(error.message || 'Error al eliminar el totem');
    }
}

/**
 * 🔍 BUSCAR TOTEMS POR UBICACIÓN
 */
export async function searchTotemsByUbicacion(busqueda) {
    console.log('🔍 [TOTEM-SERVICE] Buscando totems por ubicación:', busqueda);
    
    try {
        if (!busqueda || busqueda.trim().length < 2) {
            throw new Error('La búsqueda debe tener al menos 2 caracteres');
        }

        const totems = await Totem.findAll({
            where: {
                ubicacion: {
                    [Op.iLike]: `%${busqueda.trim()}%`
                }
            },
            order: [['ubicacion', 'ASC']]
        });

        console.log(`✅ [TOTEM-SERVICE] ${totems.length} totems encontrados para "${busqueda}"`);
        
        return {
            success: true,
            data: totems,
            count: totems.length,
            search_term: busqueda
        };

    } catch (error) {
        console.error('❌ [TOTEM-SERVICE] Error buscando totems:', error);
        throw new Error(error.message || 'Error al buscar totems');
    }
}

/**
 * 📊 ESTADÍSTICAS DE TOTEMS
 */
export async function getTotemStats() {
    console.log('📊 [TOTEM-SERVICE] Obteniendo estadísticas de totems');
    
    try {
        const totalTotems = await Totem.count();
        
        const totemsConDescripcion = await Totem.count({
            where: {
                descripcion: {
                    [Op.ne]: null,
                    [Op.ne]: ''
                }
            }
        });

        const totemsSinDescripcion = totalTotems - totemsConDescripcion;

        // Obtener ubicaciones más comunes (por palabra)
        const totems = await Totem.findAll({
            attributes: ['ubicacion']
        });

        const palabrasComunes = {};
        totems.forEach(totem => {
            const palabras = totem.ubicacion.toLowerCase().split(' ');
            palabras.forEach(palabra => {
                if (palabra.length > 3) { // Solo palabras de más de 3 caracteres
                    palabrasComunes[palabra] = (palabrasComunes[palabra] || 0) + 1;
                }
            });
        });

        const topPalabras = Object.entries(palabrasComunes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([palabra, count]) => ({ palabra, count }));

        const stats = {
            total_totems: totalTotems,
            con_descripcion: totemsConDescripcion,
            sin_descripcion: totemsSinDescripcion,
            porcentaje_con_descripcion: totalTotems > 0 ? 
                Math.round((totemsConDescripcion / totalTotems) * 100) : 0,
            palabras_comunes_ubicacion: topPalabras,
            generated_at: new Date().toISOString()
        };

        console.log('✅ [TOTEM-SERVICE] Estadísticas generadas:', stats);
        
        return {
            success: true,
            data: stats
        };

    } catch (error) {
        console.error('❌ [TOTEM-SERVICE] Error obteniendo estadísticas:', error);
        throw new Error('Error al obtener estadísticas de totems');
    }
}

console.log('✅ [TOTEM-SERVICE] ✅ SERVICIO DE TOTEMS LISTO ✅');