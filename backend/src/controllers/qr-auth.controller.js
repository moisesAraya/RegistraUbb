"use strict";
// filepath: backend/src/controllers/qr-auth.controller.js
import { 
  validateQRCodeService, 
  validateUserPINService 
} from "../services/qr-auth.service.js";
import { 
  handleSuccess, 
  handleErrorClient, 
  handleErrorServer 
} from "../handlers/responseHandlers.js";

/**
 * Valida un código QR encriptado (hash)
 * POST /api/qr-auth/validate-qr
 */
export async function validateEncryptedRut(req, res) {
  try {
    console.log('=== VALIDATE ENCRYPTED RUT CONTROLLER ===');
    
    const { encryptedHash } = req.body;
    
    if (!encryptedHash) {
      return handleErrorClient(res, 400, "Hash encriptado requerido");
    }
    
    console.log('Validando QR hash:', encryptedHash.substring(0, 20) + '...');
    
    const [result, error] = await validateQRCodeService(encryptedHash);
    
    if (error) {
      console.log('❌ Error validando QR:', error);
      return handleErrorClient(res, 400, error);
    }
    
    console.log('✅ QR válido para usuario:', result.user.rut_usuario);
    
    return handleSuccess(res, 200, result.message, {
      user: result.user,
      qr_info: result.qr_info,
      tempToken: result.tempToken,
      step: 'pin_required'
    });
    
  } catch (error) {
    console.error('Error en validateEncryptedRut controller:', error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

/**
 * Valida el PIN del usuario y completa el registro
 * POST /api/qr-auth/validate-pin
 */
export async function validateUserPIN(req, res) {
  try {
    console.log('=== VALIDATE USER PIN CONTROLLER ===');
    
    const { tempToken, pin } = req.body;
    
    if (!tempToken || !pin) {
      return handleErrorClient(res, 400, "Token temporal y PIN requeridos");
    }
    
    console.log('Validando PIN para token temporal...');
    
    const [result, error] = await validateUserPINService(tempToken, pin);
    
    if (error) {
      console.log('❌ Error validando PIN:', error);
      return handleErrorClient(res, 400, error);
    }
    
    console.log('✅ PIN válido, registro completado para:', result.user.rut_usuario);
    console.log('✅ Tipo de registro:', result.attendance.tipo_marcaje);
    
    return handleSuccess(res, 200, result.message, {
      user: result.user,
      attendance: result.attendance,
      qr_info: result.qr_info
    });
    
  } catch (error) {
    console.error('Error en validateUserPIN controller:', error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

/**
 * Obtiene información del usuario desde un QR sin validar PIN
 * POST /api/qr-auth/preview-qr
 */
export async function previewQRUser(req, res) {
  try {
    console.log('=== PREVIEW QR USER CONTROLLER ===');
    
    const { encryptedHash } = req.body;
    
    if (!encryptedHash) {
      return handleErrorClient(res, 400, "Hash encriptado requerido");
    }
    
    const [result, error] = await validateQRCodeService(encryptedHash);
    
    if (error) {
      return handleErrorClient(res, 400, error);
    }
    
    // Solo retornar información básica del usuario, sin tempToken
    return handleSuccess(res, 200, "Usuario encontrado", {
      user: {
        rut_usuario: result.user.rut_usuario,
        nombres: result.user.nombres,
        apellidos: result.user.apellidos,
        id_rol: result.user.id_rol,
        id_cargo: result.user.id_cargo
      }
    });
    
  } catch (error) {
    console.error('Error en previewQRUser controller:', error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}