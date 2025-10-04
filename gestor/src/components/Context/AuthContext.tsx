import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  rut_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  id_rol: number;
  id_cargo: number;
  horas_atrabajar: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: User, userToken: string) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('userData');

        if (savedToken && savedUser) {
          const userData = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(userData);
          setIsAuthenticated(true);
          console.log('Usuario cargado desde localStorage:', userData);
        }
      } catch (error) {
        console.error('Error al cargar datos de autenticación:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User, userToken: string) => {
    try {
      console.log('Login exitoso:', userData);
      
      // Actualizar estado
      setUser(userData);
      setToken(userToken);
      setIsAuthenticated(true);

      // Guardar en localStorage
      localStorage.setItem('authToken', userToken);
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error al hacer login:', error);
    }
  };

  const logout = () => {
    try {
      console.log('Logout realizado');
      
      // Limpiar estado
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);

      // Limpiar localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Error al hacer logout:', error);
    }
  };

  const updateUser = (userData: User) => {
    try {
      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      console.log('Usuario actualizado:', userData);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;