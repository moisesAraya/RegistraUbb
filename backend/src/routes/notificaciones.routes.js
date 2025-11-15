"use strict";
import { Router } from "express";
import { authenticateToken } from "../middlewares/authentication.middleware.js";

const router = Router();

console.log('🔔 Inicializando rutas de notificaciones...');

// Ruta simple que devuelve notificaciones (placeholder)
router.get("/", authenticateToken, (req, res) => {
  // En producción deberías leer estas notificaciones desde la BD
  const example = [
    { id: 1, mensaje: "Bienvenido al sistema", leida: false, fecha: new Date().toISOString() },
  ];
  res.json({ success: true, data: example });
});

console.log('✅ Rutas de notificaciones configuradas: GET /');

export default router;
