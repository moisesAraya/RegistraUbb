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
import Usuario from '../entities/usuario.entity.js';

const router = express.Router();

// Endpoint para obtener todos los usuarios (solo campos necesarios)
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['rut_usuario', 'nombres', 'apellidos']
    });
    res.json({ usuarios });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

router.get("/search", getUserController);
router.post("/", createUserController);
router.put("/:rut_usuario", updateUserController);
router.delete("/:rut_usuario", deleteUserController);
router.get("/roles", getRolesController);
router.get("/cargos", getCargosController);

export default router;