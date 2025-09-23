import express from 'express';
import userRoutes from './routes/usuario.routes.js';
import authRoutes from './routes/auth.routes.js';
import qrRoutes from './routes/qr.routes.js';
import attendanceRoutes from './routes/asistencia.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware para parsear JSON y datos codificados en URL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use('/qr', qrRoutes);
app.use('/asistencia', attendanceRoutes);

// Ruta estática para servir archivos QR (si decides usarla en el futuro)
app.use('/qrs', express.static(path.join(__dirname, '../public/qrs')));

// Ruta principal para verificar que la API está funcionando
app.get("/", (req, res) => {
  res.send("API RegistraUBB funcionando");
});

export default app;