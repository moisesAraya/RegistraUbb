"use strict";

import { 
    getReportePersonalMensual, 
    getReporteComparativo as getReporteComparativoService, 
    getEstadisticasAnuales as getEstadisticasAnualesService 
} from '../services/reportes.service.js';
import Usuario from '../entities/usuario.entity.js';

/**
 * 📊 CONTROLADOR DE REPORTES PERSONALES
 */

// ✅ OBTENER REPORTE MENSUAL
export async function getReporteMensual(req, res) {
    console.log('📊 [REPORTES-CONTROLLER] ===== GET REPORTE MENSUAL =====');
    try {
        const user = req.user;
        let rut_usuario = user?.rut_usuario;

        // Si es admin (id_rol === 1) y viene rut por query, usa ese
        if (user?.id_rol === 1 && req.query.rut) {
            rut_usuario = req.query.rut;
        }

        const mes = parseInt(req.query.mes);
        const anio = parseInt(req.query.anio);

        if (!rut_usuario && !(user?.id_rol === 1 && req.query.todos === 'true')) {
            return res.status(400).json({ success: false, error: 'RUT requerido' });
        }
        if (!mes || !anio) {
            return res.status(400).json({ success: false, error: 'Mes y año requeridos' });
        }

        // Si es admin y se solicita todos, obtener reportes de todos los usuarios
        if (user?.id_rol === 1 && req.query.todos === 'true') {
            const usuarios = await Usuario.findAll({ attributes: ['rut_usuario'] });
            const reportes = [];
            for (const u of usuarios) {
                try {
                    const rep = await getReportePersonalMensual(u.rut_usuario, mes, anio);
                    reportes.push({ rut: u.rut_usuario, reporte: rep });
                } catch (err) {
                    reportes.push({ rut: u.rut_usuario, error: err.message });
                }
            }
            return res.json({ success: true, data: reportes });
        }

        const reporte = await getReportePersonalMensual(rut_usuario, mes, anio);

        res.json({ success: true, data: reporte });
    } catch (error) {
        console.error('❌ [REPORTES-CONTROLLER] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

// ✅ OBTENER REPORTE COMPARATIVO
export async function getReporteComparativo(req, res) {
    console.log('📊 [REPORTES-CONTROLLER] ===== GET REPORTE COMPARATIVO =====');
    
    try {
        const user = req.user;
        const rut_usuario = user?.rut_usuario || user?.rut;

        console.log('📊 Generando reporte comparativo para:', rut_usuario);

        const reporte = await getReporteComparativoService(rut_usuario);

        return res.status(200).json({
            success: true,
            data: reporte
        });

    } catch (error) {
        console.error('❌ [REPORTES-CONTROLLER] Error comparativo:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error generando reporte comparativo',
            details: error.message
        });
    }
}

// ✅ OBTENER ESTADÍSTICAS ANUALES
export async function getEstadisticasAnuales(req, res) {
    console.log('📊 [REPORTES-CONTROLLER] ===== GET ESTADÍSTICAS ANUALES =====');
    
    try {
        const user = req.user;
        const rut_usuario = user?.rut_usuario || user?.rut;
        
        const { anio } = req.query;
        const anioActual = new Date().getFullYear();
        const anioConsulta = anio ? parseInt(anio) : anioActual;

        console.log('📊 Generando estadísticas anuales:', { rut_usuario, anio: anioConsulta });

        const estadisticas = await getEstadisticasAnualesService(rut_usuario, anioConsulta);

        return res.status(200).json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('❌ [REPORTES-CONTROLLER] Error anual:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error generando estadísticas anuales',
            details: error.message
        });
    }
}

console.log('📊 [REPORTES-CONTROLLER] ✅ Controlador de reportes cargado');