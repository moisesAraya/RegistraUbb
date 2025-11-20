import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Clock, Calendar, CheckCircle, XCircle, TrendingUp, BarChart3, Shield, Edit2, Trash2 
} from 'lucide-react';
import { useAsistencia } from '../../hooks/useAsistencia';

const AttendanceList: React.FC = () => {
  const {
    asistenciaData,
    estadisticas,
    isLoading,
    error,
    refetch,
    fetchAsistencia,
    fetchEstadisticas,
    updateMarcajeManual,
    deleteMarcajeManual,
  } = useAsistencia();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Estado para edición
  const [editing, setEditing] = useState<null | {
    id_marcaje: number;
    date: string;
    checkInTime: string;
    checkOutTime: string;
    notes: string;
    location: string;
  }>(null);

  useEffect(() => {
    fetchAsistencia(selectedMonth, selectedYear);
    fetchEstadisticas(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // ---------- HELPERS ----------

  const normalizeFecha = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value.substring(0, 10);
    if (value instanceof Date) return value.toISOString().substring(0, 10);
    return null;
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'presente':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'falta':
      case 'ausente':
      case 'no_justificada':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'justificada':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'presente':
        return 'bg-green-100 text-green-800';
      case 'justificada':
        return 'bg-green-50 text-green-800 border border-green-300';
      case 'no_justificada':
      case 'falta':
      case 'ausente':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[month - 1]}`;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';

    // Caso ISO con "T"
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    // Caso "HH:MM:SS" o "HH:MM"
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const [h, m] = parts;
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }

    return timeString;
  };

  const extractTimeForInput = (timeString: string | null): string => {
    if (!timeString) return '';
    if (timeString.includes('T')) {
      const d = new Date(timeString);
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }
    // "HH:MM:SS" -> "HH:MM"
    const parts = timeString.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return '';
  };

  // ---------- MERGE ASISTENCIAS + JUSTIFICACIONES ----------

  const registrosAsistencia: any[] = asistenciaData?.asistencias || [];

  const rawJustificaciones: any[] =
    (asistenciaData as any)?.justificaciones ||
    (asistenciaData as any)?.faltas ||
    [];

  const registrosJustificados = rawJustificaciones.map((j: any) => {
    const fecha =
      normalizeFecha(j.fecha) ||
      normalizeFecha(j.fecha_justificacion) ||
      '';

    return {
      fecha,
      horaIngreso: null,
      horaSalida: null,
      horasTrabajadas: j.horas_compensadas || 0,
      estado: j.es_justificada ? 'justificada' : 'no_justificada',
      observacion: j.descripcion || '',
      justificacion: {
        motivo: j.motivo,
        descripcion: j.descripcion,
        es_justificada: !!j.es_justificada,
        horas_compensadas: j.horas_compensadas || 0
      },
      // este flag ya no lo usamos para decidir si es editable
      es_manual: false,
    };
  });

  let allRegistros = [...registrosAsistencia, ...registrosJustificados];

  // Filtro por fecha
  if (dateFilter) {
    allRegistros = allRegistros.filter((asistencia: any) => {
      const f = normalizeFecha(asistencia.fecha) || asistencia.fecha;
      return f === dateFilter;
    });
  }

  // Orden
  allRegistros.sort((a: any, b: any) => {
    const fechaA = new Date((normalizeFecha(a.fecha) || a.fecha) + 'T' + (a.horaIngreso || '00:00:00'));
    const fechaB = new Date((normalizeFecha(b.fecha) || b.fecha) + 'T' + (b.horaIngreso || '00:00:00'));
    if (sortOrder === 'desc') return fechaB.getTime() - fechaA.getTime();
    return fechaA.getTime() - fechaB.getTime();
  });

  console.log('📌 Registros que se están pintando en la lista:', allRegistros);

  // ---------- EDIT / DELETE HANDLERS ----------

  const handleEditClick = (registro: any) => {
    if (!registro.id_marcaje) return;

    const fechaNorm = normalizeFecha(registro.fecha) || registro.fecha;
    setEditing({
      id_marcaje: registro.id_marcaje,
      date: fechaNorm,
      checkInTime: extractTimeForInput(registro.horaIngreso),
      checkOutTime: extractTimeForInput(registro.horaSalida),
      notes: registro.observacion || '',
      location: registro.ubicacion || '',
    });
  };

  const handleDeleteClick = async (registro: any) => {
    if (!registro.id_marcaje) return;
    const ok = window.confirm('¿Seguro que quieres eliminar este marcaje? Esta acción no se puede deshacer.');
    if (!ok) return;

    const result = await deleteMarcajeManual(registro.id_marcaje);
    if (!result.success) {
      alert(result.message || 'Error al eliminar el marcaje');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (!editing.checkInTime) {
      alert('Debes ingresar la hora de entrada');
      return;
    }

    const result = await updateMarcajeManual(editing.id_marcaje, {
      date: editing.date,
      checkInTime: editing.checkInTime,
      checkOutTime: editing.checkOutTime || undefined,
      notes: editing.notes || undefined,
      location: editing.location || undefined,
      activityType: 'other',
      registroTipo: 'entrada_otro',
    });

    if (!result.success) {
      toast.error(result.message || 'Error al actualizar el marcaje', {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    setEditing(null);
    toast.success('✅ El marcaje fue editado correctamente', {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        background: '#e0f7fa',
        color: '#006064',
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      },
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    });
  };

  // ---------- RENDER ----------

  if (isLoading && !asistenciaData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando asistencia...</span>
      </div>
    );
  }

  if (error && !asistenciaData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={() => refetch()}
              className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Asistencia</h2>
          <p className="text-gray-600">Registro de asistencia y estadísticas</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
          <button
            onClick={() => {
              fetchAsistencia(selectedMonth, selectedYear);
              fetchEstadisticas(selectedMonth, selectedYear);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm font-medium"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Resumen de estadísticas */}
      {asistenciaData?.resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border flex items-center h-full">
            <Calendar className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Días Trabajados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {asistenciaData.resumen.diasTrabajados}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border flex items-center h-full">
            <Clock className="h-8 w-8 text-green-500 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Horas Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {asistenciaData.resumen.horasTotales}h
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border flex items-center h-full">
            <TrendingUp className="h-8 w-8 text-purple-500 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Promedio Diario</p>
              <p className="text-2xl font-semibold text-gray-900">
                {asistenciaData.resumen.horasPromedio}h
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border flex items-center h-full">
            <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Faltas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {asistenciaData.resumen.faltas}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas avanzadas */}
      {estadisticas && estadisticas.horasReales > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de la Semana</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Cumplimiento de Objetivo</h4>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, estadisticas.porcentajeCumplimiento || 0)}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {Math.round(estadisticas.porcentajeCumplimiento || 0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {estadisticas.horasReales}h de 44h semanales
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Promedio de Ingreso</h4>
              <p className="text-2xl font-semibold text-gray-900">
                {estadisticas.promedioHoraIngreso || '-'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Día Más Productivo</h4>
              {estadisticas.diasMasProductivos && estadisticas.diasMasProductivos[0] ? (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {estadisticas.diasMasProductivos[0].horas}h
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(estadisticas.diasMasProductivos[0].fecha)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas de la Semana</h3>
          <p className="text-sm text-gray-500">
            No hay datos suficientes para mostrar estadísticas.
          </p>
        </div>
      )}

      {/* Lista de asistencias + justificadas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4 mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Registro Detallado
              {asistenciaData?.periodo && (
                <span className="text-sm text-gray-500 ml-2">
                  ({asistenciaData.periodo.mes}/{asistenciaData.periodo.anio})
                </span>
              )}
              {/* Debug visual */}
              <span className="text-xs text-blue-500 ml-2">
                [{allRegistros?.length || 0} registros]
              </span>
            </h3>
            
            {/* Filtros siempre visibles */}
            <div 
              className="bg-gray-50 p-4 rounded-lg border"
              style={{ 
                backgroundColor: '#f9fafb', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                display: 'block',
                visibility: 'visible'
              }}
            >
              <div 
                className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4 md:items-center"
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div 
                  className="flex items-center gap-2"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                >
                  <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <label 
                    className="text-sm font-medium text-gray-700 whitespace-nowrap"
                    style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}
                  >
                    Filtrar por fecha:
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '14px',
                      minWidth: '140px'
                    }}
                    placeholder="Filtrar por fecha"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="text-gray-400 hover:text-gray-600 ml-1 px-2 py-1 hover:bg-gray-200 rounded"
                      style={{
                        color: '#9ca3af',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                      title="Limpiar filtro"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                <div 
                  className="flex items-center gap-2"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                >
                  <label 
                    className="text-sm font-medium text-gray-700 whitespace-nowrap"
                    style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}
                  >
                    Ordenar:
                  </label>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] justify-center"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minWidth: '120px',
                      justifyContent: 'center',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {sortOrder === 'desc' ? 'Más reciente' : 'Más antiguo'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {allRegistros && allRegistros.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {allRegistros.map((asistencia: any, index: number) => {
                const fechaNorm = normalizeFecha(asistencia.fecha) || asistencia.fecha;
                const estado = asistencia.estado || (asistencia.justificacion
                  ? (asistencia.justificacion.es_justificada ? 'justificada' : 'no_justificada')
                  : 'presente');

                // 🔑 CUALQUIER registro con id_marcaje es editable
                const esEditable = !!asistencia.id_marcaje;

                return (
                  <li key={index} className="py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(estado)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {fechaNorm ? formatDate(fechaNorm) : '-'}
                          </p>
                          {esEditable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Editable
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center mt-1 gap-x-4 gap-y-1">
                          <span className="text-sm text-gray-500">
                            Ingreso: {formatTime(asistencia.horaIngreso)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Salida: {formatTime(asistencia.horaSalida)}
                          </span>
                          <span className="text-sm font-semibold text-gray-700">
                            Total: {asistencia.horasTrabajadas ?? asistencia.horas_diarias ?? 0}h
                            {asistencia.justificacion?.es_justificada &&
                              asistencia.justificacion.horas_compensadas > 0 && (
                                <span className="ml-1 text-xs text-green-600">
                                  (+{asistencia.justificacion.horas_compensadas}h compensadas)
                                </span>
                              )}
                          </span>
                        </div>

                        {asistencia.justificacion && (
                          <p className={`text-xs mt-1 ${
                            asistencia.justificacion.es_justificada ? 'text-green-700' : 'text-red-700'
                          }`}>
                            Falta {asistencia.justificacion.es_justificada ? 'Justificada' : 'No Justificada'}: {asistencia.justificacion.motivo}
                          </p>
                        )}

                        {asistencia.observacion && (
                          <p className="text-xs text-gray-400 mt-1">
                            {asistencia.observacion}
                          </p>
                        )}

                        {/* Botones Editar / Eliminar para cualquier registro con id_marcaje */}
                        {esEditable && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleEditClick(asistencia)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteClick(asistencia)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 mt-2 sm:mt-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            estado
                          )}`}
                        >
                          {estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {dateFilter ? 'No hay registros para esta fecha' : 'No hay registros'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {dateFilter 
                  ? `No se encontraron registros para ${formatDate(dateFilter)}.`
                  : 'No se encontraron registros de asistencia para este período.'
                }
              </p>
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Mostrar todos los registros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel de edición simple */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Edit2 className="h-4 w-4 mr-2 text-blue-600" />
              Editar marcaje
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hora entrada</label>
                  <input
                    type="time"
                    value={editing.checkInTime}
                    onChange={(e) => setEditing({ ...editing, checkInTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hora salida</label>
                  <input
                    type="time"
                    value={editing.checkOutTime}
                    onChange={(e) => setEditing({ ...editing, checkOutTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Puedes dejarla vacía si todavía no quieres cerrar el día.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación (opcional)</label>
                <input
                  type="text"
                  value={editing.location}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas / Observación</label>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;
