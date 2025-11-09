"use strict";
import crypto from 'crypto';
import Usuario from '../entities/usuario.entity.js';
import QR from '../entities/qr.entity.js';
import Rol from '../entities/rol.entity.js';
import Cargo from '../entities/cargo.entity.js';
import { processRut } from '../utils/rut.utils.js';

const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || 'defaultEncryptionKey123456789012345')
  .digest(); // 🔒 32 bytes exactos para AES-256
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// ============================================================
// ✅ Función de encriptación moderna (compatible Node 18+)
// ============================================================
function encryptData(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Guardamos IV junto al texto encriptado (necesario para desencriptar)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encriptando datos:', error);
    throw new Error('Error en la encriptación');
  }
}

// ============================================================
// ✅ Función de desencriptación moderna
// ============================================================
function decryptData(encryptedData) {
  try {
    const [ivHex, encrypted] = encryptedData.split(':');

    if (!ivHex || !encrypted) {
      throw new Error('Formato de datos encriptados inválido');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error desencriptando datos:', error);
    throw new Error('Error en la desencriptación');
  }
}

// ============================================================
// ✅ Generar QR encriptado
// ============================================================
export async function generateEncryptedRutService(rut_usuario) {
  try {
    console.log('=== GENERATE ENCRYPTED RUT SERVICE ===');

    const { normalized: rutNormalizado, isValid } = processRut(rut_usuario);

    if (!isValid) return [null, "Formato de RUT inválido"];

    console.log('Buscando usuario:', rutNormalizado);

    const user = await Usuario.findOne({
      where: { rut_usuario: rutNormalizado },
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre_rol'] },
        { model: Cargo, as: 'cargo', attributes: ['id_cargo', 'nombre_cargo'] }
      ]
    });

    if (!user) return [null, `Usuario con RUT ${rutNormalizado} no encontrado`];

    console.log('✅ Usuario encontrado:', user.nombres, user.apellidos);

    await QR.update(
      { estado_qr: false },
      { where: { rut_usuario: rutNormalizado, estado_qr: true } }
    );

    console.log('✅ QR codes anteriores invalidados');

    const dataToEncrypt = JSON.stringify({
      rut: rutNormalizado,
      action: 'qr_auth',
      created: Date.now(),
      user: {
        nombres: user.nombres,
        apellidos: user.apellidos,
        id_rol: user.id_rol,
        id_cargo: user.id_cargo
      }
    });

    console.log('Datos a encriptar (longitud):', dataToEncrypt.length);

    const encryptedHash = encryptData(dataToEncrypt);

    console.log('Hash generado (longitud):', encryptedHash.length);

    if (encryptedHash.length > 500)
      console.warn('⚠️  Hash muy largo:', encryptedHash.length, 'caracteres');

    const newQR = await QR.create({
      codigo_unico: encryptedHash,
      estado_qr: true,
      fecha_creacion: new Date(),
      rut_usuario: rutNormalizado
    });

    console.log('✅ QR Code guardado en tabla QR');

    return [{
      codigo_unico: newQR.codigo_unico,
      rut_usuario: user.rut_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      encryptedHash: newQR.codigo_unico,
      permanent: true,
      activo: newQR.estado_qr,
      fecha_creacion: newQR.fecha_creacion,
      message: "Código QR generado y guardado correctamente."
    }, null];

  } catch (error) {
    console.error('Error en generateEncryptedRutService:', error);

    if (error.name === 'SequelizeDatabaseError') {
      if (error.original?.code === '22001')
        return [null, "Error: El código QR generado es demasiado largo. Contacte al administrador."];
      return [null, "Error de base de datos al guardar el QR"];
    }

    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      return [null, `Error de validación: ${messages}`];
    }

    if (error.name === 'SequelizeUniqueConstraintError')
      return [null, "Ya existe un código QR con ese hash. Intente nuevamente."];

    return [null, "Error interno generando el código QR"];
  }
}

// ============================================================
// ✅ Invalidar QR del usuario
// ============================================================
export async function invalidateUserQRService(rut_usuario) {
  try {
    console.log('=== INVALIDATE USER QR SERVICE ===');

    const { normalized: rutNormalizado, isValid } = processRut(rut_usuario);
    if (!isValid) return [null, "Formato de RUT inválido"];

    const user = await Usuario.findOne({ where: { rut_usuario: rutNormalizado } });
    if (!user) return [null, `Usuario con RUT ${rutNormalizado} no encontrado`];

    const [updatedCount] = await QR.update(
      { estado_qr: false },
      { where: { rut_usuario: rutNormalizado, estado_qr: true } }
    );

    console.log(`✅ ${updatedCount} QR code(s) invalidado(s) para:`, user.nombres, user.apellidos);

    return [{
      rut_usuario: user.rut_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      invalidated_count: updatedCount,
      message: `${updatedCount} código(s) QR invalidado(s).`
    }, null];

  } catch (error) {
    console.error('Error en invalidateUserQRService:', error);
    return [null, "Error interno invalidando el código QR"];
  }
}

// ============================================================
// ✅ Obtener QR del usuario
// ============================================================
export async function getUserQRCodesService(rut_usuario) {
  try {
    console.log('=== GET USER QR CODES SERVICE ===');

    const { normalized: rutNormalizado, isValid } = processRut(rut_usuario);
    if (!isValid) return [null, "Formato de RUT inválido"];

    const qrCodes = await QR.findAll({
      where: { rut_usuario: rutNormalizado },
      order: [['fecha_creacion', 'DESC']],
      limit: 10
    });

    console.log(`✅ Encontrados ${qrCodes.length} QR codes para:`, rutNormalizado);

    return [qrCodes.map(qr => ({
      codigo_unico: qr.codigo_unico,
      hash_encriptado: qr.codigo_unico,
      activo: qr.estado_qr,
      permanente: true,
      fecha_creacion: qr.fecha_creacion,
      rut_usuario: qr.rut_usuario
    })), null];

  } catch (error) {
    console.error('Error en getUserQRCodesService:', error);
    return [null, "Error interno obteniendo códigos QR"];
  }
}

export { encryptData, decryptData };
