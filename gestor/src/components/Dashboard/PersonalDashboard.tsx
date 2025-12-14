// components/Dashboard/PersonalDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Activity,
  CheckCircle,
  Clock3,
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { useAsistencia } from '../../hooks/useAsistencia';
import WeeklyAttendanceWidget from '../Attendance/WeeklyAttendanceWidget';

const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();

  const {
    asistenciaData,
    estadisticas,
    isLoading,
    error,
    fetchAsistencia,
    fetchEstadisticas,
  } = useAsistencia();

  const displayName =
    (user as any)?.name ||
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    user?.rut_usuario ||
    'Usuario';

  // 🔹 NUEVO: semana seleccionada (0 = actual, -1 = pasada, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Efecto: cuando cambia weekOffset, verifica si hay que hacer fetch de otro mes/año
  useEffect(() => {
    // Calcular la fecha de la semana seleccionada
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - diffToMonday + weekOffset * 7);

    const mes = startOfWeek.getMonth() + 1;
    const anio = startOfWeek.getFullYear();

    // Si los datos cargados no corresponden al mes/año de la semana seleccionada, hacer fetch
    if (
      asistenciaData?.periodo?.mes !== mes ||
      asistenciaData?.periodo?.anio !== anio
    ) {
      fetchAsistencia(mes, anio);
      fetchEstadisticas?.(mes, anio);
    }
  }, [weekOffset]);

  // ---------------- ESTADOS BÁSICOS ----------------

  if (isLoading && !asistenciaData && !estadisticas) {
    return (
      <div className="bg-transparent">
        <div className="w-full mx-auto px-2 md:px-4">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="text-slate-600 font-medium">
                Cargando mi registro de horas...
              </p>
              <p className="text-slate-500 text-sm">Usuario: {displayName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !asistenciaData && !estadisticas) {
    return (
      <div className="bg-transparent">
        <div className="w-full mx-auto px-2 md:px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Error al cargar mis datos
              </h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={() => fetchAsistencia()}
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

  // ---------------- DATOS ----------------

  const registros = asistenciaData?.asistencias || [];
  const resumen = asistenciaData?.resumen || null;

  // ---------------- CÁLCULO DE SEMANA (DINÁMICO) ----------------

  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  // 🔹 CAMBIADO: ahora depende de weekOffset
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - diffToMonday + weekOffset * 7);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // ---------------- REGISTROS DE LA SEMANA SELECCIONADA ----------------

  const registrosSemana = registros.filter((r: any) => {
    if (!r.fecha) return false;
    const fecha = new Date(`${r.fecha}T00:00:00`);
    return fecha >= startOfWeek && fecha <= endOfWeek;
  });

  const hoursThisWeek = registrosSemana.reduce((sum, r: any) => {
    const h = Number(r.horasTrabajadas ?? r.horas_diarias ?? 0);
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  const targetHours = 44;
  const hoursRemaining = Math.max(targetHours - hoursThisWeek, 0);
  const progressPercentage =
    targetHours > 0 ? Math.round((hoursThisWeek / targetHours) * 100) : 0;

  const daysWorkedThisWeek = registrosSemana.filter((r: any) => {
    const h = Number(r.horasTrabajadas ?? r.horas_diarias ?? 0);
    return h > 0;
  }).length;

  const avgDailyHours =
    daysWorkedThisWeek > 0
      ? Math.round((hoursThisWeek / daysWorkedThisWeek) * 100) / 100
      : 0;

  // ---------------- HELPER ----------------

  function formatHorasMinutos(horas: number): string {
    const totalMinutos = Math.round((Number(horas) || 0) * 60);
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  // ---------------- EVOLUCIÓN POR SEMANA (NO SE TOCA) ----------------

  type WeeklyTrend = {
    semana: string;
    horas: number;
  };

  const buildWeeklyTrends = (): WeeklyTrend[] => {
    if (!registros || registros.length === 0) return [];

    const trends: WeeklyTrend[] = [];

    for (let i = 3; i >= 0; i--) {
      const start = new Date(startOfWeek);
      start.setDate(startOfWeek.getDate() - 7 * i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const horasSemana = registros.reduce((sum: number, r: any) => {
        if (!r.fecha) return sum;
        const f = new Date(`${r.fecha}T00:00:00`);
        if (f >= start && f <= end) {
          const h = Number(r.horasTrabajadas ?? r.horas_diarias ?? 0);
          return sum + (isNaN(h) ? 0 : h);
        }
        return sum;
      }, 0);

      trends.push({
        semana: `Semana ${4 - i}`,
        horas: horasSemana,
      });
    }

    return trends;
  };

  const weeklyTrends = buildWeeklyTrends();
  const maxHours =
    weeklyTrends.length > 0
      ? Math.max(...weeklyTrends.map((w) => w.horas || 0))
      : 0;

  // ---------------- REFRESH ----------------

  const handleRefresh = () => {
    const mes = asistenciaData?.periodo?.mes;
    const anio = asistenciaData?.periodo?.anio;

    if (mes && anio) {
      fetchAsistencia(mes, anio);
      fetchEstadisticas?.(mes, anio);
    } else {
      fetchAsistencia();
      fetchEstadisticas?.();
    }
  };

  return (
    <div className="bg-transparent">
      <div className="w-full mx-auto px-2 md:px-6 pt-2 pb-6 space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              Mi Registro de Horas
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Resumen visual para {displayName}
            </p>
            {resumen && (
              <p className="text-slate-500 text-xs md:text-sm mt-1">
                Este mes: {resumen.horasTotales}h en {resumen.diasTrabajados} días
              </p>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* PROGRESO SEMANAL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Progreso semanal
              </h2>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center space-x-3">
                  <Clock3 className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                      Progreso semana actual
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Objetivo: {weeklyProgress.target_weekly_hours} horas esta semana
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
              <div className="mb-3">
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
                      width: `${Math.min(weeklyProgress.progress_percentage, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs md:text-sm text-slate-600">
                  <span>{weeklyProgress.progress_percentage}% completado</span>
                  <span>
                    {weeklyProgress.hours_remaining > 0 ? (
                      `${weeklyProgress.hours_remaining}h restantes para el objetivo`
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-1 text-xs md:text-sm">
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
            </>
          )}
        </div>

        {/* CALENDARIO SEMANAL */}
        <WeeklyAttendanceWidget
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
        />

        {/* EVOLUCIÓN POR SEMANA (IGUAL QUE ANTES) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
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

          {weeklyTrends.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-6">
              Aún no hay suficientes datos para mostrar tendencias.
            </div>
          ) : (
            <div className="h-48 flex items-end gap-4">
              {weeklyTrends.map((week, index) => {
                const hours = week.horas || 0;
                let barHeight = '6px';

                if (hours > 0 && maxHours > 0) {
                  const percent = (hours / maxHours) * 100;
                  barHeight = `${Math.max(20, percent)}%`;
                }

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full h-32 bg-slate-100 rounded-lg flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-lg transition-all"
                        style={{ height: barHeight }}
                      />
                    </div>
                    <span className="mt-2 text-[11px] text-slate-500">
                      {week.semana}
                    </span>
                    <span className="text-[12px] text-slate-700 font-semibold">
                      {formatHorasMinutos(hours)}h
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
