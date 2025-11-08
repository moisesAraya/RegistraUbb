import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3000'; // Ajusta según tu configuración

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'academic' | 'secretary' | 'department_head' | 'administrator';
  department: string;
  createdAt: Date;
  isActive: boolean;
}

export interface CreateUserData {
  email: string;
  name: string;
  role: 'academic' | 'secretary' | 'department_head' | 'administrator';
  department: string;
  rut_usuario?: string;
  password?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UserListResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Array<{ rol: string; count: number }>;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Obtener token del localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Headers con autenticación
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Obtener todos los usuarios con filtros
  const fetchUsers = async (filters: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/admin/all?${queryParams}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<UserListResponse> = await response.json();

      if (data.success) {
        // Convertir strings de fecha a objetos Date
        const usersWithDates = data.data.users.map(user => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }));

        setUsers(usersWithDates);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Error al cargar los usuarios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas de usuarios
  const fetchUserStats = async () => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/admin/stats`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<UserStats> = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Error al cargar las estadísticas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      console.error('Error fetching user stats:', err);
    }
  };

  // Crear nuevo usuario
  const createUser = async (userData: CreateUserData) => {
    setLoading(true);
    setError(null);

    try {
      // Separar nombre completo en nombres y apellidos
      const nameParts = userData.name.trim().split(' ');
      const nombres = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ');
      const apellidos = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ');

      const requestBody = {
        nombres,
        apellidos,
        email: userData.email,
        rut_usuario: userData.rut_usuario || '12345678-9', // Requerirás RUT real
        password: userData.password || 'temp123', // Contraseña temporal
        horas_atrabajar: 44,
        id_rol: getRoleId(userData.role),
        id_cargo: 1, // Ajustar según tu estructura
        departamento: userData.department
      };

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();

      if (data.success) {
        await fetchUsers(); // Refrescar la lista
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Error al crear el usuario');
        return { success: false, message: data.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar usuario
  const updateUser = async (userId: string, userData: Partial<CreateUserData>) => {
    setLoading(true);
    setError(null);

    try {
      const requestBody: any = {};

      if (userData.name) {
        const nameParts = userData.name.trim().split(' ');
        requestBody.nombres = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ');
        requestBody.apellidos = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ');
      }

      if (userData.email) requestBody.email = userData.email;
      if (userData.department) requestBody.departamento = userData.department;
      if (userData.role) requestBody.id_rol = getRoleId(userData.role);

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();

      if (data.success) {
        await fetchUsers(); // Refrescar la lista
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Error al actualizar el usuario');
        return { success: false, message: data.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado activo/inactivo
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/admin/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<User> = await response.json();

      if (data.success) {
        // Actualizar el usuario en la lista local
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, isActive } : user
          )
        );
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Error al cambiar el estado del usuario');
        return { success: false, message: data.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();

      if (data.success) {
        // Remover el usuario de la lista local
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Error al eliminar el usuario');
        return { success: false, message: data.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Mapear roles frontend a IDs de backend
  const getRoleId = (role: string): number => {
    const roleMap: { [key: string]: number } = {
      'academic': 1,
      'secretary': 2,
      'department_head': 3,
      'administrator': 4
    };
    return roleMap[role] || 1;
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  return {
    users,
    stats,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchUserStats,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    refetch: () => {
      fetchUsers();
      fetchUserStats();
    }
  };
};