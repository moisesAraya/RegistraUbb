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
        
        console.log('📸 [MINIO-CTRL] Obteniendo foto de perfil para:', rut_usuario);

        // Buscar archivos con el RUT (puede ser .jpg, .png, etc.)
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        let objectName = null;

        for (const ext of extensions) {
            const fileName = `${rut_usuario}${ext}`;
            try {
                await minioClient.statObject(bucketName, fileName);
                objectName = fileName;
                break;
            } catch (err) {
                // Archivo no existe, continuar con siguiente extensión
                continue;
            }
        }

        if (!objectName) {
            return res.status(404).json({
                success: false,
                message: 'Foto de perfil no encontrada'
            });
        }

        // Generar URL presigned (válida por 24 horas)
        const url = await minioClient.presignedGetObject(bucketName, objectName, 24 * 60 * 60);

        console.log('✅ [MINIO-CTRL] URL generada para:', objectName);

        res.json({
            success: true,
            foto_url: url,
            filename: objectName
        });

    } catch (error) {
        console.error('❌ [MINIO-CTRL] Error obteniendo foto de perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo foto de perfil',
            message: error.message
        });
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

        console.log('🎨 [MINIO-CTRL] Obteniendo logo:', { bucket, filename });

        // Verificar si el objeto existe
        try {
            await minioClient.statObject(bucket, filename);
        } catch (err) {
            console.log('⚠️ [MINIO-CTRL] Logo no encontrado en MinIO');
            return res.status(404).json({
                success: false,
                message: 'Logo no encontrado'
            });
        }

        // Generar URL presigned (válida por 24 horas)
        const url = await minioClient.presignedGetObject(bucket, filename, 24 * 60 * 60);

        console.log('✅ [MINIO-CTRL] URL del logo generada');

        res.json({
            success: true,
            url,
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

