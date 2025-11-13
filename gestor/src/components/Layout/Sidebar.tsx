import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import {
  Home,
  Clock,
  FileText,
  Settings,
  LogOut,
  User,
  QrCode,
  ChevronRight,
  Award,
  BarChart3,
  Shield,
  CreditCard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  color?: string;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  onClose 
}) => {
  const { user, logout } = useAuth();
  const { dashboardData } = useDashboard();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getRoleName = (id_rol: number): string => {
    const roles: { [key: number]: string } = {
      1: 'admin',
      2: 'academic',
      3: 'usuario'
    };
    return roles[id_rol] || 'usuario';
  };

  const getRoleInfo = (id_rol: number) => {
    const roleInfo: { [key: number]: { name: string; color: string; bgColor: string; icon: React.ReactNode } } = {
      1: { 
        name: 'Administrador', 
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-50 border-red-200 text-red-700',
        icon: <Shield className="h-4 w-4" />
      },
      2: { 
        name: 'Académico', 
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: <Award className="h-4 w-4" />
      },
      3: { 
        name: 'Usuario', 
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50 border-green-200 text-green-700',
        icon: <User className="h-4 w-4" />
      }
    };
    return roleInfo[id_rol] || roleInfo[3];
  };

  // Menú base solo para académicos y usuarios regulares
  const getBaseMenuItems = (userRole: string): MenuItem[] => {
    if (userRole === 'admin') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <Home className="h-5 w-5" />,
        }
      ];
    }
    
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <Home className="h-5 w-5" />,
      },
      {
        id: 'my-qr-code',
        label: 'Mi Código QR',
        icon: <QrCode className="h-5 w-5" />,
      },
      {
        id: 'id-card',
        label: 'Mi Tarjeta ID',
        icon: <CreditCard className="h-5 w-5" />,
      }
    ];
  };

  // Menús específicos por rol
  const roleSpecificItems: { [key: string]: MenuItem[] } = {
    admin: [
      {
        id: 'users',
        label: 'Gestión Usuarios',
        icon: <User className="h-5 w-5" />,
      },
      {
        id: 'totems',
        label: 'Gestión Totems',
        icon: <Settings className="h-5 w-5" />,
      },
      {
        id: 'reports',
        label: 'Reportes',
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        id: 'settings',
        label: 'Configuración',
        icon: <Settings className="h-5 w-5" />,
      }
    ],
    academic: [
      {
        id: 'attendance',
        label: 'Mi Asistencia',
        icon: <Clock className="h-5 w-5" />,
      },
      {
        id: 'my-reports',
        label: 'Mis Reportes',
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        id: 'justifications',
        label: 'Justificaciones',
        icon: <FileText className="h-5 w-5" />,
      }
    ],
    usuario: [
      {
        id: 'attendance',
        label: 'Mi Asistencia',
        icon: <Clock className="h-5 w-5" />,
      },
      {
        id: 'justifications',
        label: 'Justificaciones',
        icon: <FileText className="h-5 w-5" />,
      }
    ]
  };

  const getMenuItems = (): MenuItem[] => {
    if (!user) return getBaseMenuItems('usuario');

    const userRole = getRoleName(user.id_rol);
    const roleItems = roleSpecificItems[userRole] || [];
    
    return [...getBaseMenuItems(userRole), ...roleItems];
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // ✅ Actualizar tab activo basado en la ruta
  React.useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') onTabChange('dashboard');
    else if (path === '/qr') onTabChange('my-qr-code');
    else if (path === '/attendance') onTabChange('attendance');
    else if (path === '/reports') onTabChange('reports');
    else if (path === '/users') onTabChange('users');
    else if (path === '/justifications') onTabChange('justifications');
    else if (path === '/settings') onTabChange('settings');
    else if (path === '/id-card') onTabChange('id-card');
    else if (path === '/totems') onTabChange('totems');
  }, [location.pathname, onTabChange]);

  // ✅ Función para manejar navegación
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose();
    
    // Navegar a la ruta correspondiente
    switch (tabId) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'my-qr-code':
        navigate('/qr');
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'reports':
      case 'my-reports':
        navigate('/reports');
        break;
      case 'users':
        navigate('/users');
        break;
      case 'justifications':
        navigate('/justifications');
        break;
      case 'totems':
        navigate('/totems');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'id-card':
        navigate('/id-card');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const menuItems = getMenuItems();
  const roleInfo = user ? getRoleInfo(user.id_rol) : getRoleInfo(3);
  const nombreCompleto = user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() : '';
  const initials = user ? `${user.nombres?.charAt(0) || ''}${user.apellidos?.charAt(0) || ''}`.toUpperCase() : 'U';

  if (!user) return null;

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - ✅ ARREGLADO CON FLEX COLUMN */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-80 bg-white border-r border-slate-200 shadow-xl transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        
        {/* Header del sidebar - Solo info del usuario */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 p-6 mt-16 lg:mt-0 flex-shrink-0">
          {/* User info */}
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 bg-gradient-to-r ${roleInfo.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
              <div className="text-xl font-bold">
                {initials}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-slate-900 truncate">
                {nombreCompleto}
              </p>
              <p className="text-slate-600 text-sm truncate mb-2">
                {user.rut_usuario}
              </p>
              <div className="flex items-center space-x-2">
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border
                  ${roleInfo.bgColor}
                `}>
                  {roleInfo.icon}
                  <span className="ml-1.5">{roleInfo.name}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - ✅ FLEX-1 PARA OCUPAR ESPACIO DISPONIBLE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
                Navegación
              </p>
            </div>
            
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  group flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeTab === item.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    transition-all duration-200
                    ${activeTab === item.id ? 'text-white' : 'group-hover:scale-110'}
                  `}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className={`
                      px-2 py-1 text-xs font-bold rounded-full
                      ${activeTab === item.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-600'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                  
                  <ChevronRight className={`
                    h-4 w-4 transition-all duration-200
                    ${activeTab === item.id ? 'text-white rotate-90' : 'text-slate-400 group-hover:text-slate-600'}
                    ${hoveredItem === item.id ? 'translate-x-1' : ''}
                  `} />
                </div>
              </button>
            ))}
            
            {/* Logout button */}
            <div className="pt-6 mt-6 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="group flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Cerrar Sesión</span>
                </div>
                <ChevronRight className="h-4 w-4 text-red-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-200" />
              </button>
            </div>
          </nav>
        </div>

        {/* Footer con stats - ✅ FIJO EN LA PARTE INFERIOR */}
        <div className="px-4 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
              <div className="text-lg font-bold text-blue-600">
                {dashboardData?.personal_basic_stats?.attendance_rate || 94}%
              </div>
              <div className="text-xs text-slate-500">Asistencia</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
              <div className="text-lg font-bold text-green-600">
                {dashboardData?.personal_basic_stats?.week_hours || 38}h
              </div>
              <div className="text-xs text-slate-500">Esta semana</div>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center justify-center mt-3 space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-500">Sistema activo</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;