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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Importa SOLO así, no como import * as ...
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../components/Context/AuthContext';

// Augment jsPDF type for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable?: {
      finalY: number;
      [key: string]: any;
    };
  }
}

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
  const { user } = useAuth();
  const [rutSeleccionado, setRutSeleccionado] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);

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

  const exportMensualToExcel = () => {
    if (!reporteActual) return;

    const { resumen_basico, metricas_avanzadas } = reporteActual;

    // Prepara los datos para la hoja principal
    const resumen = [
      { 
        Métrica: 'Horas Totales', 
        Valor: resumen_basico?.horasTotales || 0 
      },
      { 
        Métrica: 'Días Trabajados', 
        Valor: resumen_basico?.diasTrabajados || 0 
      },
      { 
        Métrica: 'Promedio Horas Día', 
        Valor: metricas_avanzadas?.promedio_horas_dia || 0 
      },
      { 
        Métrica: 'Puntualidad (%)', 
        Valor: metricas_avanzadas?.puntualidad?.puntualidad_score || 0 
      },
      { 
        Métrica: 'Llegadas Tarde', 
        Valor: metricas_avanzadas?.puntualidad?.llegadas_tarde || 0 
      },
      { 
        Métrica: 'Consistencia (%)', 
        Valor: metricas_avanzadas?.consistencia?.consistencia_score || 0 
      },
      { 
        Métrica: 'Días Completos', 
        Valor: metricas_avanzadas?.consistencia?.dias_completos || 0 
      },
    ];

    // Justificaciones
    const justificaciones = metricas_avanzadas?.justificaciones
      ? [
          {
            Estado: 'Total',
            Cantidad: metricas_avanzadas.justificaciones.total,
          },
          {
            Estado: 'Aprobadas',
            Cantidad: metricas_avanzadas.justificaciones.aprobadas,
          },
          {
            Estado: 'Pendientes',
            Cantidad: metricas_avanzadas.justificaciones.pendientes,
          },
          {
            Estado: 'Rechazadas',
            Cantidad: metricas_avanzadas.justificaciones.rechazadas,
          },
        ]
      : [];

    // Horas por día de la semana
    const horasPorDia = reporteActual.graficos_data?.horas_por_dia_semana
      ? reporteActual.graficos_data.horas_por_dia_semana.map((d: any) => ({
          Día: d.dia,
          Horas: d.horas,
        }))
      : [];

    // Crea el libro y las hojas
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen');
    if (justificaciones.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(justificaciones), 'Justificaciones');
    }
    if (horasPorDia.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(horasPorDia), 'Horas por Día');
    }

    // Exporta el archivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'ReporteMensual.xlsx');
  };

  const exportComparativoToExcel = () => {
    if (!reporteComparativo) return;

    // Promedios
    const promedios = [
      { Métrica: 'Promedio Horas', Valor: reporteComparativo.promedios.horas },
      { Métrica: 'Promedio Días', Valor: reporteComparativo.promedios.dias },
      { Métrica: 'Promedio Asistencia (%)', Valor: reporteComparativo.promedios.asistencia },
    ];

    // Tendencias
    const tendencias = [
      { Métrica: 'Horas', Tendencia: reporteComparativo.tendencias_generales.horas },
      { Métrica: 'Días', Tendencia: reporteComparativo.tendencias_generales.dias },
      { Métrica: 'Asistencia', Tendencia: reporteComparativo.tendencias_generales.asistencia },
    ];

    // Detalle por mes
    const detalle = reporteComparativo.reportes_mensuales.map((r: any) => ({
      Mes: r.nombre_mes,
      Horas: r.horas_totales,
      Días: r.dias_trabajados,
      Asistencia: r.porcentaje_asistencia,
      Justificaciones: r.justificaciones,
    }));

    // Crea el libro y las hojas
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(promedios), 'Promedios');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tendencias), 'Tendencias');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), 'Detalle por Mes');

    // Exporta el archivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'ReporteComparativo.xlsx');
  };

  const exportMensualToPDF = () => {
    if (!reporteActual) return;
    const { resumen_basico, metricas_avanzadas } = reporteActual;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Reporte Mensual', 14, 18);

    // Resumen
    doc.setFontSize(12);
    doc.text('Resumen', 14, 28);
    autoTable(doc, {
      startY: 32,
      head: [['Métrica', 'Valor']],
      body: [
        ['Horas Totales', resumen_basico?.horasTotales || 0],
        ['Días Trabajados', resumen_basico?.diasTrabajados || 0],
        ['Promedio Horas Día', metricas_avanzadas?.promedio_horas_dia || 0],
        ['Puntualidad (%)', metricas_avanzadas?.puntualidad?.puntualidad_score || 0],
        ['Llegadas Tarde', metricas_avanzadas?.puntualidad?.llegadas_tarde || 0],
        ['Consistencia (%)', metricas_avanzadas?.consistencia?.consistencia_score || 0],
        ['Días Completos', metricas_avanzadas?.consistencia?.dias_completos || 0],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    // Justificaciones
    if (metricas_avanzadas?.justificaciones) {
      const lastY = doc.lastAutoTable?.finalY ?? 42;
      doc.text('Justificaciones', 14, lastY + 10);
      autoTable(doc, {
        startY: lastY + 14,
        head: [['Estado', 'Cantidad']],
        body: [
          ['Total', metricas_avanzadas.justificaciones.total],
          ['Aprobadas', metricas_avanzadas.justificaciones.aprobadas],
          ['Pendientes', metricas_avanzadas.justificaciones.pendientes],
          ['Rechazadas', metricas_avanzadas.justificaciones.rechazadas],
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
      });
    }

    // Horas por día de la semana
    if (reporteActual.graficos_data?.horas_por_dia_semana) {
      const horasPorDiaStartY = (doc.lastAutoTable?.finalY ?? 42) + 10;
      doc.text('Horas por Día de la Semana', 14, horasPorDiaStartY);
      autoTable(doc, {
        startY: horasPorDiaStartY + 4,
        head: [['Día', 'Horas']],
        body: reporteActual.graficos_data.horas_por_dia_semana.map((d: any) => [d.dia, d.horas]),
        theme: 'grid',
        styles: { fontSize: 10 },
      });
    }

    doc.save('ReporteMensual.pdf');
  };

  const exportComparativoToPDF = () => {
    if (!reporteComparativo) return;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Análisis Comparativo', 14, 18);

    // Promedios
    doc.setFontSize(12);
    doc.text('Promedios', 14, 28);
    autoTable(doc, {
      startY: 32,
      head: [['Métrica', 'Valor']],
      body: [
        ['Promedio Horas', reporteComparativo.promedios.horas],
        ['Promedio Días', reporteComparativo.promedios.dias],
        ['Promedio Asistencia (%)', reporteComparativo.promedios.asistencia],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    // Tendencias
    doc.text('Tendencias', 14, (doc.lastAutoTable?.finalY ?? 42) + 10);
    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY ?? 42) + 14,
      head: [['Métrica', 'Tendencia']],
      body: [
        ['Horas', reporteComparativo.tendencias_generales.horas],
        ['Días', reporteComparativo.tendencias_generales.dias],
        ['Asistencia', reporteComparativo.tendencias_generales.asistencia],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    // Detalle por mes
    const detalleStartY = (doc.lastAutoTable?.finalY ?? 42) + 10;
    doc.text('Detalle por Mes', 14, detalleStartY);
    autoTable(doc, {
      startY: detalleStartY + 4,
      head: [['Mes', 'Horas', 'Días', 'Asistencia', 'Justificaciones']],
      body: reporteComparativo.reportes_mensuales.map((r: any) => [
        r.nombre_mes,
        r.horas_totales,
        r.dias_trabajados,
        r.porcentaje_asistencia,
        r.justificaciones,
      ]),
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    doc.save('ReporteComparativo.pdf');
  };

  // Solo para admin: cargar usuarios
  useEffect(() => {
    if (user?.id_rol === 1) {
      fetch(`${import.meta.env.VITE_API_URL}/usuario`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setUsuarios(data.usuarios || []));
    }
  }, [user]);

  // Cuando cambia el usuario seleccionado, carga el reporte de ese usuario
  useEffect(() => {
    if (user?.id_rol === 1 && rutSeleccionado) {
      obtenerReporteMensual(mesSeleccionado, anioSeleccionado, rutSeleccionado);
    }
  }, [rutSeleccionado, mesSeleccionado, anioSeleccionado, user]);

  // Carga el reporte correspondiente al usuario y fechas seleccionadas
  useEffect(() => {
    if (user?.id_rol === 1) {
      if (!rutSeleccionado || rutSeleccionado === "") {
        // Todos los usuarios
        obtenerReporteMensual(mesSeleccionado, anioSeleccionado, undefined, true);
      } else {
        // Usuario específico
        obtenerReporteMensual(mesSeleccionado, anioSeleccionado, rutSeleccionado);
      }
    } else {
      // No admin: solo su propio reporte
      obtenerReporteMensual(mesSeleccionado, anioSeleccionado);
    }
  }, [rutSeleccionado, mesSeleccionado, anioSeleccionado, user]);

  // Vista comparativa para todos los usuarios
  const VistaComparativaUsuarios = () => {
    if (!Array.isArray(reporteActual)) return null;
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Comparativa de Usuarios</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b-2 border-gray-200 text-left text-sm font-medium text-gray-600">
                  Usuario
                </th>
                <th className="py-3 px-4 border-b-2 border-gray-200 text-right text-sm font-medium text-gray-600">
                  Horas
                </th>
                <th className="py-3 px-4 border-b-2 border-gray-200 text-right text-sm font-medium text-gray-600">
                  Días
                </th>
                <th className="py-3 px-4 border-b-2 border-gray-200 text-right text-sm font-medium text-gray-600">
                  Asistencia
                </th>
                <th className="py-3 px-4 border-b-2 border-gray-200 text-right text-sm font-medium text-gray-600">
                  Justificaciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reporteActual.map((item, idx) => (
                <tr key={item.rut || idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {item.rut?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {item.rut}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-700">
                    {item.reporte?.resumen_basico?.horasTotales ?? 0}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-700">
                    {item.reporte?.resumen_basico?.diasTrabajados ?? 0}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-700">
                    {item.reporte
                      ? Math.round((item.reporte.resumen_basico?.diasTrabajados ?? 0) / 22 * 100)
                      : 0}%
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-700">
                    {item.reporte?.justificaciones?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.id_rol === 1 ? 'Reportes' : 'Mis Reportes'}
          </h1>
          <p className="text-gray-600">
            {user?.id_rol === 1
              ? 'Análisis detallado de la asistencia y rendimiento de todos los usuarios'
              : 'Análisis detallado de tu asistencia y rendimiento'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Solo admin: selector de usuario */}
          {user?.id_rol === 1 && (
            <select
              value={rutSeleccionado || ''}
              onChange={e => setRutSeleccionado(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.rut_usuario} value={u.rut_usuario}>
                  {u.nombres} {u.apellidos} ({u.rut_usuario})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              if (vistaActiva === 'mensual') exportMensualToExcel();
              else if (vistaActiva === 'comparativo') exportComparativoToExcel();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              if (vistaActiva === 'mensual') exportMensualToPDF();
              else if (vistaActiva === 'comparativo') exportComparativoToPDF();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
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
      {vistaActiva === 'mensual' && (
        Array.isArray(reporteActual)
          ? <VistaComparativaUsuarios />
          : <VistaMensual />
      )}
      {vistaActiva === 'comparativo' && <VistaComparativa />}

      {/* Vista Comparativa de Usuarios (solo admin) */}
      {user?.id_rol === 1 && vistaActiva === 'comparativo' && (
        <VistaComparativa />
      )}
    </div>
  );
};

export default ReportsSection;