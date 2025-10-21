"use strict";

import express from 'express';
import {
    crearJustificacionController,
    getJustificacionesController,
    getDetalleJustificacionController,
    actualizarJustificacionController,
    cancelarJustificacionController,
    getMotivosController
} from '../controllers/justificaciones.controller.js';
import { authenticateToken } from '../middlewares/authentication.middleware.js';

const router = express.Router();

console.log('📋 [JUSTIFICACIONES-ROUTES] Configurando rutas de justificaciones...');

// ✅ TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
router.use(authenticateToken);

// ✅ RUTAS DE JUSTIFICACIONES
router.post('/', crearJustificacionController);
router.get('/', getJustificacionesController);
router.get('/motivos', getMotivosController);
router.get('/:id', getDetalleJustificacionController);
router.put('/:id', actualizarJustificacionController);
router.delete('/:id', cancelarJustificacionController);

// ✅ RUTA DE PRUEBA
router.get('/test', (req, res) => {
    console.log('📋 [JUSTIFICACIONES-ROUTES] Test OK');
    res.json({
        success: true,
        message: 'Justificaciones API funcionando',
        user: req.user?.rut_usuario || 'no-auth',
        timestamp: new Date().toISOString()
    });
});

export default router;
console.log('📋 [JUSTIFICACIONES-ROUTES] ✅ Rutas de justificaciones configuradas');