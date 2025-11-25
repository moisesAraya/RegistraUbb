import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserCheck, 
  RefreshCw, 
  AlertCircle,
  Shield,
  Eye,
  EyeOff 
} from 'lucide-react';
import apiClient from '../../services/api';

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
  rol?: {
    id_rol: number;
    nombre_rol: string;
  };
  cargo?: {
    id_cargo: number;
    nombre_cargo: string;
  };
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
  pin?: number;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface Cargo {
  id_cargo: number;
  nombre_cargo: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserManagement: React.FC = () => {
  // Estados principales
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cargoFilter, setCargoFilter] = useState('all');
  
  // Estados para formulario
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<CreateUserData>({
    rut_usuario: '',
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    horas_atrabajar: 44,
    id_rol: undefined,
    id_cargo: undefined,
    pin: 0
  });

  // Use centralized apiClient (withCredentials enabled)

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchAllData();
  }, []);

  // Función para cargar todos los datos
  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsers(),
      fetchRoles(),
      fetchCargos()
    ]);
    setLoading(false);
  };

  // Obtener usuarios
  const fetchUsers = async () => {
    try {
      console.log('📡 Fetching users...');
      const response = await apiClient.get('/usuario');
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
        console.log('✅ Users loaded:', response.data.data.length);
      } else {
        setError(response.data.message || 'Error al cargar usuarios');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Error de conexión');
    }
  };

  // Obtener roles
  const fetchRoles = async () => {
    try {
      console.log('📡 Fetching roles...');
      const response = await apiClient.get('/usuario/roles');
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setRoles(response.data.data);
        console.log('✅ Roles loaded:', response.data.data.length);
        
        // Establecer primer rol como default
        if (response.data.data.length > 0 && !formData.id_rol) {
          setFormData(prev => ({ ...prev, id_rol: response.data.data[0].id_rol }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching roles:', err);
    }
  };

  // Obtener cargos
  const fetchCargos = async () => {
    try {
      console.log('📡 Fetching cargos...');
      const response = await apiClient.get('/usuario/cargos');

      if (response.data.success && Array.isArray(response.data.data)) {
        setCargos(response.data.data);
        console.log('✅ Cargos loaded:', response.data.data.length);
        
        // Establecer primer cargo como default
        if (response.data.data.length > 0 && !formData.id_cargo) {
          setFormData(prev => ({ ...prev, id_cargo: response.data.data[0].id_cargo }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching cargos:', err);
    }
  };

  // Funciones helper para obtener nombres
  const getRoleLabel = (id_rol: number) => {
    const role = roles.find(r => r.id_rol === id_rol);
    return role?.nombre_rol || `Rol ${id_rol}`;
  };

  const getCargoLabel = (id_cargo: number) => {
    const cargo = cargos.find(c => c.id_cargo === id_cargo);
    return cargo?.nombre_cargo || `Cargo ${id_cargo}`;
  };

  // Componente para badge de rol
  const getRoleBadge = (id_rol: number) => {
    const roleColors: { [key: number]: string } = {
      1: 'bg-red-100 text-red-800 border-red-200',
      2: 'bg-blue-100 text-blue-800 border-blue-200',
      3: 'bg-green-100 text-green-800 border-green-200',
      4: 'bg-purple-100 text-purple-800 border-purple-200',
      5: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    const colorClass = roleColors[id_rol] || 'bg-gray-100 text-gray-800 border-gray-200';
    const role = roles.find(r => r.id_rol === id_rol);
    const icon = id_rol === 1 ? (
      <Shield className="w-3 h-3" />
    ) : (
      <UserCheck className="w-3 h-3" />
    );

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${colorClass}`}>
        {icon}
        {role?.nombre_rol || `Rol ${id_rol}`}
      </span>
    );
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rut_usuario.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.id_rol.toString() === roleFilter;
    const matchesCargo = cargoFilter === 'all' || user.id_cargo.toString() === cargoFilter;

    return matchesSearch && matchesRole && matchesCargo;
  });

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'horas_atrabajar' || name === 'id_rol' || name === 'id_cargo' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      rut_usuario: '',
      nombres: '',
      apellidos: '',
      email: '',
      password: '',
      horas_atrabajar: 44,
      id_rol: roles.length > 0 ? roles[0].id_rol : undefined,
      id_cargo: cargos.length > 0 ? cargos[0].id_cargo : undefined
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      console.log('🆕 Creating user:', formData);
      const response = await apiClient.post('/usuario', formData);
      
      if (response.data.success) {
        setSuccess('Usuario creado exitosamente');
        setShowUserForm(false);
        clearForm();
        await fetchUsers();
      } else {
        setError(response.data.message || 'Error al crear usuario');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Error al crear usuario');
    } finally {
      setActionLoading(false);
    }
  };

  // Actualizar usuario
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setActionLoading(true);
    
    try {
      // Filtrar campos que no se deben enviar
      const { rut_usuario, ...updateData } = formData;
      
      // Si no hay password, no enviarla
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      
      console.log('🔄 Updating user:', { id: editingUser.rut_usuario, data: updateData });
      const response = await apiClient.put(`/usuario/${editingUser.rut_usuario}`, updateData);
      
      if (response.data.success) {
        setSuccess('Usuario actualizado exitosamente');
        setShowUserForm(false);
        clearForm();
        await fetchUsers();
      } else {
        setError(response.data.message || 'Error al actualizar usuario');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  // Preparar edición
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      rut_usuario: user.rut_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      password: '',
      horas_atrabajar: user.horas_atrabajar,
      id_rol: user.id_rol,
      id_cargo: user.id_cargo
    });
    setShowUserForm(true);
  };

  // Eliminar usuario
  const handleDeleteUser = async (rutUsuario: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este usuario?')) return;
    
    setActionLoading(true);
    try {
      console.log('🗑️ Deleting user:', rutUsuario);
      const response = await apiClient.delete(`/usuario/${rutUsuario}`);
      
      if (response.data.success) {
        setSuccess('Usuario eliminado exitosamente');
        await fetchUsers();
      } else {
        setError(response.data.message || 'Error al eliminar usuario');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Error al eliminar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  // Preparar nuevo usuario
  const handleNewUserClick = () => {
    clearForm();
    setShowUserForm(true);
  };

  // Calcular estadísticas
  const totalUsers = users.length;
  const roleStats = roles.map(role => ({
    ...role,
    count: users.filter(u => u.id_rol === role.id_rol).length
  }));

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
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            
            <button
              onClick={handleNewUserClick}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-900">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          {roleStats.slice(0, 3).map((roleStat, index) => {
            const colors = [
              { bg: 'bg-green-50', text: 'text-green-600', textBold: 'text-green-900', icon: 'text-green-600' },
              { bg: 'bg-purple-50', text: 'text-purple-600', textBold: 'text-purple-900', icon: 'text-purple-600' },
              { bg: 'bg-red-50', text: 'text-red-600', textBold: 'text-red-900', icon: 'text-red-600' }
            ];
            const color = colors[index] || colors[0];
            
            return (
              <div key={roleStat.id_rol} className={`${color.bg} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${color.text} font-medium`}>{roleStat.nombre_rol}</p>
                    <p className={`text-2xl font-bold ${color.textBold}`}>{roleStat.count}</p>
                  </div>
                  <UserCheck className={`w-8 h-8 ${color.icon}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulario */}
      {showUserForm && (
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
                  name="rut_usuario"
                  value={formData.rut_usuario}
                  onChange={handleInputChange}
                  placeholder="12345678-9"
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleInputChange}
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
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas a Trabajar *
                </label>
                <input
                  type="number"
                  name="horas_atrabajar"
                  value={formData.horas_atrabajar}
                  onChange={handleInputChange}
                  min="1"
                  max="44"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  name="id_rol"
                  value={formData.id_rol || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map(role => (
                    <option key={role.id_rol} value={role.id_rol}>
                      {role.nombre_rol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                <select
                  name="id_cargo"
                  value={formData.id_cargo || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar cargo</option>
                  {cargos.map(cargo => (
                    <option key={cargo.id_cargo} value={cargo.id_cargo}>
                      {cargo.nombre_cargo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN *
                </label>
                <input
                  type="number"
                  name="pin"
                  value={formData.pin || ''}
                  onChange={handleInputChange}
                  min="1000"
                  max="9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <span className="text-xs text-gray-500">Debe ser un PIN de 4 dígitos</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Procesando...' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserForm(false);
                  clearForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o RUT..."
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
              {roles.map(role => (
                <option key={role.id_rol} value={role.id_rol.toString()}>
                  {role.nombre_rol}
                </option>
              ))}
            </select>

            <select
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los cargos</option>
              {cargos.map(cargo => (
                <option key={cargo.id_cargo} value={cargo.id_cargo.toString()}>
                  {cargo.nombre_cargo}
                </option>
              ))}
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
          {loading ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No se encontraron usuarios con los filtros aplicados.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.rut_usuario} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {user.nombres} {user.apellidos}
                      </h4>
                      {getRoleBadge(user.id_rol)}
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>RUT: {user.rut_usuario}</span>
                      <span>{user.email}</span>
                      <span>Cargo: {getCargoLabel(user.id_cargo)}</span>
                      <span>Horas: {user.horas_atrabajar}hrs</span>
                      {user.createdAt && (
                        <span>
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(user)}
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