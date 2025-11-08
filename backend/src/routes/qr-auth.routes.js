"use strict";
import { Router } from "express";
import {
  validateEncryptedRut,
  validateUserPIN,
  previewQRUser
} from "../controllers/qr-auth.controller.js";

const router = Router();

// Rutas para el tótem/kiosco de registro
router.post("/validate-qr", validateEncryptedRut);     // Validar QR y obtener tempToken
router.post("/validate-pin", validateUserPIN);         // Validar PIN y completar registro
router.post("/preview-qr", previewQRUser);            // Vista previa del usuario (opcional)

export default router;