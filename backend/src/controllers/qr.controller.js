"use strict";
// filepath: backend/src/controllers/qr.controller.js
import qrService from "../services/qr.service.js";
import { generateEncryptedRutService } from "../services/qr-auth.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

// Generar QR propio (cualquier usuario autenticado)
async function generateMyQR(req, res) {
  try {
    const rut_usuario = req.user?.rut_usuario;

    if (!rut_usuario) {
      return handleErrorClient(res, 401, "Usuario no autenticado");
    }

    console.log('=== GENERATE MY QR ===');
    console.log('RUT del usuario autenticado:', rut_usuario);

    const [result, error] = await generateEncryptedRutService(rut_usuario);

    if (error) {
      return handleErrorClient(res, 404, error);
    }

    handleSuccess(res, 200, "Tu código QR ha sido generado exitosamente", {
      user: {
        rut_usuario: result.rut_usuario,
        nombres: result.nombres,
        apellidos: result.apellidos,
        email: result.email
      },
      qrData: result.encryptedHash,
      permanent: result.permanent,
      message: result.message
    });

  } catch (error) {
    console.error('Error generando QR propio:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Generar QR para otro usuario (solo admins)
async function generateQRForUser(req, res) {
  try {
    const { rut_usuario } = req.params;
    const userRole = req.user?.id_rol;

    console.log('=== GENERATE QR FOR USER ===');
    console.log('RUT solicitado:', rut_usuario);
    console.log('Rol del solicitante:', userRole);

    if (userRole !== 1) {
      return handleErrorClient(res, 403, "No tienes permisos para generar códigos QR de otros usuarios");
    }

    const [result, error] = await generateEncryptedRutService(rut_usuario);

    if (error) {
      return handleErrorClient(res, 404, error);
    }

    handleSuccess(res, 200, "Código QR generado exitosamente", {
      user: {
        rut_usuario: result.rut_usuario,
        nombres: result.nombres,
        apellidos: result.apellidos,
        email: result.email
      },
      qrData: result.encryptedHash,
      permanent: result.permanent,
      message: result.message
    });

  } catch (error) {
    console.error('Error generando QR para usuario:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Invalidar QR propio (función simplificada)
async function invalidateMyQR(req, res) {
  try {
    const rut_usuario = req.user?.rut_usuario;

    if (!rut_usuario) {
      return handleErrorClient(res, 401, "Usuario no autenticado");
    }

    console.log('=== INVALIDATE MY QR ===');
    console.log('QR invalidado para RUT:', rut_usuario);

    // Por ahora solo confirmación, en el futuro podrías usar BD
    handleSuccess(res, 200, "Tu código QR ha sido invalidado exitosamente", {
      rut_usuario: rut_usuario,
      message: "Código QR invalidado. Genere uno nuevo cuando lo necesite."
    });

  } catch (error) {
    console.error('Error invalidando QR propio:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Invalidar QR para otro usuario (solo admins)
async function invalidateQRForUser(req, res) {
  try {
    const { rut_usuario } = req.params;
    const userRole = req.user?.id_rol;

    if (userRole !== 1) {
      return handleErrorClient(res, 403, "No tienes permisos para invalidar códigos QR de otros usuarios");
    }

    console.log('=== INVALIDATE QR FOR USER ===');
    console.log('QR invalidado para RUT:', rut_usuario);

    handleSuccess(res, 200, "Código QR invalidado exitosamente", {
      rut_usuario: rut_usuario,
      message: "Código QR invalidado exitosamente"
    });

  } catch (error) {
    console.error('Error invalidando QR para usuario:', error);
    handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Mantener la función original
async function generar(req, res) {
  try {
    const { rut_usuario, password } = req.body;
    const { qr, codigo_unico } = await qrService.generateQRCode(rut_usuario, password);

    res.json({
      ok: true,
      message: "QR generado correctamente",
      qr,
      codigo_unico,
    });
  } catch (error) {
    handleErrorServer(res, error);
  }
}

export { 
  generar, 
  generateMyQR, 
  generateQRForUser, 
  invalidateMyQR, 
  invalidateQRForUser 
};
