"use strict";
import Joi from "joi";
import { processRut } from "../utils/rut.utils.js";

// Validador personalizado para RUT
const rutValidator = (value, helpers) => {
  const { normalized, isValid } = processRut(value);
  
  if (!isValid) {
    return helpers.error('rut.invalid');
  }
  
  // Devolver el RUT normalizado para que se use en el resto del proceso
  return normalized;
};

// Validación para login con RUT (acepta cualquier formato)
export const loginValidation = Joi.object({
  rut_usuario: Joi.string()
    .required()
    .custom(rutValidator, 'Validación de RUT')
    .messages({
      "rut.invalid": "El RUT debe tener un formato válido (ej: 12345678-9 o 12.345.678-9)",
      "any.required": "El RUT es obligatorio"
    }),
  password: Joi.string()
    .min(4)
    .required()
    .messages({
      "string.min": "La contraseña debe tener al menos 4 caracteres",
      "any.required": "La contraseña es obligatoria"
    })
});

// Validación para registro
export const registerValidation = Joi.object({
  rut_usuario: Joi.string()
    .required()
    .custom(rutValidator, 'Validación de RUT')
    .messages({
      "rut.invalid": "El RUT debe tener un formato válido (ej: 12345678-9 o 12.345.678-9)",
      "any.required": "El RUT es obligatorio"
    }),
  nombres: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.min": "Los nombres deben tener al menos 2 caracteres",
      "string.max": "Los nombres no pueden exceder 50 caracteres",
      "any.required": "Los nombres son obligatorios"
    }),
  apellidos: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.min": "Los apellidos deben tener al menos 2 caracteres", 
      "string.max": "Los apellidos no pueden exceder 50 caracteres",
      "any.required": "Los apellidos son obligatorios"
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Debe ser un email válido",
      "any.required": "El email es obligatorio"
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "La contraseña debe tener al menos 6 caracteres",
      "any.required": "La contraseña es obligatoria"
    }),
  pin: Joi.number()
    .integer()
    .min(1000)
    .max(9999)
    .required()
    .messages({
      "number.base": "El PIN debe ser numérico",
      "number.min": "El PIN debe ser de 4 dígitos",
      "number.max": "El PIN debe ser de 4 dígitos",
      "any.required": "El PIN es obligatorio"
    }),
  horas_atrabajar: Joi.number()
    .positive()
    .required()
    .messages({
      "number.positive": "Las horas a trabajar deben ser positivas",
      "any.required": "Las horas a trabajar son obligatorias"
    }),
  id_rol: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.integer": "El rol debe ser un número entero",
      "number.positive": "El rol debe ser positivo",
      "any.required": "El rol es obligatorio"
    }),
  id_cargo: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.integer": "El cargo debe ser un número entero",
      "number.positive": "El cargo debe ser positivo", 
      "any.required": "El cargo es obligatorio"
    })
});