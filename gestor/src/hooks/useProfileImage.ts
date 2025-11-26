import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const MINIO_ENDPOINT = import.meta.env.VITE_MINIO_ENDPOINT || '/minio';
const MINIO_BUCKET = import.meta.env.VITE_MINIO_BUCKET || 'usuarios-fotos';

export const useProfileImage = (rut_usuario?: string) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetRut = rut_usuario || user?.rut_usuario;

  useEffect(() => {
    const loadProfileImage = async () => {
      if (!targetRut) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Enviar cookies (httpOnly) y/o usar Authorization si existe token
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/profile/foto-perfil-url/${encodeURIComponent(targetRut)}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        const data = await response.json();

        if (data.success && data.foto_url) {
          // Probar la URL presigned y, si falla, probar acceso directo a MinIO
          const candidates: string[] = [];
          candidates.push(data.foto_url);

          // Si el backend devolvió filename, construir fallback directo al bucket
          if (data.filename) {
            const direct = `${MINIO_ENDPOINT.replace(/\/+$/, '')}/${MINIO_BUCKET}/${data.filename}`;
            candidates.push(direct);
          }

          // Si la URL es http en entorno https, también intentar con https
          if (typeof data.foto_url === 'string' && data.foto_url.startsWith('http://') && window.location.protocol === 'https:') {
            candidates.unshift(data.foto_url.replace(/^http:\/\//i, 'https://'));
          }

          // Intentar cargar cada candidato hasta que uno funcione
          const tryLoad = (url: string) => {
            return new Promise<string>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(url);
              img.onerror = () => reject(new Error('no-load'));
              img.src = url;
            });
          };

          let loadedUrl: string | null = null;
          for (const c of candidates) {
            try {
              // eslint-disable-next-line no-await-in-loop
              await tryLoad(c);
              loadedUrl = c;
              break;
            } catch (e) {
              // seguir al siguiente candidato
            }
          }

          if (loadedUrl) {
            setImageUrl(loadedUrl);
          } else {
            setImageUrl(null);
          }
        } else {
          setImageUrl(null);
        }
      } catch (err) {
        console.error('Error cargando imagen de perfil:', err);
        setError('Error al cargar imagen');
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfileImage();
  }, [targetRut]);

  const refreshImage = async () => {
    if (!targetRut) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/profile/foto-perfil-url/${encodeURIComponent(targetRut)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();

      if (data.success && data.foto_url) {
        // intentar cargar la URL (presigned) y fallback directo
        const candidates: string[] = [];
        candidates.push(data.foto_url);
        if (data.filename) {
          const direct = `${MINIO_ENDPOINT.replace(/\/+$/, '')}/${MINIO_BUCKET}/${data.filename}`;
          candidates.push(direct);
        }

        if (typeof data.foto_url === 'string' && data.foto_url.startsWith('http://') && window.location.protocol === 'https:') {
          candidates.unshift(data.foto_url.replace(/^http:\/\//i, 'https://'));
        }

        const tryLoad = (url: string) => {
          return new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error('no-load'));
            img.src = url;
          });
        };

        let loadedUrl: string | null = null;
        for (const c of candidates) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await tryLoad(c);
            loadedUrl = c;
            break;
          } catch (e) {}
        }

        if (loadedUrl) setImageUrl(loadedUrl);
        else setImageUrl(null);
      } else {
        setImageUrl(null);
      }
    } catch (err) {
      console.error('Error refrescando imagen de perfil:', err);
      setImageUrl(null);
    }
  };

  return {
    imageUrl,
    loading,
    error,
    refreshImage
  };
};