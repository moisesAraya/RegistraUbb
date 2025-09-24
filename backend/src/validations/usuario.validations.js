"use strict";
import Joi from "joi";

// Validación para crear usuario (incluye rut_usuario)
export const userBodyValidation = Joi.object({
  rut_usuario: Joi.string().required().pattern(/^[0-9]+-[0-9kK]{1}$/).messages({
    "string.empty": "El RUT del usuario no puede estar vacío.",
    "any.required": "El RUT del usuario es obligatorio.",
    "string.pattern.base": "El RUT debe tener el formato correcto (ejemplo: 12345678-9)",
  }),
  nombres: Joi.string().required().messages({
    "string.empty": "El nombre no puede estar vacío.",
    "any.required": "El nombre es obligatorio.",
  }),
  apellidos: Joi.string().required().messages({
    "string.empty": "Los apellidos no pueden estar vacíos.",
    "any.required": "Los apellidos son obligatorios.",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "El email debe tener un formato válido.",
    "any.required": "El email es obligatorio.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "La contraseña debe tener al menos 6 caracteres.",
    "any.required": "La contraseña es obligatoria.",
  }),
  horas_atrabajar: Joi.number().integer().min(1).max(44).required().messages({
    "number.min": "Las horas deben ser al menos 1.",
    "number.max": "Las horas no pueden ser más de 44.",
    "any.required": "Las horas a trabajar son obligatorias.",
  }),
  id_rol: Joi.number().integer().required().messages({
    "any.required": "El rol es obligatorio.",
  }),
  id_cargo: Joi.number().integer().required().messages({
    "any.required": "El cargo es obligatorio.",
  }),
});

// Validación para actualizar usuario (SIN rut_usuario y campos opcionales)
export const userUpdateValidation = Joi.object({
  nombres: Joi.string().optional().messages({
    "string.empty": "El nombre no puede estar vacío.",
  }),
  apellidos: Joi.string().optional().messages({
    "string.empty": "Los apellidos no pueden estar vacíos.",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "El email debe tener un formato válido.",
  }),
  password: Joi.string().min(6).optional().messages({
    "string.min": "La contraseña debe tener al menos 6 caracteres.",
  }),
  horas_atrabajar: Joi.number().integer().min(1).max(44).optional().messages({
    "number.min": "Las horas deben ser al menos 1.",
    "number.max": "Las horas no pueden ser más de 44.",
  }),
  id_rol: Joi.number().integer().optional(),
  id_cargo: Joi.number().integer().optional(),
}).unknown(false); // ⭐ Esto rechaza campos no definidos