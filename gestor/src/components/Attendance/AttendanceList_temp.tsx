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
      case 'injustificada':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'justificada':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (time: string | null): string => {
    if (!time) return '--:--';
    if (time.includes('T')) {
      return new Date(time).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return time.substring(0, 5);
  };

  const filteredData = asistenciaData
    .filter(item => {
      if (!dateFilter) return true;
      const fecha = normalizeFecha(item.fecha);
      return fecha?.includes(dateFilter);
    })
    .sort((a, b) => {
      const fechaA = new Date(normalizeFecha(a.fecha) || '');
      const fechaB = new Date(normalizeFecha(b.fecha) || '');
      return sortOrder === 'desc' ? fechaB.getTime() - fechaA.getTime() : fechaA.getTime() - fechaB.getTime();
    });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 text-center">
          <p>Error al cargar la asistencia: {error}</p>
          <button
            onClick={refetch}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Días Presente</p>
              <p className="text-3xl font-bold">{estadisticas.diasPresente}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Días Ausente</p>
              <p className="text-3xl font-bold">{estadisticas.diasAusente}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">% Asistencia</p>
              <p className="text-3xl font-bold">
                {estadisticas.porcentajeAsistencia ? `${estadisticas.porcentajeAsistencia}%` : '0%'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">Historial de Asistencia</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('es', { month: 'long' })}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filtrar por fecha"
            />

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {sortOrder === 'desc' ? '↓ Más reciente' : '↑ Más antiguo'}
            </button>
          </div>
        </div>



        {/* Records */}
        <div className="space-y-3">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay registros de asistencia para este período</p>
            </div>
          ) : (
            filteredData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(item.estado)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {normalizeFecha(item.fecha) ? 
                        new Date(normalizeFecha(item.fecha) + 'T00:00:00').toLocaleDateString('es-CL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : 'Fecha no disponible'
                      }
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{item.estado.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="text-center">
                    <p className="font-medium">Entrada</p>
                    <p>{formatTime(item.hora_entrada)}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Salida</p>
                    <p>{formatTime(item.hora_salida)}</p>
                  </div>
                  {item.horas_trabajadas && (
                    <div className="text-center">
                      <p className="font-medium">Horas</p>
                      <p>{item.horas_trabajadas}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;