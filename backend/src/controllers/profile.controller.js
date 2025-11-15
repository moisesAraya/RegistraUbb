// Endpoint para obtener la URL de la foto de perfil
export async function getProfilePhotoUrlController(req, res) {
  try {
    const { rut_usuario } = req.params;
    if (!rut_usuario) {
      return res.status(400).json({ success: false, message: "Falta rut_usuario" });
    }
    const usuario = await Usuario.findOne({ where: { rut_usuario } });
    if (!usuario) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    return res.status(200).json({
      success: true,
      foto_url: usuario.foto_url || null
    });
  } catch (error) {
    console.error("💥 Error en getProfilePhotoUrlController:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}
import multer from "multer";
import { uploadProfileImage } from "../services/minio.service.js";
import Usuario from "../entities/usuario.entity.js";
import { hashPassword, comparePassword } from "../helpers/bcrypt.helper.js";

const upload = multer({ dest: "uploads/" });

export const uploadMiddleware = upload.single("foto");

// Controlador para subir foto
export async function uploadProfilePictureController(req, res) {
  try {
    const { rut_usuario } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No se envió ninguna imagen" });
    }

    const [imageUrl, error] = await uploadProfileImage(file, rut_usuario);
    if (error) {
      return res.status(500).json({ success: false, message: error });
    }

    // Guardar URL en el usuario
    await Usuario.update({ foto_url: imageUrl }, { where: { rut_usuario } });

    return res.status(200).json({
      success: true,
      message: "Foto de perfil actualizada correctamente",
      data: { imageUrl },
    });
  } catch (error) {
    console.error("💥 Error en uploadProfilePictureController:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}

// Controlador para cambiar contraseña
export async function changePasswordController(req, res) {
  try {
    const { rut_usuario, currentPassword, newPassword } = req.body;

    if (!rut_usuario || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Faltan datos requeridos" 
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { rut_usuario } });
    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(currentPassword, usuario.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "La contraseña actual es incorrecta" 
      });
    }

    // Validar nueva contraseña
    if (newPassword.length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: "La nueva contraseña debe tener al menos 5 caracteres" 
      });
    }

    // Hashear y actualizar
    const hashedPassword = await hashPassword(newPassword);
    await Usuario.update(
      { password: hashedPassword },
      { where: { rut_usuario } }
    );

    return res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    console.error("💥 Error en changePasswordController:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
}
