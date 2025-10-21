import { useState, useEffect } from 'react';
import { useAuth } from '../components/Context/AuthContext';

interface PersonalStats {
  today_hours: number;
  week_hours: number;
  month_hours: number;
  attendance_rate: number;
  pending_justifications: number;
  recent_activities: Array<{
    date: string;
    time: string;
    description: string;
    status: string;
    type: string;
  }>;
}

interface AttendanceAnalytics {
  attendance_by_period: {
    today: number;
    this_week: number;
    this_month: number;
  };
  weekly_trends: Array<{
    day_name: string;
    unique_users: number;
    total_records: number;
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
        personal_basic_stats: data?.personal_basic_stats || {
          today_hours: 0,
          week_hours: 0,
          month_hours: 0,
          attendance_rate: 0,
          pending_justifications: 0,
          recent_activities: []
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