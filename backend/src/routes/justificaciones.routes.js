"use strict";

import express from 'express';
import { authorizationMiddleware } from '../middlewares/autorization.middleware.js';
import {
    crearJustificacionController,
    getJustificacionesController,
    getMotivosController,
    eliminarJustificacionController
} from '../controllers/justificaciones.controller.js';

const router = express.Router();

console.log('📋 [JUSTIFICACIONES-ROUTES] Inicializando rutas...');

// Aplicar middleware de autenticación
router.use(authorizationMiddleware);

// 🏷️ Obtener motivos disponibles
router.get('/motivos', getMotivosController);

// 📋 Obtener justificaciones del usuario
router.get('/', getJustificacionesController);

// ✅ Crear nueva justificación
router.post('/', crearJustificacionController);

// 🗑️ Eliminar justificación
router.delete('/:id', eliminarJustificacionController);

console.log('✅ [JUSTIFICACIONES-ROUTES] Rutas configuradas:');
console.log('   🏷️ GET /justificaciones/motivos');
console.log('   📋 GET /justificaciones');
console.log('   ✅ POST /justificaciones');
console.log('   🗑️ DELETE /justificaciones/:id');

export default router;