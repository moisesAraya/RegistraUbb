import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX } from 'lucide-react';
import type { User } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'ana.lopez@ubb.cl',
      name: 'Prof. Ana López',
      role: 'academic',
      department: 'Sistemas de Información',
      createdAt: new Date(2023, 5, 15),
      isActive: true
    },
    {
      id: '2',
      email: 'carlos.mendoza@ubb.cl',
      name: 'Dr. Carlos Mendoza',
      role: 'academic',
      department: 'Sistemas de Información',
      createdAt: new Date(2023, 7, 20),
      isActive: true
    },
    {
      id: '3',
      email: 'maria.gonzalez@ubb.cl',
      name: 'María González',
      role: 'secretary',
      department: 'Sistemas de Información',
      createdAt: new Date(2023, 3, 10),
      isActive: true
    },
    {
      id: '4',
      email: 'juan.perez@ubb.cl',
      name: 'Dr. Juan Pérez',
      role: 'department_head',
      department: 'Sistemas de Información',
      createdAt: new Date(2022, 11, 5),
      isActive: true
    },
    {
      id: '5',
      email: 'pedro.silva@ubb.cl',
      name: 'Prof. Pedro Silva',
      role: 'academic',
      department: 'Sistemas de Información',
      createdAt: new Date(2023, 9, 12),
      isActive: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'academic' as const,
    department: 'Sistemas de Información'
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'academic': return 'Académico';
      case 'secretary': return 'Secretaría';
      case 'department_head': return 'Jefe de Departamento';
      case 'administrator': return 'Administrador';
      default: return role;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      academic: 'bg-blue-100 text-blue-800',
      secretary: 'bg-green-100 text-green-800',
      department_head: 'bg-purple-100 text-purple-800',
      administrator: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleConfig[role as keyof typeof roleConfig]}`}>
        {getRoleLabel(role)}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      createdAt: new Date(),
      isActive: true
    };

    setUsers(prev => [...prev, user]);
    setNewUser({
      email: '',
      name: '',
      role: 'academic',
      department: 'Sistemas de Información'
    });
    setShowNewUserForm(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    });
    setShowNewUserForm(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...newUser }
          : user
      ));
      
      setEditingUser(null);
      setNewUser({
        email: '',
        name: '',
        role: 'academic',
        department: 'Sistemas de Información'
      });
      setShowNewUserForm(false);
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    ));
  };

  const deleteUser = (userId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;

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
          
          <button
            onClick={() => {
              setEditingUser(null);
              setNewUser({
                email: '',
                name: '',
                role: 'academic',
                department: 'Sistemas de Información'
              });
              setShowNewUserForm(!showNewUserForm);
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Activos</p>
                <p className="text-2xl font-bold text-green-900">{activeUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Inactivos</p>
                <p className="text-2xl font-bold text-red-900">{inactiveUsers}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="academic">Académico</option>
                  <option value="secretary">Secretaría</option>
                  <option value="department_head">Jefe de Departamento</option>
                  <option value="administrator">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento *
                </label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
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
              <option value="academic">Académicos</option>
              <option value="secretary">Secretaría</option>
              <option value="department_head">Jefe de Departamento</option>
              <option value="administrator">Administrador</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
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
              <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{user.name}</h4>
                      {getRoleBadge(user.role)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>{user.email}</span>
                      <span>{user.department}</span>
                      <span>Creado: {formatDate(user.createdAt)}</span>
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
                      onClick={() => toggleUserStatus(user.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isActive
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                      title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
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