"use strict";
import bcrypt from "bcryptjs";
import Qr from "../entities/qr.entity.js";

async function generateQRCode(rut_usuario, password) {

  const codigo_unico = await bcrypt.hash(rut_usuario + password, 10);

  await Qr.update({ estado_qr: "false" }, { where: { rut_usuario } });

  const qr = await Qr.create({
    rut_usuario,
    codigo_unico,
    estado_qr: "true",
  });

  return { qr, codigo_unico };
}

async function validateQr(codigo_unico) {
  return Qr.findOne({ where: { codigo_unico, estado_qr: "true" } });
}

export default {
  generateQRCode,
  validateQr,
};
