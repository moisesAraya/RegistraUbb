"use strict";

import express from 'express';
import { authorizationMiddleware } from '../middlewares/autorization.middleware.js';
import {
    getFotoPerfilUrl,
    getLogoUrl,
    getMinioStatus
} from '../controllers/minio.controller.js';

const router = express.Router();

console.log('🪣 [MINIO-ROUTES] Inicializando rutas de MinIO...');

// 📸 Foto de perfil (requiere autenticación)
router.get('/foto-perfil-url/:rut_usuario', authorizationMiddleware, getFotoPerfilUrl);

// 🎨 Logo (público, no requiere autenticación)
router.get('/logo-url', getLogoUrl);

// 🔍 Estado de MinIO (público)
router.get('/status', getMinioStatus);

console.log('✅ [MINIO-ROUTES] Rutas configuradas:');
console.log('   📸 GET /minio/foto-perfil-url/:rut_usuario');
console.log('   🎨 GET /minio/logo-url?bucket=X&filename=Y');
console.log('   🔍 GET /minio/status');

export default router;