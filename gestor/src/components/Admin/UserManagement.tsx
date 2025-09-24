import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, UserCheck, UserX, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Interfaces para los tipos de datos
interface User {
  rut_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  horas_atrabajar: number;
  id_rol: number;
  id_cargo: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateUserData {
  rut_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  horas_atrabajar: number;
  id_rol?: number;
  id_cargo?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserManagement: React.FC = () => {
  // Estados para gestión de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estados locales para filtros y formulario
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter] = useState('all');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState<CreateUserData>({
    rut_usuario: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    horas_atrabajar: 44,
    id_rol: 1,
    id_cargo: 1
  });

  // Obtener token del localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  // Configurar axios con interceptores
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para agregar token a las requests
  apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Obtener todos los usuarios
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/usuario');
      
      if (response.data.success) {
        setUsers(response.data.data || []);
      } else {
        setError(response.data.message || 'Error al cargar los usuarios');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear usuario
  const createUser = async (userData: CreateUserData) => {
    try {
      const response = await apiClient.post('/usuario', userData);

      if (response.data.success) {
        await fetchUsers(); // Refrescar la lista
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      return { success: false, message: errorMessage };
    }
  };

  // Actualizar usuario
  const updateUser = async (rut_usuario: string, userData: CreateUserData) => {
    try {
      const response = await apiClient.put(`/usuario/${rut_usuario}`, userData);

      if (response.data.success) {
        await fetchUsers(); // Refrescar la lista
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      return { success: false, message: errorMessage };
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId: string) => {
    try {
      const response = await apiClient.delete(`/usuario/${userId}`);

      if (response.data.success) {
        await fetchUsers(); // Refrescar la lista
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      return { success: false, message: errorMessage };
    }
  };

  // Función para refrescar datos
  const refetch = fetchUsers;

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Funciones para manejar roles (basadas en id_rol)
  const getRoleLabel = (id_rol: number) => {
    switch (id_rol) {
      case 1: return 'Académico';
      case 2: return 'Secretaría';
      case 3: return 'Jefe de Departamento';
      case 4: return 'Administrador';
      default: return 'Usuario';
    }
  };

  const getRoleBadge = (id_rol: number) => {
    const roleConfig = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-purple-100 text-purple-800',
      4: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleConfig[id_rol as keyof typeof roleConfig] || 'bg-gray-100 text-gray-800'}`}>
        {getRoleLabel(id_rol)}
      </span>
    );
  };

  // Aplicar filtros localmente
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === '1' && user.id_rol === 1) ||
      (roleFilter === '2' && user.id_rol === 2) ||
      (roleFilter === '3' && user.id_rol === 3) ||
      (roleFilter === '4' && user.id_rol === 4);
    
    // Por ahora no tenemos campo de estado activo/inactivo en el backend
    const matchesStatus = statusFilter === 'all';
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const result = await createUser(newUser);
      if (result.success) {
        setNewUser({
          rut_usuario: '',
          nombres: '',
          apellidos: '',
          email: '',
          password: '',
          horas_atrabajar: 44,
          id_rol: 1,
          id_cargo: 1
        });
        setShowNewUserForm(false);
        alert('Usuario creado exitosamente');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      alert('Error al crear el usuario');
    } finally {
      setActionLoading(false);
    }
  };

  // (Eliminada función duplicada handleEditUser para evitar el error de redeclaración)


  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      rut_usuario: user.rut_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      password: '',
      horas_atrabajar: user.horas_atrabajar,
      id_rol: user.id_rol,
      id_cargo: user.id_cargo
    });
    setShowNewUserForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    if (editingUser) {
      try {
        const result = await updateUser(editingUser.rut_usuario, newUser);
        if (result.success) {
          setEditingUser(null);
          setNewUser({
            rut_usuario: '',
            nombres: '',
            apellidos: '',
            email: '',
            password: '',
            horas_atrabajar: 44,
            id_rol: 1,
            id_cargo: 1
          });
          setShowNewUserForm(false);
          alert('Usuario actualizado exitosamente');
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (err) {
        alert('Error al actualizar el usuario');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      setActionLoading(true);
      try {
        const result = await deleteUser(userId);
        if (result.success) {
          alert(result.message);
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (err) {
        alert('Error al eliminar el usuario');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Calcular estadísticas localmente
  const totalUsers = users.length;
  const academicUsers = users.filter(u => u.id_rol === 1).length;
  const adminUsers = users.filter(u => u.id_rol === 4).length;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Gestión de Usuarios
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            
            <button
              onClick={() => {
                setEditingUser(null);
                setNewUser({
                  rut_usuario: '',
                  nombres: '',
                  apellidos: '',
                  email: '',
                  password: '',
                  horas_atrabajar: 44,
                  id_rol: 1,
                  id_cargo: 1
                });
                setShowNewUserForm(!showNewUserForm);
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-900">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Académicos</p>
                <p className="text-2xl font-bold text-green-900">{academicUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Administradores</p>
                <p className="text-2xl font-bold text-red-900">{adminUsers}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Formulario nuevo/editar usuario */}
      {showNewUserForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h4>
          
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  value={newUser.rut_usuario}
                  onChange={(e) => setNewUser({ ...newUser, rut_usuario: e.target.value })}
                  placeholder="12345678-9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  value={newUser.nombres}
                  onChange={(e) => setNewUser({ ...newUser, nombres: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={newUser.apellidos}
                  onChange={(e) => setNewUser({ ...newUser, apellidos: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!editingUser}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={newUser.id_rol}
                  onChange={(e) => setNewUser({ ...newUser, id_rol: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={1}>Académico</option>
                  <option value={2}>Secretaría</option>
                  <option value={3}>Jefe de Departamento</option>
                  <option value={4}>Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                <select
                  value={newUser.id_cargo}
                  onChange={(e) => setNewUser({ ...newUser, id_cargo: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={1}>Docente</option>
                  <option value={2}>Administrativo</option>
                  <option value={3}>Directivo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas a Trabajar *
                </label>
                <input
                  type="number"
                  value={newUser.horas_atrabajar}
                  onChange={(e) => setNewUser({ ...newUser, horas_atrabajar: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="44"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewUserForm(false);
                  setEditingUser(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los roles</option>
              <option value="1">Académicos</option>
              <option value="2">Secretaría</option>
              <option value="3">Jefe de Departamento</option>
              <option value="4">Administrador</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Usuarios ({filteredUsers.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No se encontraron usuarios con los filtros aplicados.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.rut_usuario} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{user.nombres} {user.apellidos}</h4>
                      {getRoleBadge(user.id_rol)}
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>RUT: {user.rut_usuario}</span>
                      <span>{user.email}</span>
                      <span>Horas: {user.horas_atrabajar}hrs</span>
                      {user.createdAt && <span>Creado: {formatDate(new Date(user.createdAt))}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar usuario"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(user.rut_usuario)}
                      disabled={actionLoading}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;