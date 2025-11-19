import React from 'react';
import { 
  Calendar, RefreshCw, BarChart3, Target, 
  AlertTriangle, Activity
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

  // Datos base del dashboard
  const personalStats = dashboardData?.personal_basic_stats || {};
  const weeklyProgress = dashboardData?.weekly_progress || {};
  const attendanceAnalytics = dashboardData?.attendance_analytics || {};

  // --- Progreso semanal ---
  const hoursThisWeek = weeklyProgress.hours_this_week || 0;
  const targetHours = weeklyProgress.target_weekly_hours || 40;
  const hoursRemaining = weeklyProgress.hours_remaining ?? (targetHours - hoursThisWeek);
  const progressPercentage = weeklyProgress.progress_percentage || 0;

  // --- Resumen mensual (simple y visual) ---
  const monthHours = personalStats.total_hours_month || 0;
  // Objetivo mensual aproximado: 4 semanas por defecto o el que te entregue el backend
  const monthTarget =
    weeklyProgress.monthly_target_hours ||
    targetHours * 4;

  const monthCompletion =
    monthTarget > 0 ? Math.min(Math.round((monthHours / monthTarget) * 100), 100) : 0;

  // --- Tendencias semanales (mini gráfico de barras) ---
  const weeklyTrends = attendanceAnalytics.weekly_trends || [];
  const maxHours =
    weeklyTrends.length > 0
      ? Math.max(...weeklyTrends.map((w: any) => w.hours || 0), 1)
      : 1;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header del Dashboard Personal */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                Mi Registro de Horas
              </h1>
              <p className="text-slate-600 text-sm md:text-base">
                Resumen visual para {user?.nombres} {user?.apellidos}
              </p>
            </div>
            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* 1. Progreso Semanal (gráfico principal) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">Progreso semanal</h2>
                <p className="text-slate-600 text-sm">
                  Objetivo: {targetHours} horas esta semana
                </p>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium text-center ${
                progressPercentage >= 100
                  ? 'bg-green-100 text-green-700'
                  : progressPercentage >= 75
                  ? 'bg-blue-100 text-blue-700'
                  : progressPercentage >= 50
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {weeklyProgress.status === 'completed'
                ? 'Completado'
                : weeklyProgress.status === 'on_track'
                ? 'En ruta'
                : weeklyProgress.status === 'behind'
                ? 'Retrasado'
                : 'En progreso'}
            </div>
          </div>

          {/* Barra de progreso semanal */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-slate-900">
                {hoursThisWeek}h
              </span>
              <span className="text-sm text-slate-600">
                de {targetHours}h esta semana
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div
                className={`
                  h-4 rounded-full transition-all duration-500 
                  ${
                    progressPercentage >= 100
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : progressPercentage >= 75
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : progressPercentage >= 50
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
                  }
                `}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs md:text-sm text-slate-600">
              <span>{progressPercentage}% completado</span>
              <span>
                {hoursRemaining > 0
                  ? `${hoursRemaining}h restantes para el objetivo`
                  : 'Objetivo semanal cumplido 🎉'}
              </span>
            </div>
          </div>

          {/* Chips resumidos en lugar de muchas tarjetas */}
          <div className="flex flex-wrap gap-2 mt-3 text-xs md:text-sm">
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Días trabajados esta semana:{' '}
              <span className="font-semibold">
                {weeklyProgress.days_worked_this_week || 0}
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Promedio diario:{' '}
              <span className="font-semibold">
                {weeklyProgress.avg_daily_hours || 0}h
              </span>
            </div>
            {typeof weeklyProgress.days_to_complete === 'number' && (
              <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Para completar:{' '}
                <span className="font-semibold">
                  {weeklyProgress.days_to_complete > 0
                    ? `${weeklyProgress.days_to_complete} día(s)`
                    : 'Objetivo alcanzado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Dos gráficos significativos: Mes vs objetivo + evolución por semana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2.1 Horas del mes vs objetivo */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Horas del mes vs objetivo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Basado en tu objetivo semanal
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-2">
              Este mes has registrado{' '}
              <span className="font-semibold text-slate-900">
                {monthHours} horas
              </span>
              , con un objetivo aproximado de{' '}
              <span className="font-semibold text-slate-900">
                {monthTarget} horas
              </span>
              .
            </p>

            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-2">
              <div
                className="h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                style={{ width: `${monthCompletion}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs md:text-sm text-slate-600">
              <span>Progreso mensual</span>
              <span className="font-semibold text-slate-900">
                {monthCompletion}%
              </span>
            </div>
          </div>

          {/* 2.2 Evolución de horas por semana (mini gráfico barras) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Evolución por semana
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparación de horas trabajadas
                  </p>
                </div>
              </div>
            </div>

            {weeklyTrends.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-6">
                Aún no hay suficientes datos para mostrar tendencias.
              </div>
            ) : (
              <div className="h-40 flex items-end gap-3">
                {weeklyTrends.map((week: any, index: number) => {
                  const height = Math.round(
                    ((week.hours || 0) / maxHours) * 100
                  );

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full h-full bg-slate-100 rounded-lg flex items-end overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-lg transition-all"
                          style={{ height: `${height}%` }}
                          title={`${week.hours}h`}
                        />
                      </div>
                      <span className="mt-1 text-[10px] text-slate-500">
                        Sem {week.week}
                      </span>
                      <span className="text-[11px] text-slate-700 font-medium">
                        {week.hours}h
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;
