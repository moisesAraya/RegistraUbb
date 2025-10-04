"use strict";
import Joi from "joi";

Joi.defaults(schema => schema.options({
  messages: {
    'string.base': 'El campo {#label} debe ser un texto válido.',
    'string.empty': 'El campo {#label} no puede estar vacío.',
    'string.min': 'El campo {#label} debe tener al menos {#limit} caracteres.',
    'string.max': 'El campo {#label} debe tener como máximo {#limit} caracteres.',
    'string.email': 'Debe ser un email válido.',
    'string.pattern.base': 'Formato inválido en {#label}.',
    'any.required': 'El campo {#label} es obligatorio.',
    'number.base': 'El campo {#label} debe ser un número.',
    'number.integer': 'El campo {#label} debe ser un número entero.',
    'boolean.base': 'El campo {#label} debe ser verdadero o falso.',
  }
}));

// Validación de dominio de email
const domainEmailValidator = (value, helper) => {
  const allowedDomains = ["@ubiobio.cl"];
  if (!allowedDomains.some(domain => value.endsWith(domain))) {
    return helper.message(`El email electrónico debe finalizar en uno de los siguientes dominios: ${allowedDomains.join(", ")}.`);
  }
  return value;
};

// 🔐 Login
export const authValidation = Joi.object({
  rut_usuario: Joi.string()
    .min(9)
    .max(12)
    .required(),

  password: Joi.string()
    .min(5)
    .max(26)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required()
}).unknown(false);

// 📝 Registro
export const registerValidation = Joi.object({
  rut_usuario: Joi.string()
    .min(9)
    .max(12)
    .required()
    .custom((value, helper) => {
      if (!RutValidator.isValidRut(value)) {
        return helper.message(`RUT inválido: ${value}`);
      }
      return RutValidator.formatRut(value);
    }),

  nombres: Joi.string()
    .max(100)
    .required()
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),

  apellidos: Joi.string()
    .max(100)
    .required()
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),

  email: Joi.string()
    .min(10)
    .max(255)
    .email()
    .required()
    .custom(domainEmailValidator),

  password: Joi.string()
    .min(5)
    .max(26)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required(),

  horas_atrabajar: Joi.number()
    .integer()
    .min(1)
    .required(),

  id_rol: Joi.number()
    .integer()
    .required(),

  id_cargo: Joi.number()
    .integer()
    .required(),

  flag_blacklist: Joi.boolean().optional()
}).unknown(false);

// Nueva validación para el login
export const loginValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .custom(domainEmailValidator), // Si tienes validación de dominio

  password: Joi.string()
    .min(1)
    .max(26)
    .required()
}).unknown(false);