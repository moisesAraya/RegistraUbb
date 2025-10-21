import React, { useState, useEffect } from 'react';
import { useReportes } from '../../hooks/useReportes';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Target,
  Award,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';

const ReportsSection: React.FC = () => {
  const {
    loading,
    error,
    reporteActual,
    reporteComparativo,
    obtenerReporteMensual,
    obtenerReporteComparativo,
    obtenerEstadisticasAnuales,
    clearError
  } = useReportes();

  const [vistaActiva, setVistaActiva] = useState<'mensual' | 'comparativo' | 'anual'>('mensual');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // ✅ CARGAR REPORTE COMPARATIVO AL INICIAR
  useEffect(() => {
    if (vistaActiva === 'comparativo') {
      obtenerReporteComparativo();
    }
  }, [vistaActiva]);

  // ✅ CAMBIAR MES/AÑO
  const handleFechaChange = (mes: number, anio: number) => {
    setMesSeleccionado(mes);
    setAnioSeleccionado(anio);
    obtenerReporteMensual(mes, anio);
  };

  // ✅ COMPONENTE DE MÉTRICAS
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue',
    trend 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      red: 'bg-red-50 border-red-200 text-red-700'
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs opacity-60 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-center">
            <Icon className="w-8 h-8" />
            {trend && (
              <div className="mt-1">
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ VISTA MENSUAL
  const VistaMensual = () => {
    if (!reporteActual) return null;

    const { resumen_basico, metricas_avanzadas, tendencias } = reporteActual;

    return (
      <div className="space-y-6">
        {/* Selector de Fecha */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select 
            value={mesSeleccionado}
            onChange={(e) => handleFechaChange(parseInt(e.target.value), anioSeleccionado)}
            className="border rounded px-3 py-2"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2023, i).toLocaleDateString('es-CL', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={anioSeleccionado}
            onChange={(e) => handleFechaChange(mesSeleccionado, parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {[2023, 2024, 2025].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Horas Totales"
            value={`${resumen_basico?.horasTotales || 0}h`}
            subtitle={`Promedio: ${metricas_avanzadas?.promedio_horas_dia || 0}h/día`}
            icon={Clock}
            color="blue"
            trend={tendencias?.tendencia === 'mejorando' ? 'up' : tendencias?.tendencia === 'empeorando' ? 'down' : 'neutral'}
          />
          
          <MetricCard
            title="Días Trabajados"
            value={resumen_basico?.diasTrabajados || 0}
            subtitle="del mes"
            icon={Calendar}
            color="green"
          />
          
          <MetricCard
            title="Puntualidad"
            value={`${metricas_avanzadas?.puntualidad?.puntualidad_score || 0}%`}
            subtitle={`${metricas_avanzadas?.puntualidad?.llegadas_tarde || 0} llegadas tarde`}
            icon={Target}
            color="purple"
          />
          
          <MetricCard
            title="Consistencia"
            value={`${metricas_avanzadas?.consistencia?.consistencia_score || 0}%`}
            subtitle={`${metricas_avanzadas?.consistencia?.dias_completos || 0} días completos`}
            icon={Award}
            color="orange"
          />
        </div>

        {/* Gráfico Simple de Horas por Día de Semana */}
        {reporteActual.graficos_data?.horas_por_dia_semana && (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Horas por Día de la Semana
            </h3>
            <div className="space-y-3">
              {reporteActual.graficos_data.horas_por_dia_semana.map((dia) => (
                <div key={dia.dia} className="flex items-center">
                  <div className="w-20 text-sm font-medium">{dia.dia}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.min((dia.horas / 10) * 100, 100)}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {dia.horas}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Justificaciones del Mes */}
        {metricas_avanzadas?.justificaciones && (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Justificaciones del Mes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-700">
                  {metricas_avanzadas.justificaciones.total}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-700">
                  {metricas_avanzadas.justificaciones.aprobadas}
                </div>
                <div className="text-sm text-gray-500">Aprobadas</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-700">
                  {metricas_avanzadas.justificaciones.pendientes}
                </div>
                <div className="text-sm text-gray-500">Pendientes</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-700">
                  {metricas_avanzadas.justificaciones.rechazadas}
                </div>
                <div className="text-sm text-gray-500">Rechazadas</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ✅ VISTA COMPARATIVA
  const VistaComparativa = () => {
    if (!reporteComparativo) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Últimos 6 Meses</h3>
          
          {/* Promedios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              title="Promedio Horas"
              value={`${reporteComparativo.promedios.horas}h`}
              subtitle="mensual"
              icon={Clock}
              color="blue"
            />
            <MetricCard
              title="Promedio Días"
              value={reporteComparativo.promedios.dias}
              subtitle="mensuales"
              icon={Calendar}
              color="green"
            />
            <MetricCard
              title="Promedio Asistencia"
              value={`${reporteComparativo.promedios.asistencia}%`}
              subtitle="mensual"
              icon={Target}
              color="purple"
            />
          </div>

          {/* Tendencias */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Tendencias Generales</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Horas: </span>
                <span className={`text-sm font-medium ${
                  reporteComparativo.tendencias_generales.horas === 'mejorando' ? 'text-green-600' :
                  reporteComparativo.tendencias_generales.horas === 'empeorando' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {reporteComparativo.tendencias_generales.horas}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Días: </span>
                <span className={`text-sm font-medium ${
                  reporteComparativo.tendencias_generales.dias === 'mejorando' ? 'text-green-600' :
                  reporteComparativo.tendencias_generales.dias === 'empeorando' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {reporteComparativo.tendencias_generales.dias}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">Asistencia: </span>
                <span className={`text-sm font-medium ${
                  reporteComparativo.tendencias_generales.asistencia === 'mejorando' ? 'text-green-600' :
                  reporteComparativo.tendencias_generales.asistencia === 'empeorando' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {reporteComparativo.tendencias_generales.asistencia}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Reportes Mensuales */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Detalle por Mes</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Mes</th>
                    <th className="text-right py-2">Horas</th>
                    <th className="text-right py-2">Días</th>
                    <th className="text-right py-2">Asistencia</th>
                    <th className="text-right py-2">Justif.</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteComparativo.reportes_mensuales.map((reporte, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{reporte.nombre_mes}</td>
                      <td className="text-right py-2">{reporte.horas_totales}h</td>
                      <td className="text-right py-2">{reporte.dias_trabajados}</td>
                      <td className="text-right py-2">{reporte.porcentaje_asistencia}%</td>
                      <td className="text-right py-2">{reporte.justificaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Generando reporte...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Reportes</h1>
          <p className="text-gray-600">Análisis detallado de tu asistencia y rendimiento</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Error generando reporte</p>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setVistaActiva('mensual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              vistaActiva === 'mensual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reporte Mensual
          </button>
          <button
            onClick={() => setVistaActiva('comparativo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              vistaActiva === 'comparativo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Análisis Comparativo
          </button>
        </nav>
      </div>

      {/* Contenido */}
      {vistaActiva === 'mensual' && <VistaMensual />}
      {vistaActiva === 'comparativo' && <VistaComparativa />}
    </div>
  );
};

export default ReportsSection;