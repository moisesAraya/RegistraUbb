import React from 'react';
import { User, LogOut, Settings, Bell, Menu, X } from 'lucide-react';
import type { User as UserType } from '../../types';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, isSidebarOpen, onToggleSidebar }) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'academic': return 'Académico';
      case 'secretary': return 'Secretaría';
      case 'department_head': return 'Jefe de Departamento';
      case 'administrator': return 'Administrador';
      default: return role;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mr-3"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SisAsistencia UBB</h1>
                  <p className="text-sm text-gray-500">Departamento de Sistemas de Información</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            <div className="sm:hidden w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>

            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;