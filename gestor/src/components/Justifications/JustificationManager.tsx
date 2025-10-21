import React, { useState } from 'react';
import { useJustificaciones } from '../../hooks/useJustifications';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Edit3,
  Trash2,
  RefreshCw,
  Filter
} from 'lucide-react';

const JustificationManager: React.FC = () => {
  const {
    loading,
    error,
    justificaciones,
    estadisticas,
    motivos,
    crearJustificacion,
    actualizarJustificacion,
    cancelarJustificacion,
    obtenerJustificaciones,
    clearError
  } = useJustificaciones();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [justificacionEditando, setJustificacionEditando] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  // ✅ FORMULARIO DE NUEVA/EDITAR JUSTIFICACIÓN
  const FormularioJustificacion = () => {
    const [formData, setFormData] = useState({
      fecha_justificacion: justificacionEditando?.fecha_justificacion?.split('T')[0] || '',
      motivo: justificacionEditando?.motivo || '',
      descripcion: justificacionEditando?.descripcion || '',
      tipo_justificacion: justificacionEditando?.tipo_justificacion || 'ausencia'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        if (justificacionEditando) {
          await actualizarJustificacion(justificacionEditando.id_justificacion, formData);
        } else {
          await crearJustificacion(formData);
        }
        
        setMostrarFormulario(false);
        setJustificacionEditando(null);
        
        // Resetear formulario
        setFormData({
          fecha_justificacion: '',
          motivo: '',
          descripcion: '',
          tipo_justificacion: 'ausencia'
        });
      } catch (err) {
        console.error('Error guardando justificación:', err);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">
            {justificacionEditando ? 'Editar Justificación' : 'Nueva Justificación'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha a Justificar
              </label>
              <input
                type="date"
                required
                value={formData.fecha_justificacion}
                onChange={(e) => setFormData({...formData, fecha_justificacion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={new Date().toISOString().split('T')[0]}
                min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <select
                required
                value={formData.motivo}
                onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar motivo...</option>
                {motivos.map((motivo) => (
                  <option key={motivo.id} value={motivo.id}>
                    {motivo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.tipo_justificacion}
                onChange={(e) => setFormData({...formData, tipo_justificacion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ausencia">Ausencia</option>
                <option value="retraso">Retraso</option>
                <option value="salida_temprana">Salida Temprana</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                required
                rows={3}
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Describe detalladamente el motivo de la justificación..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setJustificacionEditando(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : justificacionEditando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ✅ OBTENER ICONO DE ESTADO
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rechazada':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelada':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  // ✅ OBTENER COLOR DE ESTADO
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // ✅ FILTRAR JUSTIFICACIONES
  const justificacionesFiltradas = justificaciones.filter(j => 
    !filtroEstado || j.estado_aprobacion === filtroEstado
  );

  if (loading && justificaciones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Cargando justificaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Justificaciones</h1>
          <p className="text-gray-600">Gestiona tus solicitudes de justificación de asistencia</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Justificación</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</p>
                <p className="text-sm text-gray-600">Aprobadas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{estadisticas.rechazadas}</p>
                <p className="text-sm text-gray-600">Rechazadas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border">
        <Filter className="w-5 h-5 text-gray-500" />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
        <button
          onClick={() => obtenerJustificaciones()}
          className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Lista de Justificaciones */}
      <div className="bg-white rounded-lg border">
        {justificacionesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tienes justificaciones registradas</p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear tu primera justificación
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {justificacionesFiltradas.map((justificacion) => (
              <div key={justificacion.id_justificacion} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getEstadoIcon(justificacion.estado_aprobacion)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(justificacion.estado_aprobacion)}`}>
                        {(justificacion.estado ?? justificacion.estado_aprobacion ?? '').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {justificacion.fecha_justificacion
                          ? new Date(justificacion.fecha_justificacion).toLocaleDateString('es-CL')
                          : ''}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <p className="font-medium text-gray-900">
                        {motivos.find(m => m.id === justificacion.motivo)?.label || justificacion.motivo}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{justificacion.descripcion}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Tipo: {justificacion.tipo_justificacion}</span>
                      <span>
                        Solicitado: {justificacion.fecha_solicitud
                          ? new Date(justificacion.fecha_solicitud).toLocaleDateString('es-CL')
                          : ''}
                      </span>
                      {justificacion.fecha_respuesta && (
                        <span>
                          Respondido: {new Date(justificacion.fecha_respuesta).toLocaleDateString('es-CL')}
                        </span>
                      )}
                    </div>
                    
                    {justificacion.observaciones_aprobador && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Observaciones: </span>
                          {justificacion.observaciones_aprobador}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {justificacion.estado_aprobacion === 'pendiente' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setJustificacionEditando(justificacion);
                          setMostrarFormulario(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => cancelarJustificacion(justificacion.id_justificacion)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Cancelar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario Modal */}
      {mostrarFormulario && <FormularioJustificacion />}
    </div>
  );
};

export default JustificationManager;