import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Ajusta esto si tu bucket se llama diferente, en el controller vi 'usuarios-fotos'
const BUCKET_NAME = 'usuarios-fotos'; 

export const useProfileImage = (rut_usuario?: string) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetRut = rut_usuario || user?.rut_usuario;

  // Función para construir la URL pública manualmente (Tu "Plan B")
  const getPublicUrl = (filename: string) => {
    // Usamos '/minio' para que pase por el Nginx del puerto 1785
    const minioBase = import.meta.env.VITE_MINIO_ENDPOINT || '/minio';
    // Limpiamos slashes dobles
    const cleanBase = minioBase.replace(/\/$/, '');
    return `${cleanBase}/${BUCKET_NAME}/${filename}`;
  };

  useEffect(() => {
    const loadProfileImage = async () => {
      if (!targetRut) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Intentamos pedirle la URL al backend (Plan A)
        const response = await fetch(
          `${API_BASE_URL}/profile/foto-perfil-url/${encodeURIComponent(targetRut)}`
        );
        const data = await response.json();

        // 2. VERIFICACIÓN DE SEGURIDAD
        // Si el backend nos responde con la IP interna (146.83...), la DESCARTAMOS
        // y construimos la URL pública nosotros mismos.
        if (data.success && data.foto_url) {
            
          if (data.foto_url.includes('146.83.194.142')) {
             console.warn('⚠️ Backend devolvió IP interna. Usando Fallback de Frontend.');
             // Usamos el nombre del archivo que nos dio el backend, pero con nuestra base pública
             const filename = data.filename || `${targetRut}.png`; // Fallback si no viene filename
             const manualUrl = getPublicUrl(filename);
             setImageUrl(manualUrl);
          } else {
             // Si la URL viene bien (https://asis.face...), la usamos
             setImageUrl(data.foto_url);
          }
          
        } else {
           // Si el backend dice que no hay foto, intentamos adivinarla (Plan C)
           // Esto es útil si subiste la foto pero la BD no se enteró
           console.log('⚠️ Backend no dio URL, intentando acceso directo...');
           checkDirectAccess(targetRut);
        }

      } catch (err) {
        console.error('Error backend, intentando directo:', err);
        checkDirectAccess(targetRut);
      } finally {
        setLoading(false);
      }
    };

    loadProfileImage();
  }, [targetRut]);

  // Función auxiliar para probar extensiones si todo falla
  const checkDirectAccess = (rut: string) => {
      // Intentamos cargar .png como default
      const tryUrl = getPublicUrl(`${rut}.png`);
      const img = new Image();
      img.onload = () => setImageUrl(tryUrl);
      img.onerror = () => {
          // Si falla png, probamos jpg
          const tryUrlJpg = getPublicUrl(`${rut}.jpg`);
          const imgJpg = new Image();
          imgJpg.onload = () => setImageUrl(tryUrlJpg);
          imgJpg.onerror = () => setImageUrl(null); // Rendirse
          imgJpg.src = tryUrlJpg;
      };
      img.src = tryUrl;
  };

  const refreshImage = async () => {
      // Re-ejecutar lógica de carga
      if(targetRut) {
          const timestamp = new Date().getTime();
          // Forzamos recarga agregando timestamp
          const currentUrl = imageUrl?.split('?')[0];
          if(currentUrl) setImageUrl(`${currentUrl}?t=${timestamp}`);
      }
  };

  return {
    imageUrl,
    loading,
    error,
    refreshImage,
  };
};