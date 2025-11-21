// components/Dashboard/PersonalDashboard.tsx
import React from 'react';
import { RefreshCw, Target, AlertTriangle, Activity } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useAsistenciaContext } from '../../context/AsistenciaContext';

const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();

  // 👇 AHORA USAMOS ASISTENCIA (no useDashboard)
  const {
    asistenciaData,   // { asistencias, resumen, periodo }
    estadisticas,     // { horasObjetivo, horasReales, porcentajeCumplimiento, tendenciaSemanal, ... }
    isLoading,
    error,
    refetch,
  } = useAsistenciaContext();

  console.log('👤 [PERSONAL-DASHBOARD] Renderizando para:', user?.nombres);

  // ---------------- ESTADOS BÁSICOS ----------------

  if (isLoading && !asistenciaData && !estadisticas) {
    return (
      <div className="bg-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
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

  if (error && !asistenciaData && !estadisticas) {
    return (
      <div className="bg-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Error al cargar mis datos
              </h3>
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

  // ---------------- DATOS DE ASISTENCIA ----------------

  const registros = asistenciaData?.asistencias || [];
  const resumen = asistenciaData?.resumen || null;

  // ---------------- CÁLCULO DE PROGRESO SEMANAL (FRONT) ----------------
  // 👉 Esto asegura que SIEMPRE considere lo que marcaste hoy.

  const today = new Date();

  // Semana que empieza el lunes (0 = domingo, 1 = lunes, ...)
  const dayOfWeek = today.getDay(); // 0-6
  const diffToMonday = (dayOfWeek + 6) % 7; // lunes = 0
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - diffToMonday);

  // Sumar horas de esta semana a partir de los registros del mes
  type RegistroAsistencia = {
    fecha: string;
    horasTrabajadas?: number;
    horas_diarias?: number;
    estado?: string;
  };

  const registrosSemana: RegistroAsistencia[] = registros.filter((r: any) => {
    if (!r.fecha) return false;
    const fecha = new Date(`${r.fecha}T00:00:00`);
    return fecha >= startOfWeek && fecha <= today;
  });

  const hoursThisWeek = registrosSemana.reduce((sum, r) => {
    const h = Number(r.horasTrabajadas ?? r.horas_diarias ?? 0);
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  const targetHours = 44; // objetivo semanal (el backend usa 44h)
  const hoursRemaining = Math.max(targetHours - hoursThisWeek, 0);
  const progressPercentage =
    targetHours > 0 ? Math.round((hoursThisWeek / targetHours) * 100) : 0;

  const daysWorkedThisWeek = registrosSemana.filter((r) => {
    const h = Number(r.horasTrabajadas ?? r.horas_diarias ?? 0);
    return h > 0;
  }).length;

  const avgDailyHours =
    daysWorkedThisWeek > 0
      ? Math.round((hoursThisWeek / daysWorkedThisWeek) * 100) / 100
      : 0;

  const estimatedDaysToComplete =
    hoursRemaining > 0 ? Math.ceil(hoursRemaining / 8) : 0;

  // Construir "week_days" para cálculo interno (aunque ya no se renderiza el detalle)
  const weekDays: {
    date: string;
    hours: number;
    status:
      | 'success'
      | 'warning'
      | 'error'
      | 'justified'
      | 'unjustified'
      | 'none';
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const fechaStr = d.toISOString().split('T')[0];

    const registroDia = registros.find((r: any) => r.fecha === fechaStr);
    const horas = Number(registroDia?.horasTrabajadas ?? 0);

    let status: any = 'none';

    if (registroDia?.justificacion) {
      status = registroDia.justificacion.es_justificada
        ? 'justified'
        : 'unjustified';
    } else if (registroDia?.estado === 'falta') {
      status = 'unjustified';
    } else if (horas >= 7) {
      status = 'success';
    } else if (horas >= 4) {
      status = 'warning';
    } else if (horas > 0) {
      status = 'error';
    }

    weekDays.push({
      date: fechaStr,
      hours: horas || 0,
      status,
    });
  }

  const hasWeeklyProgress = weekDays.some((d) => d.hours > 0);

  const weeklyProgress = hasWeeklyProgress
    ? {
        hours_this_week: Math.round(hoursThisWeek * 100) / 100,
        target_weekly_hours: targetHours,
        hours_remaining: Math.round(hoursRemaining * 100) / 100,
        progress_percentage: progressPercentage,
        days_worked_this_week: daysWorkedThisWeek,
        avg_daily_hours: avgDailyHours,
        days_to_complete: estimatedDaysToComplete,
        status:
          progressPercentage >= 100
            ? 'completed'
            : progressPercentage >= 75
            ? 'on_track'
            : progressPercentage >= 50
            ? 'behind'
            : 'behind',
        week_days: weekDays,
      }
    : null;

  // ---------------- TENDENCIA SEMANAL (BACKEND) ----------------
  // Usamos estadisticas.tendenciaSemanal para el gráfico de barras.

  const weeklyTrends = Array.isArray(estadisticas?.tendenciaSemanal)
    ? estadisticas!.tendenciaSemanal
    : [];

  const maxHours =
    weeklyTrends.length > 0
      ? Math.max(...weeklyTrends.map((w: any) => Number(w.horas) || 0))
      : 0;

  // ---------------- RENDER ----------------

  return (
    <div className="bg-transparent">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              Mi Registro de Horas
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Resumen visual para {user?.nombres} {user?.apellidos}
            </p>
            {resumen && (
              <p className="text-slate-500 text-xs md:text-sm mt-1">
                Este mes: {resumen.horasTotales}h en {resumen.diasTrabajados} días
                trabajados · Faltas: {resumen.faltas}
              </p>
            )}
          </div>
          <button
            onClick={refetch}
            className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* 1. Progreso semanal (sin detalle semanal en cards, solo resumen) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          {!weeklyProgress ? (
            <div className="flex flex-col items-center justify-center h-32">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-slate-700 text-center">
                No hay datos de progreso semanal disponibles.
              </p>
              <p className="text-slate-500 text-xs">
                Aún no has registrado horas esta semana.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                      Progreso semanal
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Objetivo: {weeklyProgress.target_weekly_hours} horas esta
                      semana
                    </p>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium text-center ${
                    weeklyProgress.progress_percentage >= 100
                      ? 'bg-green-100 text-green-700'
                      : weeklyProgress.progress_percentage >= 75
                      ? 'bg-blue-100 text-blue-700'
                      : weeklyProgress.progress_percentage >= 50
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {weeklyProgress.status === 'completed'
                    ? 'Completado'
                    : weeklyProgress.status === 'on_track'
                    ? 'En ruta'
                    : 'Retrasado'}
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {weeklyProgress.hours_this_week}h
                  </span>
                  <span className="text-sm text-slate-600">
                    de {weeklyProgress.target_weekly_hours}h esta semana
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`
                      h-4 rounded-full transition-all duration-500 
                      ${
                        weeklyProgress.progress_percentage >= 100
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : weeklyProgress.progress_percentage >= 75
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : weeklyProgress.progress_percentage >= 50
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      }
                    `}
                    style={{
                      width: `${Math.min(
                        weeklyProgress.progress_percentage,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs md:text-sm text-slate-600">
                  <span>{weeklyProgress.progress_percentage}% completado</span>
                  <span>
                    {weeklyProgress.hours_remaining > 0
                      ? `${weeklyProgress.hours_remaining}h restantes para el objetivo`
                      : 'Objetivo semanal cumplido 🎉'}
                  </span>
                </div>
              </div>

              {/* Chips resumidos (se mantienen) */}
              <div className="flex flex-wrap gap-2 mt-3 text-xs md:text-sm">
                <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  Días trabajados:{' '}
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

              {/* 👇 AQUÍ SE ELIMINÓ EL "Detalle semanal" en cards
                  porque ahora ese detalle lo maneja WeeklyCalendar */}
            </>
          )}
        </div>

        {/* 2. Gráfico de evolución por semana */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Evolución de horas por semana
                </h3>
                <p className="text-xs text-slate-500">
                  Comparación de tus últimas semanas
                </p>
              </div>
            </div>
          </div>

          {weeklyTrends.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-6">
              Aún no hay suficientes datos para mostrar tendencias.
            </div>
          ) : (
            <div className="h-48 flex items-end gap-4">
              {weeklyTrends.map((week: any, index: number) => {
                const hours = Number(week.horas) || 0;

                let barHeight = '6px';
                if (hours > 0 && maxHours > 0) {
                  const percent = (hours / maxHours) * 100;
                  barHeight = `${Math.max(20, percent)}%`;
                }

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div className="w-full h-32 bg-slate-100 rounded-lg flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-lg transition-all"
                        style={{ height: barHeight }}
                      />
                    </div>

                    <span className="mt-2 text-[11px] text-slate-500">
                      {week.semana || `Semana ${index + 1}`}
                    </span>

                    <span className="text-[12px] text-slate-700 font-semibold">
                      {hours}h
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;
