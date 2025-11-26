import multer from "multer";
import { uploadProfileImage, getProfileImageUrl } from "../services/minio.service.js";
import Usuario from "../entities/usuario.entity.js";
import { encryptPassword, comparePassword } from "../helpers/bcrypt.helper.js";

const upload = multer({ dest: "uploads/" });

export const uploadMiddleware = upload.single("foto");

// Controlador para subir foto
export async function uploadProfilePictureController(req, res) {
  try {
    console.log("📸 [UPLOAD] Iniciando upload de foto de perfil");

    const { rut_usuario } = req.params;
    const file = req.file;

    console.log("📸 [UPLOAD] Datos recibidos:", {
      rut_usuario,
      file: file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
          }
        : null,
    });

    if (!file) {
      console.log("❌ [UPLOAD] No se envió archivo");
      return res
        .status(400)
        .json({ success: false, message: "No se envió ninguna imagen" });
    }

    console.log("📤 [UPLOAD] Llamando a uploadProfileImage...");
    const [imageUrl, error] = await uploadProfileImage(file, rut_usuario);

    if (error) {
      console.log("❌ [UPLOAD] Error en uploadProfileImage:", error);
      return res.status(500).json({ success: false, message: error });
    }

    console.log("💾 [UPLOAD] Guardando URL en base de datos:", imageUrl);
    // Guardar URL en el usuario
    await Usuario.update({ foto_url: imageUrl }, { where: { rut_usuario } });

    console.log("✅ [UPLOAD] Upload completado exitosamente");
    return res.status(200).json({
      success: true,
      message: "Foto de perfil actualizada correctamente",
      data: { imageUrl },
    });
  } catch (error) {
    console.error(
      "💥 [UPLOAD] Error en uploadProfilePictureController:",
      error
    );
    console.error("💥 [UPLOAD] Stack:", error.stack);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

// Controlador para cambiar contraseña
export async function changePasswordController(req, res) {
  try {
    const { rut_usuario, currentPassword, newPassword } = req.body;

    if (!rut_usuario || !currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos requeridos" });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { rut_usuario } });
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(
      currentPassword,
      usuario.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }

    // Validar nueva contraseña
    if (newPassword.length < 5) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 5 caracteres",
      });
    }

    // Hashear y actualizar
    const hashedPassword = await encryptPassword(newPassword);
    await Usuario.update(
      { password: hashedPassword },
      { where: { rut_usuario } }
    );

    return res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("💥 Error en changePasswordController:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

// ✅ NUEVO: Controlador para cambiar PIN
export async function changePinController(req, res) {
  try {
    const { rut_usuario, currentPin, newPin } = req.body;

    if (!rut_usuario || !currentPin || !newPin) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos requeridos" });
    }

    // Validar formato de nuevo PIN (4 dígitos)
    const newPinStr = String(newPin);
    if (!/^\d{4}$/.test(newPinStr)) {
      return res.status(400).json({
        success: false,
        message: "El nuevo PIN debe ser un número de 4 dígitos",
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { rut_usuario } });
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    const currentPinStr = String(currentPin);

    // Verificar PIN actual
    if (String(usuario.pin) !== currentPinStr) {
      return res.status(401).json({
        success: false,
        message: "El PIN actual es incorrecto",
      });
    }

    // Evitar que el nuevo PIN sea igual al anterior
    if (String(usuario.pin) === newPinStr) {
      return res.status(400).json({
        success: false,
        message: "El nuevo PIN no puede ser igual al actual",
      });
    }

    // Actualizar PIN y resetear intentos / bloqueo
    await Usuario.update(
      {
        pin: Number(newPinStr),
        intentos_pin: 0,
        bloqueado_hasta: null,
      },
      { where: { rut_usuario } }
    );

    return res.status(200).json({
      success: true,
      message: "PIN actualizado correctamente",
    });
  } catch (error) {
    console.error("💥 Error en changePinController:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}

// Endpoint para obtener la URL de la foto de perfil
export async function getProfilePhotoUrlController(req, res) {
  try {
    const { rut_usuario } = req.params;
    if (!rut_usuario) {
      return res
        .status(400)
        .json({ success: false, message: "Falta rut_usuario" });
    }

    console.log("🔍 [PROFILE] Obteniendo foto para RUT:", rut_usuario);

    // Primero intentar obtener desde base de datos
    const usuario = await Usuario.findOne({ where: { rut_usuario } });
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    // Si hay URL en BD, usarla
    if (usuario.foto_url) {
      console.log("✅ [PROFILE] URL encontrada en BD:", usuario.foto_url);
      return res.status(200).json({
        success: true,
        foto_url: usuario.foto_url,
      });
    }

    // Si no hay URL en BD, buscar en MinIO directamente
    const [imageUrl, error] = await getProfileImageUrl(rut_usuario);

    if (imageUrl) {
      console.log("✅ [PROFILE] URL encontrada en MinIO:", imageUrl);
      // Actualizar BD con la URL encontrada
      await Usuario.update({ foto_url: imageUrl }, { where: { rut_usuario } });
      return res.status(200).json({
        success: true,
        foto_url: imageUrl,
      });
    }

    console.log("📭 [PROFILE] No se encontró foto para RUT:", rut_usuario);
    return res.status(200).json({
      success: true,
      foto_url: null,
    });
  } catch (error) {
    console.error("💥 Error en getProfilePhotoUrlController:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
}
