import express from 'express';
import userRoutes from './routes/usuario.routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("API RegistraUBB funcionando");
});

export default app;