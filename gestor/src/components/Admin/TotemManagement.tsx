import React, { useState, useEffect } from 'react';
import {
  Settings, Plus, Edit, Trash2, Search, MapPin, Save, X,
  AlertTriangle, CheckCircle, RefreshCw, Activity
} from 'lucide-react';

interface Totem {
  id_totem: number;
  ubicacion: string;
  descripcion: string | null;
}

interface TotemStats {
  total_totems: number;
  con_descripcion: number;
  sin_descripcion: number;
  porcentaje_con_descripcion: number;
  palabras_comunes_ubicacion: Array<{
    palabra: string;
    count: number;
  }>;
  generated_at: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const TotemManagement: React.FC = () => {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [stats, setStats] = useState<TotemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTotem, setEditingTotem] = useState<Totem | null>(null);
  const [formData, setFormData] = useState({ ubicacion: '', descripcion: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch totems
  const fetchTotems = async (search = '') => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const url = search ? 
        `${API_URL}/totems?search=${encodeURIComponent(search)}` : 
        `${API_URL}/totems`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTotems(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching totems:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar totems');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/totems/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Create totem
  const createTotem = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/totems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error al crear totem');
      }

      await fetchTotems(searchTerm);
      await fetchStats();
      setShowCreateModal(false);
      setFormData({ ubicacion: '', descripcion: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear totem');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update totem
  const updateTotem = async () => {
    if (!editingTotem) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/totems/${editingTotem.id_totem}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error al actualizar totem');
      }

      await fetchTotems(searchTerm);
      await fetchStats();
      setEditingTotem(null);
      setFormData({ ubicacion: '', descripcion: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar totem');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete totem
  const deleteTotem = async (id: number, ubicacion: string) => {
    if (!confirm(`¿Estás seguro de eliminar el totem "${ubicacion}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/totems/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error al eliminar totem');
      }

      await fetchTotems(searchTerm);
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar totem');
    }
  };

  // Effects
  useEffect(() => {
    fetchTotems();
    fetchStats();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        fetchTotems(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const openCreateModal = () => {
    setFormData({ ubicacion: '', descripcion: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (totem: Totem) => {
    setFormData({ 
      ubicacion: totem.ubicacion, 
      descripcion: totem.descripcion || '' 
    });
    setEditingTotem(totem);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingTotem(null);
    setFormData({ ubicacion: '', descripcion: '' });
    setError(null);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Settings className="h-5 w-5 text-blue-600 mr-2" />
            Gestión de Totems
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Administra los puntos de marcaje del sistema
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Totem</span>
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.total_totems}</p>
            <p className="text-sm text-slate-600">Total Totems</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.con_descripcion}</p>
            <p className="text-sm text-slate-600">Con Descripción</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.sin_descripcion}</p>
            <p className="text-sm text-slate-600">Sin Descripción</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.porcentaje_con_descripcion}%</p>
            <p className="text-sm text-slate-600">Completitud</p>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar totems por ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Lista de Totems */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <span className="text-slate-600">Cargando totems...</span>
          </div>
        ) : totems.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {searchTerm ? `No se encontraron totems para "${searchTerm}"` : 'No hay totems registrados'}
            </p>
          </div>
        ) : (
          totems.map((totem) => (
            <div key={totem.id_totem} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{totem.ubicacion}</p>
                  {totem.descripcion && (
                    <p className="text-sm text-slate-600">{totem.descripcion}</p>
                  )}
                  <p className="text-xs text-slate-500">ID: {totem.id_totem}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal(totem)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar totem"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTotem(totem.id_totem, totem.ubicacion)}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar totem"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar */}
      {(showCreateModal || editingTotem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900">
                {editingTotem ? 'Editar Totem' : 'Nuevo Totem'}
              </h4>
              <button
                onClick={closeModals}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                  placeholder="Ej: Entrada Principal, Laboratorio 1, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción adicional del totem..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={closeModals}
                disabled={isSubmitting}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={editingTotem ? updateTotem : createTotem}
                disabled={isSubmitting || !formData.ubicacion.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{editingTotem ? 'Actualizar' : 'Crear'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotemManagement;