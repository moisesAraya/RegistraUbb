"use strict";
import { Router } from "express";
import {
  login,
  register,
  logout,
  recoverPassword,
  verifyEmail,
  refreshToken,
  getTokenInfo
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);

router.get("/refresh-token", refreshToken);
router.get("/token-info", getTokenInfo);

router.post("/recover-password", recoverPassword);
router.get("/verify-email", verifyEmail);

export default router;