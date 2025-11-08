"use strict";
// filepath: backend/src/app.js
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/usuario.routes.js';
import authRoutes from './routes/auth.routes.js';
import qrRoutes from './routes/qr.routes.js';
import attendanceRoutes from './routes/asistencia.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import qrAuthRoutes from './routes/qr-auth.routes.js';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000','http://146.83.194.142:1772'], // Permitir el frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON y datos codificados en URL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🔧 Registrando rutas QR...');

// ✅ REGISTRAR LAS RUTAS QR
app.use('/api/qr', qrRoutes);
app.use('/api/qr-auth', qrAuthRoutes);

console.log('✅ Rutas QR registradas: /api/qr y /api/qr-auth');

// Rutas de la API
app.use("/api/usuario", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/approvals", approvalRoutes);
app.use('/api/asistencia', attendanceRoutes);
app.use("/api/roles", userRoutes);
app.use("/api/cargos", userRoutes);

// Ruta estática para servir archivos QR (si decides usarla en el futuro)
app.use('/qrs', express.static(path.join(__dirname, '../public/qrs')));

// Ruta principal para verificar que la API está funcionando
app.get("/", (req, res) => {
  res.send("API RegistraUBB funcionando");
});

// ✅ AGREGAR RUTA DE PRUEBA DIRECTA EN APP.JS
app.get('/api/test', (req, res) => {
  console.log('🧪 Ruta de prueba /api/test llamada');
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    routes: ['GET /api/qr/test', 'GET /api/qr/my-qr-codes', 'GET /api/qr/generate-my-qr'],
    timestamp: new Date().toISOString()
  });
});

export default app;