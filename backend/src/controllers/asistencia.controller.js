"use strict";

import { 
  generateEncryptedRutService, 
  invalidateUserQRService,
  getUserQRCodesService 
} from '../services/qr.service.js';

async function marcar(req, res) {
  try {
    const { codigo_unico } = req.body;

    const qr = await validateQr(codigo_unico);
    if (!qr) return res.status(401).json({ ok: false, message: 'QR inválido o inactivo' });

    // Aquí insertas en tabla Asistencia usando qr.rut_usuario
    // Ejemplo simple:
    // await Asistencia.create({ rut_usuario: qr.rut_usuario, fecha_registro: new Date() });

    res.json({ ok: true, message: `Asistencia registrada para ${qr.rut_usuario}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export { marcar };