import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ✅ Interfaz del Usuario
interface User {
  rut_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  id_rol: number;
  id_cargo: number;
  horas_atrabajar?: number;
}

// ✅ Interfaz del Contexto
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, authToken: string | null) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

// ✅ Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Props del Provider
interface AuthProviderProps {
  children: ReactNode;
}

// ✅ Provider del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔧 AuthProvider iniciado');

  // ✅ Verificar si está autenticado
  const isAuthenticated = !!(user && token);

  // ✅ Función para hacer login
  const login = (userData: User, authToken: string | null) => {
    console.log('🔐 AuthContext.login() llamado');
    console.log('👤 Usuario:', userData.rut_usuario);

    if (authToken && typeof authToken === 'string') {
      console.log('🔑 Token recibido (primeros 30 chars):', authToken.substring(0, 30) + '...');
    } else {
      console.log('🔑 No se recibió token (se usará cookie o flujo del servidor)');
    }

    try {
      // Guardar en localStorage solo si tenemos token explícito
      if (authToken && typeof authToken === 'string') {
        localStorage.setItem('token', authToken);
      }
      localStorage.setItem('user', JSON.stringify(userData));

      // Actualizar estado
      setUser(userData);
      setToken(authToken);

      console.log('✅ Login exitoso - Estado actualizado');
      console.log('💾 Datos guardados en localStorage (si había token)');

    } catch (error) {
      console.error('❌ Error en login:', error);
    }
  };

  // ✅ Función para logout
  const logout = () => {
    console.log('🚪 AuthContext.logout() llamado');
    
    try {
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Limpiar estado
      setUser(null);
      setToken(null);
      
      console.log('✅ Logout exitoso - Estado limpiado');
      
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  };

  // ✅ Verificar autenticación
  const checkAuth = (): boolean => {
    const currentToken = localStorage.getItem('token');
    const currentUser = localStorage.getItem('user');
    
    if (!currentToken || !currentUser) {
      return false;
    }
    
    try {
      // Verificar si el token no ha expirado
      const payload = JSON.parse(atob(currentToken.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      
      if (!isValid) {
        console.log('⏰ Token expirado');
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      logout();
      return false;
    }
  };

  // ✅ Cargar datos al inicializar
  useEffect(() => {
    console.log('🔍 AuthContext - Inicializando useEffect...');
    
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUserData = localStorage.getItem('user');
        
        console.log('💾 Datos encontrados en localStorage:', {
          token: !!savedToken,
          user: !!savedUserData,
          tokenLength: savedToken?.length || 0
        });
        
        if (savedToken && savedUserData) {
          // Verificar token
          const payload = JSON.parse(atob(savedToken.split('.')[1]));
          console.log('🔍 Token payload:', {
            rut: payload.rut_usuario,
            exp: new Date(payload.exp * 1000),
            valid: payload.exp * 1000 > Date.now()
          });
          
          if (payload.exp * 1000 > Date.now()) {
            // Token válido
            const userData = JSON.parse(savedUserData);
            setToken(savedToken);
            setUser(userData);
            console.log('✅ Usuario restaurado desde localStorage:', userData.rut_usuario);
          } else {
            // Token expirado
            console.log('⏰ Token expirado, limpiando datos...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          console.log('ℹ️ No hay datos de autenticación guardados');
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        console.log('✅ AuthContext inicialización completada');
      }
    };

    initializeAuth();
  }, []);

  // ✅ Debug de estado actual
  useEffect(() => {
    console.log('📊 AuthContext Estado Actual:', {
      user: user?.rut_usuario || 'null',
      token: token ? `${token.substring(0, 20)}...` : 'null',
      isAuthenticated,
      loading
    });
  }, [user, token, isAuthenticated, loading]);

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// ✅ Exportar contexto para uso directo si es necesario
export { AuthContext };
export type { User, AuthContextType };