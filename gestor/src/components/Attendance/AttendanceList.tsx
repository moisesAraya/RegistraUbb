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
      present: { label: 'Presente', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
      absent: { label: 'Ausente', color: 'bg-red-50 text-red-700 border border-red-200' },
      late: { label: 'Tarde', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
      justified: { label: 'Justificado', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${config.color}`}>
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
    console.log('Generando reporte de asistencia para:', monthNames[filterMonth], filterYear);
  };

  return (
    <div className="space-y-6">
      {/* Header profesional con estadísticas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center space-x-3 mb-4 lg:mb-0">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registro de Asistencia</h3>
              <p className="text-sm text-slate-600">Historial y estadísticas de asistencia</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex space-x-2">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white text-sm"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white text-sm"
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'summary' : 'list')}
                className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{viewMode === 'list' ? 'Resumen' : 'Lista'}</span>
              </button>
              
              <button
                onClick={generateReport}
                className="flex items-center space-x-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas profesionales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Total Horas</p>
                <p className="text-xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-slate-500 mt-1">Período actual</p>
              </div>
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Días Presentes</p>
                <p className="text-xl font-bold text-blue-900">{presentDays}</p>
                <p className="text-xs text-blue-600 mt-1">de {totalDays} días</p>
              </div>
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-700 font-medium uppercase tracking-wide">% Asistencia</p>
                <p className="text-xl font-bold text-indigo-900">{attendanceRate}%</p>
                <p className="text-xs text-indigo-600 mt-1">{attendanceRate >= 90 ? 'Excelente' : attendanceRate >= 80 ? 'Bueno' : 'Mejorable'}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Total Días</p>
                <p className="text-xl font-bold text-amber-900">{totalDays}</p>
                <p className="text-xs text-amber-600 mt-1">Registrados</p>
              </div>
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Vista de resumen o lista profesional */}
      {viewMode === 'summary' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-5 flex items-center">
            <Calendar className="w-5 h-5 text-slate-600 mr-2" />
            Resumen por Semana - {monthNames[filterMonth]} {filterYear}
          </h4>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((week) => (
              <div key={week} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-slate-900">Semana {week}</h5>
                  <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                    {Math.floor(Math.random() * 40) + 30}h trabajadas
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {['L', 'M', 'M', 'J', 'V'].map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-slate-500 mb-2 font-medium">{day}</div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        Math.random() > 0.2 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Registros Detallados - {monthNames[filterMonth]} {filterYear}
            </h3>
            <p className="text-sm text-slate-600 mt-1">Historial completo de asistencia del período</p>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredRecords.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-slate-900 mb-2">Sin registros</h3>
                <p className="text-slate-600">No hay registros de asistencia para el período seleccionado.</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {showUserName && (
                          <h4 className="font-semibold text-slate-900">{record.userName}</h4>
                        )}
                        <span className="text-sm font-semibold text-slate-900">
                          {formatDate(record.date)}
                        </span>
                        {getStatusBadge(record.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>
                            Entrada: {formatTime(record.checkInTime)}
                            {record.checkOutTime && ` | Salida: ${formatTime(record.checkOutTime)}`}
                          </span>
                        </div>
                        
                        {record.checkOutTime && (
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">
                              {calculateHours(record.checkInTime, record.checkOutTime)}h trabajadas
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                          <span>{getActivityTypeLabel(record.activityType)}</span>
                        </div>
                        
                        {record.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{record.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {record.notes && (
                        <div className="flex items-start space-x-2 mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                          <span>{record.notes}</span>
                        </div>
                      )}
                      
                      {record.isJustified && record.justificationReason && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong className="font-semibold">Justificación:</strong> {record.justificationReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {record.status === 'present' ? (
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="bg-red-100 p-2 rounded-lg">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
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