import React from 'react';
import { useAuth } from '../Context/AuthContext';
import {
  Home,
  Users,
  Calendar,
  Clock,
  FileText,
  Settings,
  LogOut,
  User,
  Building2,
  QrCode,
  CheckCircle
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  user: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  activeTab, 
  onTabChange, 
  isOpen, 
  onClose 
}) => {
  const { logout } = useAuth();

  // ✅ Mapeo de id_rol a nombre de rol usando el usuario del AuthContext
  const { user: authUser } = useAuth();
  
  const getRoleName = (id_rol: number): string => {
    const roles: { [key: number]: string } = {
      1: 'admin',
      2: 'academic', // Cambié 'profesor' por 'academic' para coincidir con tu lógica
      3: 'usuario'
    };
    return roles[id_rol] || 'usuario';
  };

  // Menú base para todos los usuarios
  const baseMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />
    }
  ];

  // Menús específicos por rol usando el sistema actual de tu app
  const roleSpecificItems: { [key: string]: MenuItem[] } = {
    admin: [
      {
        id: 'staff-attendance',
        label: 'Asistencia Personal',
        icon: <Users className="h-5 w-5" />
      },
      {
        id: 'users',
        label: 'Gestión Usuarios',
        icon: <User className="h-5 w-5" />
      },
      {
        id: 'qr-codes',
        label: 'Códigos QR',
        icon: <QrCode className="h-5 w-5" />
      },
      {
        id: 'reports',
        label: 'Reportes',
        icon: <FileText className="h-5 w-5" />
      },
      {
        id: 'justifications',
        label: 'Justificaciones',
        icon: <FileText className="h-5 w-5" />
      },
      {
        id: 'approvals',
        label: 'Aprobaciones',
        icon: <CheckCircle className="h-5 w-5" />
      },
      {
        id: 'settings',
        label: 'Configuración',
        icon: <Settings className="h-5 w-5" />
      }
    ],
    academic: [
      {
        id: 'attendance',
        label: 'Mi Asistencia',
        icon: <Clock className="h-5 w-5" />
      },
      {
        id: 'my-reports',
        label: 'Mis Reportes',
        icon: <FileText className="h-5 w-5" />
      },
      {
        id: 'justifications',
        label: 'Justificaciones',
        icon: <FileText className="h-5 w-5" />
      }
    ],
    usuario: [
      {
        id: 'attendance',
        label: 'Mi Asistencia',
        icon: <Clock className="h-5 w-5" />
      }
    ]
  };

  const getMenuItems = (): MenuItem[] => {
    if (!authUser) return baseMenuItems;

    // ✅ Obtener el nombre del rol basado en id_rol del AuthContext
    const userRole = getRoleName(authUser.id_rol);
    console.log('ID Rol del usuario:', authUser.id_rol);
    console.log('Nombre del rol mapeado:', userRole);
    
    // ✅ Validar que existe el rol y que tiene items
    const roleItems = roleSpecificItems[userRole] || [];
    
    return [...baseMenuItems, ...roleItems];
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose(); // Cerrar sidebar en móviles después de seleccionar
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header del sidebar */}
        <div className="p-6 border-b border-gray-200 mt-16 lg:mt-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {authUser?.nombres} {authUser?.apellidos}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {authUser?.email}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                {getRoleName(authUser?.id_rol || 3).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 h-full overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left
                ${activeTab === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          
          {/* Logout button */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;