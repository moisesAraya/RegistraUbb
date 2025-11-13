import { Router } from "express";
import { uploadMiddleware, uploadProfilePictureController, changePasswordController } from "../controllers/profile.controller.js";
import { authenticateToken } from "../middlewares/authentication.middleware.js";

const router = Router();

router.post("/upload/:rut_usuario", uploadMiddleware, uploadProfilePictureController);
router.post("/change-password", authenticateToken, changePasswordController);

export default router;
