"use strict";
import qrService from "../services/qr.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

async function generar(req, res) {
  try {
    const { rut_usuario, password } = req.body;

    // Genera el QR usando el servicio
    const { qr, codigo_unico } = await qrService.generateQRCode(rut_usuario, password);

    // Devuelve el string del QR al cliente
    res.json({
      ok: true,
      message: "QR generado correctamente",
      qr,
      codigo_unico, // Este es el string que el frontend usará para generar el QR visualmente
    });
  } catch (error) {
    // Maneja errores del servidor
    handleErrorServer(res, error);
  }
}

export { generar };
