"use strict";
import express from "express";
import {
  getUserController,
  getUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  getRolesController,
  getCargosController
} from "../controllers/usuario.controller.js";

const router = express.Router();

// Rutas de usuarios
router.get("/", getUsersController);        // Obtener todos los usuarios
router.get("/search", getUserController);   // Buscar usuario específico
router.get("/roles", getRolesController);   // Obtener roles
router.get("/cargos", getCargosController); // Obtener cargos
router.post("/", createUserController);     // Crear usuario
router.put("/:rut_usuario", updateUserController);    // Actualizar usuario
router.delete("/:rut_usuario", deleteUserController); // Eliminar usuario

export default router;