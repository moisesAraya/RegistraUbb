import { Router } from "express";
import { uploadMiddleware, uploadProfilePictureController, changePasswordController, getProfilePhotoUrlController } from "../controllers/profile.controller.js";
import { authenticateToken } from "../middlewares/authentication.middleware.js";

const router = Router();

router.post("/upload/:rut_usuario", uploadMiddleware, uploadProfilePictureController);
router.post("/change-password", authenticateToken, changePasswordController);
router.get("/foto-perfil-url/:rut_usuario", getProfilePhotoUrlController);

export default router;
