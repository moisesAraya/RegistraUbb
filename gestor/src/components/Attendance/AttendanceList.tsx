import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, TrendingUp, BarChart3, Shield } from 'lucide-react';
import { useAsistencia } from '../../hooks/useAsistencia';

const AttendanceList: React.FC = () => {
  const {
    asistenciaData,
    estadisticas,
    isLoading,
    error,
    refetch,
    registrarMarcajeManual,
    fetchAsistencia,
    fetchEstadisticas
  } = useAsistencia();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    console.log('🔄 AttendanceList - useEffect ejecutado con:', { selectedMonth, selectedYear });
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

  const getFilteredAndSortedAsistencias = () => {
    if (!asistenciaData?.asistencias) return [];
    
    let filtered = asistenciaData.asistencias;
    
    if (dateFilter) {
      filtered = filtered.filter(asistencia => asistencia.fecha === dateFilter);
    }
    
    return filtered.sort((a, b) => {
      const fechaA = new Date(a.fecha + 'T' + (a.horaIngreso || '00:00:00'));
      const fechaB = new Date(b.fecha + 'T' + (b.horaIngreso || '00:00:00'));
      
      if (sortOrder === 'desc') {
        return fechaB.getTime() - fechaA.getTime();
      } else {
        return fechaA.getTime() - fechaB.getTime();
      }
    });
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

    // Fallback
    return timeString;
  };

  // ---------- MERGE ASISTENCIAS + JUSTIFICACIONES ----------

  const registrosAsistencia = asistenciaData?.asistencias || [];

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
      }
    };
  });

  const allRegistros = [...registrosAsistencia, ...registrosJustificados].sort(
    (a: any, b: any) => {
      const fechaA = normalizeFecha(a.fecha) || '';
      const fechaB = normalizeFecha(b.fecha) || '';
      if (fechaA > fechaB) return -1;
      if (fechaA < fechaB) return 1;
      return 0;
    }
  );

  // ---------- RENDER ----------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando asistencia...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={refetch}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Mes</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas del Mes</h3>
          <p className="text-sm text-gray-500">
            No hay datos suficientes para mostrar estadísticas.
          </p>
        </div>
      )}

      {/* Lista de asistencias + justificadas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Registro Detallado
              {asistenciaData?.periodo && (
                <span className="text-sm text-gray-500 ml-2">
                  ({asistenciaData.periodo.mes}/{asistenciaData.periodo.anio})
                </span>
              )}
            </h3>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Filtrar por fecha"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-gray-400 hover:text-gray-600"
                    title="Limpiar filtro"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <TrendingUp className="h-4 w-4" />
                  {sortOrder === 'desc' ? 'Más reciente' : 'Más antiguo'}
                </button>
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

                return (
                  <li key={index} className="py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(estado)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {fechaNorm ? formatDate(fechaNorm) : '-'}
                        </p>
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
    </div>
  );
};

export default AttendanceList;
