import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();
console.log('🔧 MinIO Config:', {
  endPoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT,
  accessKey: process.env.MINIO_ACCESS_KEY ? '✅' : '❌',
  secretKey: process.env.MINIO_SECRET_KEY ? '✅' : '❌',
  bucket: process.env.MINIO_BUCKET
});

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});
