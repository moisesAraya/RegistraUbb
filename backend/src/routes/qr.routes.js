"use strict";
import { Router } from "express";
import { generar } from "../controllers/qr.controller.js";

const router = Router();

// Define la ruta para generar un QR
router.post('/generar', generar);

export default router;
