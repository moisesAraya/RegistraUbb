"use strict";

import { minioClient } from '../config/minioClient.js';

console.log('🪣 [MINIO-CONTROLLER] Controller cargado');

/**
 * 📸 OBTENER URL PRESIGNED DE FOTO DE PERFIL
 */
export async function getFotoPerfilUrl(req, res) {
    try {
        const { rut_usuario } = req.params;
        const bucketName = process.env.MINIO_BUCKET || 'usuarios-fotos';

        // 1. Definir la URL base pública EXACTA como la quieres en el Front
        // Debería ser: https://asis.face.ubiobio.cl:1785/minio
        const publicUrlBase = process.env.MINIO_PUBLIC_URL || 'https://asis.face.ubiobio.cl:1785/minio';

        console.log('📸 [MINIO-CTRL] Buscando foto para:', rut_usuario);

        // 2. Buscar extensión correcta
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        let finalFilename = null;

        for (const ext of extensions) {
            const fileName = `${rut_usuario}${ext}`;
            try {
                // Solo verificamos si existe físicamente en el disco de MinIO
                await minioClient.statObject(bucketName, fileName);
                finalFilename = fileName;
                break; // Encontramos la imagen, salimos del loop
            } catch (err) {
                continue;
            }
        }

        if (!finalFilename) {
            return res.status(404).json({
                success: false,
                message: 'Foto de perfil no encontrada'
            });
        }

        // 3. CONSTRUCCIÓN MANUAL DE LA URL (Sin firmas, sin reemplazos raros)
        // Resultado: https://asis.face.ubiobio.cl:1785/minio/usuarios-fotos/13308258-1.png
        const cleanBase = publicUrlBase.replace(/\/$/, ''); // Quitar slash final si existe
        const urlFinal = `${cleanBase}/${bucketName}/${finalFilename}`;

        console.log('✅ [MINIO-CTRL] URL generada:', urlFinal);

        res.json({
            success: true,
            foto_url: urlFinal,
            filename: finalFilename
        });

    } catch (error) {
        console.error('❌ [MINIO-CTRL] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * 🎨 OBTENER URL PRESIGNED DEL LOGO
 */
export async function getLogoUrl(req, res) {
    try {
        const { bucket, filename } = req.query;
        
        if (!bucket || !filename) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere bucket y filename'
            });
        }

        console.log('🎨 [MINIO-CTRL] Buscando logo:', { bucket, filename });

        // 1. Verificar si el objeto existe físicamente
        try {
            await minioClient.statObject(bucket, filename);
        } catch (err) {
            console.log('⚠️ [MINIO-CTRL] Logo no encontrado en MinIO');
            return res.status(404).json({
                success: false,
                message: 'Logo no encontrado'
            });
        }

        // 2. Construir URL Pública (Igual que en foto de perfil)
        const publicUrlBase = process.env.MINIO_PUBLIC_URL || 'https://asis.face.ubiobio.cl:1785/minio';
        const cleanBase = publicUrlBase.replace(/\/$/, '');
        
        // Construimos: https://asis.face.ubiobio.cl:1785/minio/bucket-logos/logo.png
        const urlFinal = `${cleanBase}/${bucket}/${filename}`;

        console.log('✅ [MINIO-CTRL] URL del logo generada:', urlFinal);

        res.json({
            success: true,
            url: urlFinal,
            filename
        });

    } catch (error) {
        console.error('❌ [MINIO-CTRL] Error obteniendo logo:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo logo',
            message: error.message
        });
    }
}

/**
 * 🔍 VERIFICAR ESTADO DE MINIO
 */
export async function getMinioStatus(req, res) {
    try {
        const bucketName = process.env.MINIO_BUCKET || 'usuarios-fotos';
        const exists = await minioClient.bucketExists(bucketName);
        
        res.json({
            success: true,
            minio_connected: true,
            bucket_exists: exists,
            bucket_name: bucketName,
            endpoint: process.env.MINIO_ENDPOINT,
            port: process.env.MINIO_PORT
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            minio_connected: false,
            error: error.message
        });
    }
}

