import { Router } from "express";
import {
  uploadMiddleware,
  uploadProfilePictureController,
  changePasswordController,
  getProfilePhotoUrlController,
  changePinController,
} from "../controllers/profile.controller.js";
import { authenticateToken } from "../middlewares/authentication.middleware.js";

const router = Router();

router.post("/upload/:rut_usuario", uploadMiddleware, uploadProfilePictureController);
router.post("/change-password", authenticateToken, changePasswordController);
router.post("/change-pin", authenticateToken, changePinController);
router.get("/foto-perfil-url/:rut_usuario", getProfilePhotoUrlController);

export default router;
