import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, Menu, X, ChevronDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '../Common/UserAvatar';
import useNotifications from '../../hooks/useNotifications';

// ✅ Interfaz correcta del Usuario
interface UserType {
  rut_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  id_rol: number;
  id_cargo: number;
  horas_atrabajar?: number;
}

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const LOGO_FILENAME = 'logo_registraubb.png'; // nombre en MinIO
const LOGO_BUCKET = 'registraubb';

const Header: React.FC<HeaderProps> = ({ user, onLogout, isSidebarOpen, onToggleSidebar }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { notifications: notificaciones, unreadCount, markAsRead } = useNotifications();
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
    /\/+$/,
    ''
  );
  const MINIO_ENDPOINT = (import.meta.env.VITE_MINIO_ENDPOINT || 'http://localhost:9000').replace(
    /\/+$/,
    ''
  );

  const normalizeUrl = (url: string): string => {
    if (typeof window === 'undefined') return url;
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
      return url.replace(/^http:\/\//i, 'https://');
    }
    return url;
  };

  // Obtener logo desde MinIO (presigned URL con fallback directo)
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/minio/logo-url?bucket=${LOGO_BUCKET}&filename=${LOGO_FILENAME}`
        );
        const json = await res.json();

        if (json.success && json.url) {
          setLogoUrl(normalizeUrl(json.url));
        } else {
          const directUrl = `${MINIO_ENDPOINT}/${LOGO_BUCKET}/${LOGO_FILENAME}`;
          console.log('🔄 Intentando acceso directo al logo:', directUrl);
          setLogoUrl(normalizeUrl(directUrl));
        }
      } catch (error) {
        console.error('❌ Error obteniendo logo:', error);
        const directUrl = `${MINIO_ENDPOINT}/${LOGO_BUCKET}/${LOGO_FILENAME}`;
        console.log('🔄 Intentando acceso directo al logo (fallback):', directUrl);
        setLogoUrl(normalizeUrl(directUrl));
      }
    };

    fetchLogo();
  }, [API_BASE_URL, MINIO_ENDPOINT]);

  const getRoleLabel = (id_rol: number) => {
    const roles = {
      1: 'Administrador',
      2: 'Académico',
      3: 'Usuario',
    };
    return roles[id_rol as keyof typeof roles] || 'Usuario';
  };

  const getRoleColor = (id_rol: number) => {
    const colors = {
      1: 'bg-red-50 text-red-700 border-red-200',
      2: 'bg-blue-50 text-blue-700 border-blue-200',
      3: 'bg-green-50 text-green-700 border-green-200',
    };
    return colors[id_rol as keyof typeof colors] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const nombreCompleto = `${user.nombres || ''} ${user.apellidos || ''}`.trim();

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm relative z-30">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 lg:h-16">
          {/* Left side - Mobile menu button y logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5
