"use strict";
// filepath: backend/src/routes/qr.routes.js
import { Router } from "express";
import { 
  generar, 
  generateMyQR, 
  generateQRForUser,
  invalidateMyQR,
  invalidateQRForUser
} from "../controllers/qr.controller.js";
import { authenticateJwtWithTokenService } from "../middlewares/authentication.middleware.js";

const router = Router();

// Rutas para generar QR
router.get("/generate-my-qr", authenticateJwtWithTokenService, generateMyQR);
router.get("/generate-for-user/:rut_usuario", authenticateJwtWithTokenService, generateQRForUser);

// Rutas para invalidar QR (por ahora solo log)
router.delete("/invalidate-my-qr", authenticateJwtWithTokenService, invalidateMyQR);
router.delete("/invalidate-qr/:rut_usuario", authenticateJwtWithTokenService, invalidateQRForUser);

// Ruta original
router.post("/generar", generar);

export default router;
