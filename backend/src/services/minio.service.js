import { minioClient } from "../config/minioClient.js";
import fs from "fs";
import path from "path";

const bucketName = process.env.MINIO_BUCKET || "profile-pictures";

// Crear bucket si no existe
async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
    console.log(`🪣 Bucket creado: ${bucketName}`);
  }
}

// Subir archivo
export async function uploadProfileImage(file, rut_usuario) {
  try {
    await ensureBucket();

    const extension = path.extname(file.originalname);
    const objectName = `${rut_usuario}${extension}`;
    const filePath = file.path;

    await minioClient.fPutObject(bucketName, objectName, filePath);

    // Eliminar archivo temporal
    fs.unlinkSync(filePath);

    const imageUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${objectName}`;

    return [imageUrl, null];
  } catch (error) {
    console.error("💥 Error al subir imagen:", error);
    return [null, "Error al subir la imagen"];
  }
}
