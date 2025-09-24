import React, { useState } from 'react';
import { Clock, MapPin, FileText, CheckCircle, XCircle, Calendar, Download, Filter, BarChart3 } from 'lucide-react';
import { AttendanceRecord } from '../../types';

interface AttendanceListProps {
  records: AttendanceRecord[];
  showUserName?: boolean;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ records, showUserName = false }) => {
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'teaching': return 'Docencia';
      case 'research': return 'Investigación';
      case 'management': return 'Gestión';
      default: return 'Otro';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Presente', color: 'bg-green-100 text-green-800' },
      absent: { label: 'Ausente', color: 'bg-red-100 text-red-800' },
      late: { label: 'Tarde', color: 'bg-yellow-100 text-yellow-800' },
      justified: { label: 'Justificado', color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const calculateHours = (checkIn: Date, checkOut?: Date) => {
    if (!checkOut) return 0;
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  };

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
  });

  const totalHours = filteredRecords.reduce((total, record) => {
    return total + calculateHours(record.checkInTime, record.checkOutTime);
  }, 0);

  const totalDays = filteredRecords.length;
  const presentDays = filteredRecords.filter(r => r.status === 'present').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const generateReport = () => {
    // Simular generación de reporte
    console.log('Generando reporte de asistencia para:', monthNames[filterMonth], filterYear);
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center space-x-2 mb-4 lg:mb-0">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Mi Asistencia
            </h3>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'summary' : 'list')}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{viewMode === 'list' ? 'Resumen' : 'Lista'}</span>
              </button>
              
              <button
                onClick={generateReport}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas del período */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Horas</p>
                <p className="text-2xl font-bold text-blue-900">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Días Presentes</p>
                <p className="text-2xl font-bold text-green-900">{presentDays}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-cyan-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600 font-medium">% Asistencia</p>
                <p className="text-2xl font-bold text-cyan-900">{attendanceRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-cyan-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Total Días</p>
                <p className="text-2xl font-bold text-yellow-900">{totalDays}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Vista de resumen o lista */}
      {viewMode === 'summary' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen por Semana - {monthNames[filterMonth]} {filterYear}
          </h4>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((week) => (
              <div key={week} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Semana {week}</h5>
                  <span className="text-sm text-gray-500">
                    {Math.floor(Math.random() * 40) + 30} horas
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['L', 'M', 'M', 'J', 'V'].map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">{day}</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        Math.random() > 0.2 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.random() > 0.2 ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Registros Detallados - {monthNames[filterMonth]} {filterYear}
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredRecords.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay registros de asistencia para el período seleccionado.
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {showUserName && (
                          <h4 className="font-medium text-gray-900">{record.userName}</h4>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(record.date)}
                        </span>
                        {getStatusBadge(record.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Entrada: {formatTime(record.checkInTime)}
                            {record.checkOutTime && ` | Salida: ${formatTime(record.checkOutTime)}`}
                          </span>
                        </div>
                        
                        {record.checkOutTime && (
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4" />
                            <span>
                              {calculateHours(record.checkInTime, record.checkOutTime)} horas
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          <span>{getActivityTypeLabel(record.activityType)}</span>
                        </div>
                        
                        {record.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{record.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {record.notes && (
                        <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{record.notes}</span>
                        </div>
                      )}
                      
                      {record.isJustified && record.justificationReason && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>Justificación:</strong> {record.justificationReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {record.status === 'present' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;