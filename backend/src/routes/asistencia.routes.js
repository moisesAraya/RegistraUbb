"use strict";
import { Router } from 'express';
import { marcar } from '../controllers/asistencia.controller.js';

const router = Router();

router.post('/', marcar);

export default router;