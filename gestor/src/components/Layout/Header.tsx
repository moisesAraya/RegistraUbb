import React, { useState } from 'react';
import { User, LogOut, Bell, Menu, X, ChevronDown, Settings, HelpCircle } from 'lucide-react';
import type { User as UserType } from '../../types';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, isSidebarOpen, onToggleSidebar }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications] = useState(3);

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
            
            {/* Logo solo visible en desktop cuando sidebar está cerrado */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
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
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg">
                    {notifications}
                  </span>
                )}
              </button>
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
                      <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Mi Perfil</span>
                      </button>
                      <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Configuración</span>
                      </button>
                      <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        <span>Ayuda</span>
                      </button>
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
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;