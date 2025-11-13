import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

interface PersonalStats {
  today_hours: number;
  total_hours_month: number;
  days_worked_month: number;
  avg_hours_per_day: number;
  attendance_rate: number;
  week_hours?: number; // Mantenido para compatibilidad
  month_hours?: number; // Mantenido para compatibilidad
  pending_justifications: number;
  recent_activities: Array<{
    date: string;
    time: string;
    description: string;
    status: string;
    type: string;
  }>;
}

interface WeeklyProgress {
  hours_this_week: number;
  target_weekly_hours: number;
  progress_percentage: number;
  hours_remaining: number;
  days_worked_this_week: number;
  avg_daily_hours: number;
  days_to_complete: number;
  week_start: string;
  week_end: string;
  status: 'completed' | 'on_track' | 'behind' | 'needs_attention';
}

interface AttendanceAnalytics {
  attendance_by_period: {
    today: number;
    this_week: number;
    this_month: number;
  };
  weekly_trends: Array<{
    week: string;
    hours: number;
    days: number;
  }>;
}

interface OrganizationOverview {
  total_active_users: number;
  users_by_role: Array<{
    role: string;
    count: number;
  }>;
  qr_code_stats: {
    active: number;
    inactive: number;
  };
}

interface DashboardData {
  personal_basic_stats: PersonalStats;
  attendance_analytics: AttendanceAnalytics;
  organization_overview: OrganizationOverview;
  weekly_progress?: WeeklyProgress;
  productivity_metrics?: {
    efficiency_score: number;
    consistency_score: number;
    punctuality_score: number;
    avg_hours_per_day: number;
    total_productive_hours: number;
    work_days_count: number;
    productivity_trend: string;
    improvement_suggestions: string[];
  };
  comparative_analytics?: {
    month_over_month: {
      hours_change: number;
      hours_percentage_change: number;
      trend: string;
    };
    performance_vs_target: {
      target_hours_monthly: number;
      actual_hours: number;
      achievement_percentage: number;
      gap_analysis: number;
    };
  };
  predictions_insights?: {
    monthly_projection: {
      projected_total: number;
      likelihood_to_meet_target: string;
    };
    behavioral_insights: string[];
    recommendations: string[];
  };
  health_wellness?: {
    work_life_balance: {
      score: number;
      status: string;
      recommendations: string[];
    };
    stress_indicators: {
      estimated_stress_level: number;
      status: string;
    };
    wellness_score: number;
  };
  achievements_goals?: {
    completed_goals: number;
    achievement_percentage: number;
    unlocked_achievements: Array<{
      id: string;
      name: string;
      description: string;
      unlocked: boolean;
    }>;
    upcoming_goals: Array<{
      id: string;
      name: string;
      description: string;
      progress: number;
    }>;
    monthly_challenges: string[];
    lifetime_stats: {
      total_hours_worked: number;
      total_days_worked: number;
      average_daily_hours: number;
    };
  };
  metadata: {
    generated_at: string;
    user_rut: string;
    version: string;
    source: string;
  };
}

interface RealTimeData {
  timestamp: string;
  currently_active: number;
  recent_marcajes: Array<{
    user: string;
    time: string;
    type: string;
  }>;
}

const API_URL = import.meta.env.VITE_API_URL;

