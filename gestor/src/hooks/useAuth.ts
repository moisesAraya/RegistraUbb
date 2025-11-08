import { useState, useEffect } from 'react';
import type { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate login API call
      const mockUser: User = {
        id: '1',
        email: email,
        name: email.includes('jefe') ? 'Dr. Juan Pérez' : 
              email.includes('secretaria') ? 'María González' :
              email.includes('admin') ? 'Carlos Admin' : 'Prof. Ana López',
        role: email.includes('jefe') ? 'department_head' :
              email.includes('secretaria') ? 'secretary' :
              email.includes('admin') ? 'administrator' : 'academic',
        department: 'Sistemas de Información',
        createdAt: new Date(),
        isActive: true
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error de autenticación' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, loading, login, logout };
};