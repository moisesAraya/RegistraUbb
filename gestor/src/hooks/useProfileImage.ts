import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
        const response = await fetch(`${API_BASE_URL}/profile/foto-perfil-url/${targetRut}`);
        const data = await response.json();

        if (data.success && data.foto_url) {
          setImageUrl(data.foto_url);
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
      const response = await fetch(`${API_BASE_URL}/profile/foto-perfil-url/${targetRut}`);
      const data = await response.json();

      if (data.success && data.foto_url) {
        setImageUrl(data.foto_url);
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