export function useDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 [useDashboard] Hook iniciado para usuario:', user?.nombres);

  const fetchDashboardData = async () => {
    if (!user?.rut_usuario) {
      console.log('❌ [useDashboard] No hay usuario logueado');
      setIsLoading(false);
      return;
    }

    console.log('📡 [useDashboard] Iniciando fetch para:', user.rut_usuario);
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('📡 Llamando API dashboard/basic-stats...');

      const response = await fetch(`${API_URL}/dashboard/basic-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // ✅ OBTENER Y VERIFICAR DATOS
      const responseData = await response.json();
      console.log('📊 Respuesta completa del servidor:', responseData);
      console.log('📊 Tipo de respuesta:', typeof responseData);
      console.log('📊 Keys de respuesta:', responseData ? Object.keys(responseData) : 'null');

      // ✅ VERIFICAR ESTRUCTURA {success: true, data: {...}}
      if (!responseData || !responseData.success) {
        throw new Error('Respuesta del servidor inválida');
      }

      const data = responseData.data;
      console.log('📊 Datos extraídos:', data);
      console.log('📊 Keys de data:', data ? Object.keys(data) : 'null');

      // ✅ VERIFICAR PERSONAL_BASIC_STATS EN LA ESTRUCTURA CORRECTA
      console.log('🔍 Personal basic stats en data:', data?.personal_basic_stats);
      
      if (data?.personal_basic_stats) {
        console.log('📊 Stats detallados encontrados:', {
          today_hours: data.personal_basic_stats.today_hours,
          week_hours: data.personal_basic_stats.week_hours,
          month_hours: data.personal_basic_stats.month_hours,
          attendance_rate: data.personal_basic_stats.attendance_rate
        });
      } else {
        console.warn('⚠️ No hay personal_basic_stats en data, estructura:', data);
      }

      // ✅ MAPEAR DATOS DESDE LA ESTRUCTURA CORRECTA
      const mappedData: DashboardData = {
        personal_basic_stats: {
          today_hours: data?.personal_basic_stats?.today_hours || 0,
          total_hours_month: data?.personal_basic_stats?.total_hours_month || 0,
          days_worked_month: data?.personal_basic_stats?.days_worked_month || 0,
          avg_hours_per_day: data?.personal_basic_stats?.avg_hours_per_day || 0,
          attendance_rate: data?.personal_basic_stats?.attendance_rate || 0,
          // Compatibilidad con campos antiguos
          week_hours: data?.personal_basic_stats?.week_hours || 0,
          month_hours: data?.personal_basic_stats?.month_hours || data?.personal_basic_stats?.total_hours_month || 0,
          pending_justifications: data?.personal_basic_stats?.pending_justifications || 0,
          recent_activities: data?.personal_basic_stats?.recent_activities || []
        },
        attendance_analytics: data?.attendance_analytics || {
          attendance_by_period: {
            today: 0,
            this_week: 0,
            this_month: 0
          },
          weekly_trends: []
        },
        organization_overview: data?.organization_overview || {
          total_active_users: 0,
          users_by_role: [],
          qr_code_stats: { active: 0, inactive: 0 }
        },
        weekly_progress: data?.weekly_progress || {
          hours_this_week: 0,
          target_weekly_hours: 40,
          progress_percentage: 0,
          hours_remaining: 40,
          days_worked_this_week: 0,
          avg_daily_hours: 0,
          days_to_complete: 0,
          week_start: '',
          week_end: '',
          status: 'needs_attention'
        },
        metadata: data?.metadata || {
          generated_at: new Date().toISOString(),
          user_rut: user.rut_usuario,
          version: 'unknown',
          source: 'basic-stats'
        }
      };

      console.log('✅ Datos mapeados desde estructura correcta:', mappedData);
      console.log('📊 Stats finales verificados:', {
        today: mappedData.personal_basic_stats.today_hours,
        week: mappedData.personal_basic_stats.week_hours,
        month: mappedData.personal_basic_stats.month_hours,
        rate: mappedData.personal_basic_stats.attendance_rate
      });

      setDashboardData(mappedData);

      // ✅ LOGS DE VERIFICACIÓN FINAL
      console.log('🎯 [FINAL-CHECK] Datos que se guardarán en estado:', {
        personal_stats_existe: !!mappedData.personal_basic_stats,
        today_hours_valor: mappedData.personal_basic_stats.today_hours,
        week_hours_valor: mappedData.personal_basic_stats.week_hours,
        month_hours_valor: mappedData.personal_basic_stats.month_hours,
        attendance_rate_valor: mappedData.personal_basic_stats.attendance_rate
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ [useDashboard] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    console.log('🔄 [useDashboard] Refetch solicitado');
    fetchDashboardData();
  };

  useEffect(() => {
    console.log('🔄 [useDashboard] useEffect ejecutado');
    fetchDashboardData();
  }, [user?.rut_usuario]);

  console.log('📋 [useDashboard] Estado actual:', {
    isLoading,
    hasData: !!dashboardData,
    hasError: !!error,
    hasRealTime: !!realTimeData,
    todayHours: dashboardData?.personal_basic_stats?.today_hours
  });

  return {
    dashboardData,
    realTimeData,
    isLoading,
    error,
    refetch
  };
}