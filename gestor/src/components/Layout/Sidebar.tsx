import React from 'react';
import { 
  Home, 
  Clock, 
  BarChart3, 
  Users, 
  Settings, 
  FileText,
  Calendar,
  Shield,
  QrCode,
  User as UserIcon
} from 'lucide-react';
import type { User } from '../../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onTabChange, isOpen, onClose }) => {
  const getMenuItems = () => {
    const commonItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'attendance', label: 'Asistencia', icon: Clock },
      { id: 'qr-codes', label: 'Códigos QR', icon: QrCode },
    ];

    const roleSpecificItems = {
      academic: [
        { id: 'my-reports', label: 'Mis Reportes', icon: FileText },
        { id: 'justifications', label: 'Justificaciones', icon: Calendar },
      ],
      secretary: [
        { id: 'reports', label: 'Reportes', icon: BarChart3 },
        { id: 'staff-attendance', label: 'Asistencia Personal', icon: Users },
      ],
      department_head: [
        { id: 'reports', label: 'Reportes', icon: BarChart3 },
        { id: 'staff-attendance', label: 'Asistencia Personal', icon: Users },
        { id: 'approvals', label: 'Aprobaciones', icon: Shield },
      ],
      administrator: [
        { id: 'reports', label: 'Reportes', icon: BarChart3 },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'settings', label: 'Configuración', icon: Settings },
      ]
    };

    return [...commonItems, ...roleSpecificItems[user.role]];
  };

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <nav className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:shadow-sm 
        border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">SisAsistencia</h2>
            </div>
          </div>
        </div>

        {/* User info on mobile */}
        <div className="lg:hidden p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role === 'academic' ? 'Académico' :
                 user.role === 'secretary' ? 'Secretaría' :
                 user.role === 'department_head' ? 'Jefe de Departamento' :
                 'Administrador'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <div className="p-4 space-y-2 overflow-y-auto h-full pb-20 lg:pb-4">
          {getMenuItems().map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 lg:py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;