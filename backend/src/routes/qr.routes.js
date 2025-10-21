"use strict";
// filepath: backend/src/routes/qr.routes.js
import { Router } from "express";
import { 
  generateMyQR, 
  invalidateMyQR,
  getMyQRCodes 
} from "../controllers/qr.controller.js";
import { authenticateToken } from "../middlewares/authentication.middleware.js";

console.log('🔧 Inicializando rutas QR...');

const router = Router();

// ✅ RUTA DE PRUEBA SIN AUTENTICACIÓN
router.get("/test", (req, res) => {
  console.log('🧪 Ruta de prueba QR llamada');
  res.json({
    success: true,
    message: "Rutas QR funcionando",
    timestamp: new Date().toISOString()
  });
});

// ✅ RUTAS PRINCIPALES CON LOGS
router.get("/generate-my-qr", (req, res, next) => {
  console.log('📡 → GET /api/qr/generate-my-qr');
  next();
}, authenticateToken, generateMyQR);

router.delete("/invalidate-my-qr", (req, res, next) => {
  console.log('📡 → DELETE /api/qr/invalidate-my-qr');
  next();
}, authenticateToken, invalidateMyQR);

router.get("/my-qr-codes", (req, res, next) => {
  console.log('📡 → GET /api/qr/my-qr-codes');
  next();
}, authenticateToken, getMyQRCodes);

console.log('✅ Rutas QR configuradas:');
console.log('   📍 GET /test');
console.log('   📍 GET /generate-my-qr');
console.log('   📍 DELETE /invalidate-my-qr');
console.log('   📍 GET /my-qr-codes');

export default router;
