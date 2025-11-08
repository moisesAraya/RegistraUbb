"use strict";
// filepath: backend/src/utils/rut.utils.js

/**
 * Normaliza un RUT eliminando puntos y espacios, dejando solo números y guión
 * @param {string} rut - RUT en cualquier formato
 * @returns {string} - RUT normalizado (ej: "12345678-9")
 */
export function normalizeRut(rut) {
  if (!rut) return '';
  
  // Eliminar puntos, espacios y convertir a string
  let normalized = String(rut).replace(/\./g, '').replace(/\s+/g, '').trim();
  
  // Si no tiene guión, agregarlo antes del último dígito
  if (!normalized.includes('-') && normalized.length >= 2) {
    const body = normalized.slice(0, -1);
    const dv = normalized.slice(-1);
    normalized = `${body}-${dv}`;
  }
  
  // Convertir K minúscula a mayúscula
  normalized = normalized.toUpperCase();
  
  return normalized;
}

/**
 * Valida si un RUT tiene el formato correcto después de normalizar
 * @param {string} rut - RUT normalizado
 * @returns {boolean} - true si es válido
 */
export function validateRutFormat(rut) {
  const rutPattern = /^\d{7,8}-[\dK]$/;
  return rutPattern.test(rut);
}

/**
 * Procesa un RUT: lo normaliza y valida
 * @param {string} rut - RUT en cualquier formato
 * @returns {Object} - {normalized: string, isValid: boolean}
 */
export function processRut(rut) {
  const normalized = normalizeRut(rut);
  const isValid = validateRutFormat(normalized);
  
  return {
    normalized,
    isValid
  };
}