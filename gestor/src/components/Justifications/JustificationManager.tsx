import React, { useState } from 'react';
import { useJustificaciones } from '../../hooks/useJustifications';
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Trash2,
  RefreshCw,
  Filter,
  AlertCircle,
  X
} from 'lucide-react';

const JustificationManager: React.FC = () => {
  const {
    loading,
    error,
    justificaciones,
    estadisticas,
    motivos,
    crearJustificacion,
    eliminarJustificacion,
    obtenerJustificaciones,
    clearError
  } = useJustificaciones();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('');

  // ✅ FORMULARIO MEJORADO
  const FormularioJustificacion = () => {
    const [formData, setFormData] = useState({
      fecha_justificacion: '',
      motivo: '',
      descripcion: '',
      tipoPermiso: 'jornada_completa', // 👈 NUEVO para permiso administrativo
    });

    const motivoSeleccionado = motivos.find(m => m.id === formData.motivo);
    const esPermisoAdministrativo = formData.motivo === 'permiso_administrativo';

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        await crearJustificacion({
          // El backend ahora acepta cualquiera de los dos, pero mandemos ambos por claridad
          fecha: formData.fecha_justificacion,
          fecha_justificacion: formData.fecha_justificacion,
          motivo: formData.motivo,
          descripcion: formData.descripcion.trim() || null,
          // 👇 Solo para permiso administrativo mandamos tipo
          tipo: esPermisoAdministrativo ? formData.tipoPermiso : null,
        });

        setMostrarFormulario(false);
        setFormData({
          fecha_justificacion: '',
          motivo: '',
          descripcion: '',
          tipoPermiso: 'jornada_completa',
        });
      } catch (err) {
        console.error('Error guardando justificación:', err);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Registrar Ausencia
              </h3>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-2">
              Registra el motivo de tu ausencia para mantener un historial completo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Fecha de Ausencia
              </label>
              <input
                type="date"
                required
                value={formData.fecha_justificacion}
                onChange={(e) => setFormData({ ...formData, fecha_justificacion: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                max={new Date().toISOString().split('T')[0]}
                min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo puedes justificar fechas de los últimos 30 días
              </p>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo de la Ausencia
              </label>
              <select
                required
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Selecciona un motivo</option>
                {motivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} {m.es_justificada ? '' : ''}
                  </option>
                ))}
              </select>

              {/* Info del motivo seleccionado */}
              {motivoSeleccionado && (
                <div
                  className={`mt-3 p-4 rounded-lg border-2 ${
                    motivoSeleccionado.es_justificada
                      ? 'bg-green-50 border-green-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {motivoSeleccionado.es_justificada ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          motivoSeleccionado.es_justificada ? 'text-green-800' : 'text-orange-800'
                        }`}
                      >
                        {motivoSeleccionado.es_justificada
                          ? 'Ausencia Justificada'
                          : 'Ausencia No Justificada'}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          motivoSeleccionado.es_justificada ? 'text-green-700' : 'text-orange-700'
                        }`}
                      >
                        {esPermisoAdministrativo
                          ? 'Selecciona si será jornada completa (8h) o media jornada (4h).'
                          : motivoSeleccionado.es_justificada
                          ? `Se compensarán ${motivoSeleccionado.horas_compensadas} horas en tu registro`
                          : 'Esta ausencia no suma horas trabajadas'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opciones especiales para PERMISO ADMINISTRATIVO */}
              {esPermisoAdministrativo && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    Tipo de permiso administrativo
                  </p>

                  <div className="space-y-2 text-sm text-blue-900">
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoPermiso"
                        value="jornada_completa"
                        checked={formData.tipoPermiso === 'jornada_completa'}
                        onChange={(e) =>
                          setFormData({ ...formData, tipoPermiso: e.target.value })
                        }
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-semibold">Jornada completa (8 horas)</span>
                        <br />
                        <span className="text-xs text-blue-700">
                          Se compensarán 8 horas en tu registro de asistencia.
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoPermiso"
                        value="media_manana"
                        checked={formData.tipoPermiso === 'media_manana'}
                        onChange={(e) =>
                          setFormData({ ...formData, tipoPermiso: e.target.value })
                        }
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-semibold">Media jornada – Mañana (4 horas)</span>
                        <br />
                        <span className="text-xs text-blue-700">
                          Se compensarán 4 horas en tu registro (bloque AM).
                        </span>
                      </span>
                    </label>

                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoPermiso"
                        value="media_tarde"
                        checked={formData.tipoPermiso === 'media_tarde'}
                        onChange={(e) =>
                          setFormData({ ...formData, tipoPermiso: e.target.value })
                        }
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-semibold">Media jornada – Tarde (4 horas)</span>
                        <br />
                        <span className="text-xs text-blue-700">
                          Se compensarán 4 horas en tu registro (bloque PM).
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción Adicional (Opcional)
              </label>
              <textarea
                rows={4}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Agrega detalles adicionales sobre tu ausencia..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este campo es opcional, pero puede ayudar a documentar mejor la ausencia
              </p>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.motivo}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Registrar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Filtrar justificaciones
  const justificacionesFiltradas = justificaciones.filter(j => {
    if (!filtroTipo) return true;
    if (filtroTipo === 'justificadas') return j.es_justificada;
    if (filtroTipo === 'no_justificadas') return !j.es_justificada;
    return true;
  });

  if (loading && justificaciones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Cargando ausencias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Ausencias</h1>
          <p className="text-gray-600">Gestiona el registro de tus ausencias laborales</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Registrar Ausencia</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Registradas</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium mb-1">Justificadas</p>
                <p className="text-3xl font-bold text-green-800">{estadisticas.justificadas}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{estadisticas.horas_compensadas_total}h compensadas
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-medium mb-1">No Justificadas</p>
                <p className="text-3xl font-bold text-orange-800">{estadisticas.no_justificadas}</p>
              </div>
              <XCircle className="w-12 h-12 text-orange-600 opacity-30" />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border">
        <Filter className="w-5 h-5 text-gray-500" />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todas las ausencias</option>
          <option value="justificadas">Solo justificadas</option>
          <option value="no_justificadas">Solo no justificadas</option>
        </select>
        <button
          onClick={() => obtenerJustificaciones()}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Lista de Justificaciones */}
      <div className="bg-white rounded-lg border">
        {justificacionesFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No tienes ausencias registradas</p>
            <p className="text-gray-400 text-sm mt-2">
              Registra tus ausencias para mantener un historial completo
            </p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="mt-6 text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar primera ausencia
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {justificacionesFiltradas.map((justificacion) => (
              <div key={justificacion.id_justificacion} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {justificacion.es_justificada ? (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">JUSTIFICADA</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 border border-orange-300 rounded-full">
                          <XCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-semibold text-orange-700">NO JUSTIFICADA</span>
                        </div>
                      )}

                      <span className="text-sm font-medium text-gray-900">
                        {(() => {
                          const [year, month, day] = justificacion.fecha_justificacion
                            .split('-')
                            .map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('es-CL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        })()}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="font-semibold text-gray-900 text-lg">
                        {justificacion.motivo_nombre || justificacion.motivo}
                      </p>
                      {justificacion.descripcion && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border">
                          {justificacion.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                      {justificacion.es_justificada && (
                        <span className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-green-700 font-medium">
                            +{justificacion.horas_compensadas}h compensadas
                          </span>
                        </span>
                      )}
                      <span>
                        Registrado:{' '}
                        {new Date(justificacion.fecha_registro).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de eliminar esta justificación?')) {
                        eliminarJustificacion(justificacion.id_justificacion);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
