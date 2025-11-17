"use strict";

import express from 'express';
import { authorizationMiddleware } from '../middlewares/autorization.middleware.js';
import {
    getAsistenciaController,
    getEstadisticasAsistenciaController,
    solicitarJustificacionController,
    getJustificacionesController,
    marcar,
    createManualEntryController,
    getMarcajeAbiertoController,
    agregarSalidaController
} from '../controllers/asistencia.controller.js';

const router = express.Router();

console.log('🚀 [ASISTENCIA-ROUTES] Inicializando rutas de asistencia...');

// ✅ Aplicar middleware de autenticación a todas las rutas
// TEMPORALMENTE COMENTADO PARA DEBUG
// router.use(authorizationMiddleware);

// 📅 Rutas de asistencia - ORDEN ESPECÍFICO PRIMERO
router.get('/estadisticas', authorizationMiddleware, getEstadisticasAsistenciaController);
router.get('/justificaciones', authorizationMiddleware, getJustificacionesController);
router.get('/marcaje-abierto/:rut_usuario', authorizationMiddleware, getMarcajeAbiertoController);

// 📝 Rutas POST
router.post('/justificacion', authorizationMiddleware, solicitarJustificacionController);
router.post('/marcar', authorizationMiddleware, marcar);
// Ingreso manual sin aprobación
router.post('/manual', authorizationMiddleware, createManualEntryController);

// 🔄 Rutas PATCH
router.patch('/agregar-salida', authorizationMiddleware, agregarSalidaController);

// 📅 Ruta general AL FINAL (para evitar conflictos)
router.get('/', authorizationMiddleware, getAsistenciaController);

console.log('✅ [ASISTENCIA-ROUTES] Rutas configuradas:');
console.log('   📊 GET /asistencia/estadisticas');
console.log('   📋 GET /asistencia/justificaciones');
console.log('   🔓 GET /asistencia/marcaje-abierto/:rut_usuario');
console.log('   📝 POST /asistencia/justificacion');
console.log('   🏷️ POST /asistencia/marcar');
console.log('   🔄 PATCH /asistencia/agregar-salida');
console.log('   📅 GET /asistencia/');

console.log('🛣️ [ASISTENCIA-ROUTES] ✅ RUTAS DE ASISTENCIA LISTAS ✅');

export default router;