"use strict";

import express from 'express';
import { authenticateToken } from '../middlewares/authentication.middleware.js';
import { getReporteMensual, getReporteComparativo, getEstadisticasAnuales } from '../controllers/reportes.controller.js';

const router = express.Router();

// ✅ RUTAS DE REPORTES
router.get('/mensual', authenticateToken, getReporteMensual);
router.get('/comparativo', authenticateToken, getReporteComparativo);
router.get('/anual', authenticateToken, getEstadisticasAnuales);

// ✅ RUTA DE PRUEBA
router.get('/test', (req, res) => {
    console.log('📊 [REPORTES-ROUTES] Test OK');
    res.json({
        success: true,
        message: 'Reportes API funcionando',
        user: req.user?.rut_usuario || 'no-auth',


        

        timestamp: new Date().toISOString()
    });
});

console.log('Handlers:', { getReporteMensual, getReporteComparativo, getEstadisticasAnuales });

export default router;