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
    // console.log(`🔓 [MINIO] Policy verificada`); // Comentado para menos ruido
  } catch (error) {
    console.warn(`⚠️ [MINIO] No se pudo configurar policy pública:`, error.message);
  }
}

// Subir archivo
export async function uploadProfileImage(file, rut_usuario) {
  try {
    console.log('📤 [MINIO] Iniciando upload:', {
      fileName: file.originalname,
      rut_usuario,
      bucketName
    });
    
    await ensureBucket();

    const extension = path.extname(file.originalname);
    const objectName = `${rut_usuario}${extension}`;
    const filePath = file.path;

    await minioClient.fPutObject(bucketName, objectName, filePath);
    
    console.log('✅ [MINIO] Archivo subido exitosamente');

    // Eliminar archivo temporal
    try {
        fs.unlinkSync(filePath);
    } catch (e) {
        console.warn('No se pudo borrar archivo temporal', e);
    }

    // --- CORRECCIÓN AQUÍ ---
    // En lugar de pedir URL firmada, construimos la URL Pública directamente
    // para que el Front la pueda mostrar de inmediato sin errores SSL.
    
    const publicBase = process.env.MINIO_PUBLIC_URL || 'https://asis.face.ubiobio.cl:1785/minio';
    const cleanBase = publicBase.replace(/\/$/, '');
    const publicUrl = `${cleanBase}/${bucketName}/${objectName}`;

    console.log('✅ [MINIO] URL Pública retornada:', publicUrl);
    
    // Retornamos la URL limpia
    return [publicUrl, null];

  } catch (error) {
    console.error("💥 [MINIO] Error al subir imagen:", error);
    return [null, `Error al subir la imagen: ${error.message}`];
  }
}

// Obtener URL de imagen por RUT
export async function getProfileImageUrl(rut_usuario) {
  try {
    console.log('🔍 [MINIO] Buscando imagen para RUT:', rut_usuario);
    
    await ensureBucket();
    
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    for (const ext of extensions) {
      const objectName = `${rut_usuario}${ext}`;
      try {
        // Verificamos existencia física
        await minioClient.statObject(bucketName, objectName);
        
        // Construimos URL Pública
        const publicBase = process.env.MINIO_PUBLIC_URL || 'https://asis.face.ubiobio.cl:1785/minio';
        const cleanBase = publicBase.replace(/\/$/, '');
        const finalUrl = `${cleanBase}/${bucketName}/${objectName}`;
        
        console.log('🔗 [MINIO] Encontrada:', finalUrl);
        return [finalUrl, null];

      } catch (err) {
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