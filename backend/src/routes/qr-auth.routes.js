"use strict";
// filepath: backend/src/routes/qr-auth.routes.js
import { Router } from "express";
import {
  validateEncryptedRut,
  validateUserPIN,
  unlockMyAccount
} from "../controllers/qr-auth.controller.js";
import { authenticateJwtWithTokenService } from "../middlewares/authentication.middleware.js";

const router = Router();

// Rutas públicas (para tótem - sin autenticación)
router.post("/validate-qr", validateEncryptedRut);    // POST /api/qr-auth/validate-qr
router.post("/validate-pin", validateUserPIN);        // POST /api/qr-auth/validate-pin

// Rutas protegidas (requieren autenticación)
router.post("/unlock-account", authenticateJwtWithTokenService, unlockMyAccount); // POST /api/qr-auth/unlock-account

export default router; // ← Asegúrate de que esté esta línea