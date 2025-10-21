import multer from "multer";
import { uploadProfileImage } from "../services/minio.service.js";
import Usuario from "../entities/usuario.entity.js";

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
