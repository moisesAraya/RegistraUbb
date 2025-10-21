import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, Menu, X, ChevronDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { User as UserType } from '../../types';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

const LOGO_FILENAME = 'logo-registraubb.png'; // nombre en MinIO
const LOGO_BUCKET = 'logos';

const Header: React.FC<HeaderProps> = ({ user, onLogout, isSidebarOpen, onToggleSidebar }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Obtener notificaciones reales del backend
  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotificaciones(json.data);
        } else {
          setNotificaciones([]);
        }
      } catch {
        setNotificaciones([]);
      }
    };
    fetchNotificaciones();
  }, []);

  // Obtener logo desde MinIO (presigned URL)
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/minio/logo-url?bucket=${LOGO_BUCKET}&filename=${LOGO_FILENAME}`
        );
        const json = await res.json();
        if (json.success && json.url) {
          setLogoUrl(json.url);
        } else {
          setLogoUrl(null);
        }
      } catch {
        setLogoUrl(null);
      }
    };
    fetchLogo();
  }, []);

  const getRoleLabel = (id_rol: number) => {
    const roles = {
      1: 'Administrador',
      2: 'Académico',
      3: 'Usuario'
    };
    return roles[id_rol as keyof typeof roles] || 'Usuario';
  };

  const getRoleColor = (id_rol: number) => {
    const colors = {
      1: 'bg-red-50 text-red-700 border-red-200',
      2: 'bg-blue-50 text-blue-700 border-blue-200',
      3: 'bg-green-50 text-green-700 border-green-200'
    };
    return colors[id_rol as keyof typeof colors] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getInitials = (nombres?: string, apellidos?: string) => {
    const initials = `${nombres?.charAt(0) || ''}${apellidos?.charAt(0) || ''}`.toUpperCase();
    return initials || 'U';
  };

  const nombreCompleto = `${user.nombres || ''} ${user.apellidos || ''}`.trim();

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu button y logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {/* Logo desde MinIO */}
            <div className="hidden lg:flex items-center space-x-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo RegistraUBB"
                  className="w-10 h-10 object-contain rounded-lg shadow-md bg-white"
                  style={{ background: '#fff' }}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  RegistraUBB
                </h1>
              </div>
            </div>
          </div>

          {/* Right side - User menu and notifications */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 relative"
                onClick={() => setShowNotificaciones(!showNotificaciones)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </button>
              {/* Dropdown de notificaciones */}
              {showNotificaciones && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-100 font-semibold text-slate-900">
                    Notificaciones
                  </div>
                  {notificaciones.length === 0 && (
                    <div className="px-4 py-4 text-slate-500 text-sm">No tienes notificaciones.</div>
                  )}
                  {notificaciones.map((n) => (
                    <div key={n.id} className={`px-4 py-2 text-sm border-b last:border-b-0 ${n.leida ? 'bg-white' : 'bg-blue-50'}`}>
                      <div className="font-medium">{n.mensaje}</div>
                      <div className="text-xs text-slate-400">{new Date(n.fecha).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User info - Desktop */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {nombreCompleto}
                </p>
                <div className="flex items-center justify-end space-x-2">
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                    ${getRoleColor(user.id_rol)}
                  `}>
                    {getRoleLabel(user.id_rol)}
                  </span>
                </div>
              </div>
              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {getInitials(user.nombres, user.apellidos)}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{nombreCompleto}</p>
                      <p className="text-xs text-slate-500">{user.email || user.rut_usuario}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/perfil">
                        <button
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>Mi Perfil</span>
                        </button>
                      </Link>
                      <Link to="/ayuda">
                        <button
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <HelpCircle className="w-4 h-4 text-slate-500" />
                          <span>Ayuda</span>
                        </button>
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button 
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User avatar - Mobile */}
            <div className="sm:hidden flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                {getInitials(user.nombres, user.apellidos)}
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Click outside to close dropdown */}
      {(isUserMenuOpen || showNotificaciones) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsUserMenuOpen(false);
            setShowNotificaciones(false);
          }}
        ></div>
      )}
    </header>
  );
};

export default Header;