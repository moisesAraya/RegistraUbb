import React from 'react';
import { 
  Clock, Calendar, TrendingUp, RefreshCw, BarChart3, Target, 
  AlertTriangle, CheckCircle, Activity
} from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';

const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, isLoading, error, refetch } = useDashboard();

  console.log('👤 [PERSONAL-DASHBOARD] Renderizando dashboard simplificado para:', user?.nombres);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 font-medium">Cargando mi registro de horas...</p>
              <p className="text-slate-500 text-sm">Usuario: {user?.nombres}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error al cargar mis datos</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Obtener datos simplificados
  const personalStats = dashboardData?.personal_basic_stats || {};
  const weeklyProgress = dashboardData?.weekly_progress || {};
  const attendanceAnalytics = dashboardData?.attendance_analytics || {};

  // Cálculos para el progreso semanal
  const hoursThisWeek = weeklyProgress.hours_this_week || 0;
  const targetHours = weeklyProgress.target_weekly_hours || 40;
  const hoursRemaining = weeklyProgress.hours_remaining || targetHours;
  const progressPercentage = weeklyProgress.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Header del Dashboard Personal */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Mi Registro de Horas
              </h1>
              <p className="text-slate-600">
                Registro personal para {user?.nombres} {user?.apellidos}
              </p>
            </div>
            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Progreso Semanal - Card Principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Progreso Semanal</h2>
                <p className="text-slate-600">Objetivo: {targetHours} horas semanales</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              progressPercentage >= 100 ? 'bg-green-100 text-green-700' :
              progressPercentage >= 75 ? 'bg-blue-100 text-blue-700' :
              progressPercentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {weeklyProgress.status === 'completed' ? 'Completado' :
               weeklyProgress.status === 'on_track' ? 'En ruta' :
               weeklyProgress.status === 'behind' ? 'Retrasado' : 'Necesita atención'}
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-slate-900">{hoursThisWeek}h</span>
              <span className="text-slate-600">de {targetHours}h</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${
                  progressPercentage >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  progressPercentage >= 75 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  progressPercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                  'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-slate-600">{progressPercentage}% completado</span>
              <span className="text-sm text-slate-600">
                {hoursRemaining > 0 ? `${hoursRemaining}h restantes` : 'Objetivo cumplido'}
              </span>
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{weeklyProgress.days_worked_this_week || 0}</div>
              <div className="text-sm text-slate-600">Días trabajados</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{weeklyProgress.avg_daily_hours || 0}h</div>
              <div className="text-sm text-slate-600">Promedio diario</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg col-span-2 md:col-span-1">
              <div className="text-lg font-semibold text-slate-900">
                {weeklyProgress.days_to_complete > 0 ? `${weeklyProgress.days_to_complete} días` : 'Completado'}
              </div>
              <div className="text-sm text-slate-600">Para completar</div>
            </div>
          </div>
        </div>

        {/* Grid de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Horas Hoy */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-500 font-medium">HOY</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900">{personalStats.today_hours || 0}h</div>
              <div className="text-sm text-slate-600">Horas trabajadas hoy</div>
            </div>
          </div>

          {/* Total Mes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-500 font-medium">MES</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900">{personalStats.total_hours_month || 0}h</div>
              <div className="text-sm text-slate-600">Total este mes</div>
            </div>
          </div>

          {/* Días Trabajados */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-500 font-medium">DÍAS</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900">{personalStats.days_worked_month || 0}</div>
              <div className="text-sm text-slate-600">Días con registro</div>
            </div>
          </div>

          {/* Promedio Diario */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-slate-500 font-medium">PROMEDIO</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900">{personalStats.avg_hours_per_day || 0}h</div>
              <div className="text-sm text-slate-600">Por día trabajado</div>
            </div>
          </div>
        </div>

        {/* Tendencias Semanales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Tendencias Semanales</h3>
                <p className="text-slate-600">Últimas 4 semanas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {attendanceAnalytics.weekly_trends?.map((week: any, index: number) => (
              <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-lg font-semibold text-slate-900">{week.hours}h</div>
                <div className="text-sm text-slate-600">Semana {week.week}</div>
                <div className="text-xs text-slate-500">{week.days} días</div>
              </div>
            )) || (
              <div className="col-span-4 text-center py-8 text-slate-500">
                No hay datos suficientes para mostrar tendencias
              </div>
            )}
          </div>
        </div>

        {/* Footer con información */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Sistema de registro personal</p>
          <p>Última actualización: {new Date().toLocaleString('es-CL')}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;