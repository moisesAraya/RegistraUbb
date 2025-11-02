import { Router } from "express";
import { uploadMiddleware, uploadProfilePictureController } from "../controllers/profile.controller.js";

const router = Router();

router.post("/upload/:rut_usuario", uploadMiddleware, uploadProfilePictureController);

export default router;
