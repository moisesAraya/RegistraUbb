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
router.get("/buscar", getUserController);
router.post("/", createUserController);
router.put("/:id_usuario", updateUserController);
router.delete("/:id_usuario", deleteUserController);

export default router;