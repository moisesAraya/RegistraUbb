import { minioClient } from "../config/minioClient.js";
import fs from "fs";
import path from "path";

const bucketName = process.env.MINIO_BUCKET || "profile-pictures";

// Crear bucket si no existe y configurar policy pública
async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
    console.log(`🪣 Bucket creado: ${bucketName}`);
  }
  
  // Configurar policy pública para lectura
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          AWS: ['*']
        },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  };
  
  try {
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`🔓 [MINIO] Bucket configurado como público: ${bucketName}`);
  } catch (error) {
    console.warn(`⚠️ [MINIO] No se pudo configurar policy pública:`, error.message);
  }
}

// Subir archivo
export async function uploadProfileImage(file, rut_usuario) {
  try {
    console.log('📤 [MINIO] Iniciando upload:', {
      fileName: file.originalname,
      fileSize: file.size,
      rut_usuario,
      bucketName
    });
    
    await ensureBucket();

    const extension = path.extname(file.originalname);
    const objectName = `${rut_usuario}${extension}`;
    const filePath = file.path;

    console.log('📤 [MINIO] Subiendo archivo:', {
      objectName,
      filePath,
      bucketName
    });

    await minioClient.fPutObject(bucketName, objectName, filePath);
    
    console.log('✅ [MINIO] Archivo subido exitosamente');

    // Eliminar archivo temporal
    fs.unlinkSync(filePath);

    // Generar URL firmada (válida por 7 días)
    try {
      const signedUrl = await minioClient.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);
      console.log('✅ [MINIO] URL firmada generada:', signedUrl);
      return [signedUrl, null];
    } catch (signError) {
      console.warn('⚠️ [MINIO] Error generando URL firmada, usando URL pública');
      const publicUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${objectName}`;
      console.log('📤 [MINIO] URL pública generada:', publicUrl);
      return [publicUrl, null];
    }
  } catch (error) {
    console.error("💥 [MINIO] Error al subir imagen:", error);
    console.error("💥 [MINIO] Stack:", error.stack);
    return [null, `Error al subir la imagen: ${error.message}`];
  }
}

// Obtener URL de imagen por RUT
export async function getProfileImageUrl(rut_usuario) {
  try {
    console.log('🔍 [MINIO] Buscando imagen para RUT:', rut_usuario);
    
    await ensureBucket();
    
    // Buscar imagen con diferentes extensiones
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    for (const ext of extensions) {
      const objectName = `${rut_usuario}${ext}`;
      try {
        await minioClient.statObject(bucketName, objectName);
        
        // Intentar URL pública primero
        const publicUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${objectName}`;
        console.log('🔗 [MINIO] Intentando URL pública:', publicUrl);
        
        // Generar URL firmada como backup (válida por 7 días)
        try {
          const signedUrl = await minioClient.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);
          console.log('✅ [MINIO] URL firmada generada:', signedUrl);
          return [signedUrl, null];
        } catch (signError) {
          console.warn('⚠️ [MINIO] Error generando URL firmada, usando URL pública:', signError.message);
          return [publicUrl, null];
        }
      } catch (err) {
        // Continuar con la siguiente extensión
        continue;
      }
    }
    
    console.log('📭 [MINIO] No se encontró imagen para RUT:', rut_usuario);
    return [null, 'No se encontró imagen'];
  } catch (error) {
    console.error("💥 [MINIO] Error al obtener imagen:", error);
    return [null, `Error al obtener la imagen: ${error.message}`];
  }
}
