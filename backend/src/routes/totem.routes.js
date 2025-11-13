"use strict";

import { Router } from 'express';
import { 
    getTotems, 
    getTotem, 
    createTotemController, 
    updateTotemController, 
    deleteTotemController,
    getTotemStatistics 
} from '../controllers/totem.controller.js';
import { authenticateToken } from '../middlewares/authentication.middleware.js';

const router = Router();

console.log('🏢 [TOTEM-ROUTES] ✅ Configurando rutas de totems');

// ✅ RUTAS PÚBLICAS (con autenticación básica)
router.get('/', authenticateToken, getTotems);           // GET /api/totems
router.get('/stats', authenticateToken, getTotemStatistics); // GET /api/totems/stats
router.get('/:id', authenticateToken, getTotem);         // GET /api/totems/:id

// ✅ RUTAS ADMINISTRATIVAS (requieren permisos especiales)
router.post('/', authenticateToken, createTotemController);     // POST /api/totems
router.put('/:id', authenticateToken, updateTotemController);   // PUT /api/totems/:id
router.delete('/:id', authenticateToken, deleteTotemController); // DELETE /api/totems/:id

console.log('✅ [TOTEM-ROUTES] Rutas configuradas:');
console.log('   📋 GET    /api/totems           - Listar todos los totems (con búsqueda)');
console.log('   📊 GET    /api/totems/stats     - Estadísticas de totems (admin)');
console.log('   🔍 GET    /api/totems/:id       - Obtener totem por ID');
console.log('   ➕ POST   /api/totems           - Crear nuevo totem (admin)');
console.log('   ✏️ PUT    /api/totems/:id       - Actualizar totem (admin)');
console.log('   🗑️ DELETE /api/totems/:id       - Eliminar totem (admin)');

export default router;