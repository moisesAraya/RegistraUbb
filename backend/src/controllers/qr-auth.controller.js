"use strict";
// filepath: c:\Users\holak\OneDrive\Escritorio\Proyectos\registraubb\RegistraUbb\backend\src\controllers\qr-auth.controller.js
import {
  validateEncryptedRutService,
  validateUserPINService,
  unlockAccountService
} from "../services/qr-auth.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

// Validar hash encriptado del RUT (tótem escanea QR)
export async function validateEncryptedRut(req, res) {
  try {
    const { encryptedHash } = req.body;

    console.log('=== VALIDATE ENCRYPTED RUT ===');
    console.log('Hash recibido desde QR:', encryptedHash);

    const [result, error] = await validateEncryptedRutService(encryptedHash);

    if (error) {
      if (error.includes('bloqueada')) {
        return handleErrorClient(res, 423, error);
      }
      if (error.includes('no registrado') || error.includes('no encontrado')) {
        return handleErrorClient(res, 404, error);
      }
      return handleErrorClient(res, 400, error);
    }

    console.log('Usuario encontrado:', result.user.nombres, result.user.apellidos);
    handleSuccess(res, 200, "Usuario encontrado. Ingrese su PIN de 4 dígitos", result);

  } catch (error) {
    console.error('Error validando hash encriptado:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Validar PIN del usuario (tótem valida PIN)
export async function validateUserPIN(req, res) {
  try {
    const { tempToken, pin } = req.body;

    console.log('=== VALIDATE PIN ===');
    console.log('PIN recibido:', pin);

    const [result, error] = await validateUserPINService(tempToken, pin);

    if (error) {
      if (error.includes('bloqueada') || error.includes('bloqueado')) {
        return handleErrorClient(res, 423, error);
      }
      if (error.includes('incorrecto')) {
        return handleErrorClient(res, 401, error);
      }
      if (error.includes('expirada')) {
        return handleErrorClient(res, 401, error);
      }
      return handleErrorClient(res, 400, error);
    }

    console.log('PIN correcto. Registro exitoso para:', result.user.rut_usuario);
    handleSuccess(res, 200, "Registro de asistencia exitoso", result);

  } catch (error) {
    console.error('Error validando PIN:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Desbloquear cuenta propia desde la aplicación
export async function unlockMyAccount(req, res) {
  try {
    // El usuario desbloquea su propia cuenta
    const rut_usuario = req.user?.rut_usuario;

    console.log('=== UNLOCK MY ACCOUNT ===');
    console.log('RUT a desbloquear:', rut_usuario);

    if (!rut_usuario) {
      return handleErrorClient(res, 401, "Usuario no autenticado");
    }

    const [result, error] = await unlockAccountService(rut_usuario);

    if (error) {
      return handleErrorClient(res, 404, error);
    }

    console.log('Cuenta desbloqueada desde la aplicación:', rut_usuario);
    handleSuccess(res, 200, "Tu cuenta ha sido desbloqueada exitosamente", result);

  } catch (error) {
    console.error('Error desbloqueando cuenta propia:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}