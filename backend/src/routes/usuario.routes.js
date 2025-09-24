"use strict";
import { Router } from "express";
import {
  getUserController,
  getUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
} from "../controllers/usuario.controller.js";

const router = Router();
router.get("/", getUsersController);
router.get("/search", getUserController);
router.post("/", createUserController);
router.put("/:rut_usuario", updateUserController);
router.delete("/:rut_usuario", deleteUserController);

export default router;