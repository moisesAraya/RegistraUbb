"use strict";

import { Router } from 'express';
import { authenticateToken } from '../middlewares/authentication.middleware.js';
const router = Router();

console.log('📊 [DASHBOARD-ROUTES] Configurando rutas...');

// ✅ RUTA BASIC-STATS - LA QUE ESTÁ FALTANDO
router.get('/basic-stats', authenticateToken, async (req, res) => {
    console.log('📊 [DASHBOARD] basic-stats llamada para:', req.user?.rut_usuario);
    
    try {
        // Importar dinámicamente el servicio
        const { getCompleteMetrics } = await import('../services/dashboard.service.js');
        
        const rut_usuario = req.user?.rut_usuario;
        if (!rut_usuario) {
            return res.status(400).json({
                success: false,
                error: 'RUT de usuario no encontrado'
            });
        }

        const metrics = await getCompleteMetrics(rut_usuario);
        
        return res.status(200).json({
            success: true,
            data: metrics
        });

    } catch (error) {
        console.error('❌ [DASHBOARD] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas',
            details: error.message
        });
    }
});

// ✅ RUTA REALTIME
router.get('/realtime', authenticateToken, async (req, res) => {
    console.log('📊 [DASHBOARD] realtime llamada');
    
    try {
        const { getRealTimeData } = await import('../services/dashboard.service.js');
        
        const rut_usuario = req.user?.rut_usuario;
        const realTimeData = await getRealTimeData(rut_usuario);
        
        return res.status(200).json({
            success: true,
            data: realTimeData
        });

    } catch (error) {
        console.error('❌ [DASHBOARD] Error realtime:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error obteniendo datos en tiempo real'
        });
    }
});

// ✅ RUTA DE PRUEBA SIN AUTH
router.get('/test', (req, res) => {
    console.log('📊 [DASHBOARD] Test OK');
    res.json({
        success: true,
        message: 'Dashboard routes funcionando',
        available_endpoints: [
            '/api/dashboard/basic-stats',
            '/api/dashboard/realtime',
            '/api/dashboard/test'
        ]
    });
});

export default router;
console.log('✅ [DASHBOARD-ROUTES] Rutas configuradas correctamente');