"use strict";

import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

// ✅ IMPORTAR SEQUELIZE DESDE CONFIG
import { sequelize } from "./config/dbconfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

console.log("🚀 [APP] Iniciando aplicación...");

// ✅ CONFIGURACIÓN BÁSICA
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ LOGGING MIDDLEWARE
app.use((req, res, next) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ✅ VERIFICAR CONEXIÓN A LA BASE DE DATOS
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: "Conexión a PostgreSQL exitosa",
      database: sequelize.config.database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error conexión DB:", error);
    res.status(500).json({
      success: false,
      error: "Error de conexión a base de datos",
      message: error.message,
    });
  }
});

console.log("🔧 Cargando rutas...");

try {
  // ✅ 1. AUTH ROUTES
  try {
    console.log("🔑 Cargando Auth routes...");
    const authRoutes = await import("./routes/auth.routes.js");
    app.use("/api/auth", authRoutes.default);
    console.log("✅ Auth routes cargadas");
  } catch (authError) {
    console.log("⚠️ Auth routes no disponibles:", authError.message);
  }

  // ✅ 2. QR ROUTES
  try {
    console.log("🔲 Cargando QR routes...");
    const qrRoutes = await import("./routes/qr.routes.js");
    app.use("/api/qr", qrRoutes.default);
    console.log("✅ QR routes cargadas");
  } catch (qrError) {
    console.log("⚠️ QR routes no disponibles:", qrError.message);
  }

  // ✅ 3. DASHBOARD ROUTES
  try {
    console.log("📊 Cargando Dashboard routes...");
    const dashboardRoutes = await import("./routes/dashboard.routes.js");
    app.use("/api/dashboard", dashboardRoutes.default);
    console.log("✅ Dashboard routes cargadas");
  } catch (dashboardError) {
    console.log("⚠️ Dashboard routes no disponibles:", dashboardError.message);
  }

  // ✅ 4. ASISTENCIA ROUTES
  try {
    console.log("📅 Cargando Asistencia routes...");
    const asistenciaRoutes = await import("./routes/asistencia.routes.js");
    app.use("/api/asistencia", asistenciaRoutes.default);
    console.log("✅ Asistencia routes cargadas");
  } catch (asistenciaError) {
    console.log(
      "⚠️ Asistencia routes no disponibles:",
      asistenciaError.message
    );
  }

  // ✅ 5. USUARIO ROUTES
  try {
    console.log("👤 Cargando Usuario routes...");
    const usuarioRoutes = await import("./routes/usuario.routes.js");
    app.use("/api/usuario", usuarioRoutes.default);
    console.log("✅ Usuario routes cargadas");
  } catch (usuarioError) {
    console.log("⚠️ Usuario routes no disponibles:", usuarioError.message);
  }

  // ✅ 6. APPROVAL ROUTES
  try {
    console.log("✅ Cargando Approval routes...");
    const approvalRoutes = await import("./routes/approval.routes.js");
    app.use("/api/approvals", approvalRoutes.default);
    console.log("✅ Approval routes cargadas");
  } catch (approvalError) {
    console.log("⚠️ Approval routes no disponibles:", approvalError.message);
  }

  // ✅ 7. REPORTES ROUTES - ENVOLVER EN TRY-CATCH
  try {
    console.log("📊 Cargando Reportes routes...");
    const reportesRoutes = await import("./routes/reportes.routes.js");
    app.use("/api/reportes", reportesRoutes.default);
    console.log("✅ Reportes routes cargadas");
  } catch (reportesError) {
    console.error("❌ Error detallado Reportes routes:", reportesError);
    console.log("⚠️ Reportes routes no disponibles:", reportesError.message);
  }

  // ✅ 8. JUSTIFICACIONES ROUTES
  try {
    console.log("📝 Cargando Justificaciones routes...");
    const justificacionesRoutes = await import(
      "./routes/justificaciones.routes.js"
    );
    app.use("/api/justificaciones", justificacionesRoutes.default);
    console.log("✅ Justificaciones routes cargadas");
  } catch (justificacionesError) {
    console.error("❌ Error detallado Justificaciones routes:", justificacionesError);
    console.log(
      "⚠️ Justificaciones routes no disponibles:",
      justificacionesError.message
    );
  }

} catch (error) {
  console.error("❌ Error crítico cargando rutas:", error);
  console.error("❌ Stack trace:", error.stack);
}

const initializeDatabase = async () => {
  try {
    console.log("🔧 Verificando conexión a PostgreSQL...");
    await sequelize.authenticate();
    console.log("✅ Conexión a PostgreSQL establecida");

    console.log("🔧 Sincronizando modelos...");
    await sequelize.sync({ alter: false });
    console.log("✅ Modelos sincronizados correctamente");
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    console.log("⚠️ Continuando sin base de datos...");
  }
};

// ✅ MANEJO DE ERRORES
app.use((error, req, res, next) => {
  console.error("❌ Error no manejado:", error);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    message: error.message,
  });
});

// ✅ RUTA 404
app.use((req, res) => {
  console.log("❌ 404 para:", req.originalUrl);
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    path: req.originalUrl,
    availableRoutes: [
      "GET /api/health",
      "POST /api/auth/login",
      "GET /api/qr/*",
      "GET /api/dashboard/*",
      "GET /api/asistencia/*",
      "GET /api/reportes/*",
      "GET /api/justificaciones/*",
      "GET /api/usuario/*",
      "GET /api/approval/*",
    ],
  });
});

// ✅ INICIALIZAR AL EXPORTAR
initializeDatabase();

export default app;

console.log("🚀 [APP] ✅ Aplicación configurada correctamente");
