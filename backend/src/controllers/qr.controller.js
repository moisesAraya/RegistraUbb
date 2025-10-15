"use strict";
// filepath: backend/src/controllers/qr.controller.js
import { 
  generateEncryptedRutService, 
  invalidateUserQRService,
  getUserQRCodesService 
} from "../services/qr.service.js";
import { 
  handleSuccess, 
  handleErrorClient, 
  handleErrorServer 
} from "../handlers/responseHandlers.js"; // ← Usar tus handlers existentes

export async function generateMyQR(req, res) {
  try {
    console.log('=== GENERATE MY QR CONTROLLER ===');
    
    // El RUT viene del token JWT decodificado por el middleware
    const { rut_usuario } = req.user;
    
    console.log('Generando QR para usuario:', rut_usuario);
    console.log('Usuario completo del token:', req.user);
    
    const [qrData, error] = await generateEncryptedRutService(rut_usuario);
    
    if (error) {
      console.log('Error generando QR:', error);
      return handleErrorClient(res, 400, error);
    }
    
    console.log('✅ QR generado exitosamente para:', rut_usuario);
    
    return handleSuccess(res, 200, "Tu código QR ha sido generado exitosamente", {
      user: {
        rut_usuario: qrData.rut_usuario,
        nombres: qrData.nombres,
        apellidos: qrData.apellidos,
        email: qrData.email
      },
      qrData: qrData.encryptedHash,
      permanent: qrData.permanent,
      activo: qrData.activo,
      fecha_creacion: qrData.fecha_creacion,
      message: qrData.message
    });
    
  } catch (error) {
    console.error('Error en generateMyQR controller:', error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

export async function invalidateMyQR(req, res) {
  try {
    console.log('=== INVALIDATE MY QR CONTROLLER ===');
    
    const { rut_usuario } = req.user;
    
    console.log('Invalidando QR para usuario:', rut_usuario);
    
    const [result, error] = await invalidateUserQRService(rut_usuario);
    
    if (error) {
      console.log('Error invalidando QR:', error);
      return handleErrorClient(res, 400, error);
    }
    
    console.log('✅ QR invalidado exitosamente para:', rut_usuario);
    
    return handleSuccess(res, 200, "Tu código QR ha sido invalidado exitosamente", {
      user: {
        rut_usuario: result.rut_usuario,
        nombres: result.nombres,
        apellidos: result.apellidos
      },
      invalidated_count: result.invalidated_count,
      message: result.message
    });
    
  } catch (error) {
    console.error('Error en invalidateMyQR controller:', error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

export async function getMyQRCodes(req, res) {
  try {
    console.log('=== GET MY QR CODES CONTROLLER ===');
    
    const { rut_usuario } = req.user;
    
    console.log('Obteniendo QR codes para usuario:', rut_usuario);
    
    const [qrCodes, error] = await getUserQRCodesService(rut_usuario);
    
    if (error) {
      console.log('Error obteniendo QR codes:', error);
      return handleErrorClient(res, 400, error);
    }
    
    console.log(`✅ ${qrCodes.length} QR codes encontrados para:`, rut_usuario);
    
    return handleSuccess(res, 200, "QR codes obtenidos exitosamente", {
      qr_codes: qrCodes,
      total: qrCodes.length
    });
    
  } catch (error) {
    console.error('Error en getMyQRCodes controller:', error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}
