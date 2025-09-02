"use strict";
import Joi from "joi";

const domainEmailValidator = (value, helper) => {
  const allowedDomains = ["@gmail.com", "@hotmail.com", "@outlook.com", "@yahoo.com", "@gmail.cl","@gps.com"];
  
  if (!allowedDomains.some(domain => value.endsWith(domain))) {
    return helper.message(`El email electrónico debe finalizar en uno de los siguientes dominios: ${allowedDomains.join(", ")}.`);
  }
  
  return value;
};

export const userQueryValidation = Joi.object({
  id_usuario: Joi.number().integer().positive().messages({
    "number.base": "El ID debe ser un número.",
  }),
  rut: Joi.string()
    .custom((value, helper) => {
      const { valid, message, formatted } = RutValidator.validateRut(value);
      if (!valid) return helper.message(message);
      return formatted;
    }),
  email: Joi.string().email().custom(domainEmailValidator),
}).or("id_usuario", "rut", "email").messages({
  "object.missing": "Debes proporcionar al menos un parámetro: id_usuario, rut o email.",
});
export const userBodyValidation = Joi.object({
  nombre: Joi.string()
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .messages({
      "string.pattern.base": "El nombre solo puede contener letras y espacios.",
    }),
  apellidos: Joi.string()
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .messages({
      "string.pattern.base": "Los apellidos solo pueden contener letras y espacios.",
    }),
  email: Joi.string().email().custom(domainEmailValidator),
  rut: Joi.string()
    .custom((value, helper) => {
      const { valid, message, formatted } = RutValidator.validateRut(value);
      if (!valid) return helper.message(message);
      return formatted;
    }),
  password: Joi.string().min(8).max(26).pattern(/^[a-zA-Z0-9]+$/),
  newPassword: Joi.string().min(8).max(26).pattern(/^[a-zA-Z0-9]+$/),
  rol: Joi.string().valid("cliente", "fabrica", "tienda", "administrador"),
  flag_blacklist: Joi.boolean(),
}).or("nombre", "apellidos", "email", "rut", "password", "newPassword", "rol", "flag_blacklist")
  .messages({
    "object.missing": "Debes enviar al menos un campo para actualizar.",
  });