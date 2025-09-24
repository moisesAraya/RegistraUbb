import React, { useState } from 'react';
import { Download, Calendar, Users, BarChart3, FileText } from 'lucide-react';

const ReportsSection: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedUser, setSelectedUser] = useState('all');
  const [reportType, setReportType] = useState('attendance');

  const generateReport = () => {
    // Simulate report generation
    console.log('Generating report:', { dateRange, selectedUser, reportType });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Generador de Reportes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="attendance">Asistencia General</option>
              <option value="individual">Reporte Individual</option>
              <option value="activity">Por Actividad</option>
              <option value="monthly">Resumen Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario (Opcional)
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los usuarios</option>
            <option value="1">Prof. Ana López</option>
            <option value="2">Dr. Carlos Mendoza</option>
            <option value="3">Dra. María González</option>
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={generateReport}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Generar PDF</span>
          </button>
          <button
            onClick={generateReport}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Reportes Recientes</h4>
          <div className="space-y-3">
            {[
              { name: 'Asistencia Enero 2024', date: '2024-01-31', type: 'PDF' },
              { name: 'Reporte Individual - Ana López', date: '2024-01-30', type: 'Excel' },
              { name: 'Actividades Docencia', date: '2024-01-29', type: 'PDF' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-600">{report.date}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {report.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Estadísticas Rápidas</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Promedio de asistencia</span>
              <span className="font-bold text-green-600">87.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Días trabajados este mes</span>
              <span className="font-bold text-blue-600">18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Horas totales</span>
              <span className="font-bold text-cyan-600">144</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Justificaciones</span>
              <span className="font-bold text-yellow-600">2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;