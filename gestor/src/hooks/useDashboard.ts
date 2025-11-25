import { useState, useEffect } from "react";
import { useAuth } from "../components/Context/AuthContext";

interface PersonalStats {
  today_hours: number;
  total_hours_month: number;
  days_worked_month: number;
  avg_hours_per_day: number;
  attendance_rate: number;
  week_hours?: number;
  month_hours?: number;
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
  status: "completed" | "on_track" | "behind" | "needs_attention";
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
  productivity_metrics?: any;
  comparative_analytics?: any;
  predictions_insights?: any;
  health_wellness?: any;
  achievements_goals?: any;
  metadata: {
    generated_at: string;
    user_rut: string;
    version: string;
    source: string;
    target_weekly_hours?: number;
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchDashboardData = async () => {
    if (!user?.rut_usuario) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(`${API_URL}/dashboard/basic-stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();

      if (!responseData || !responseData.success) {
        throw new Error("Respuesta del servidor inválida");
      }

      const data = responseData.data;

      const mappedData: DashboardData = {
        personal_basic_stats: {
          today_hours: data?.personal_basic_stats?.today_hours || 0,
          total_hours_month:
            data?.personal_basic_stats?.total_hours_month || 0,
          days_worked_month:
            data?.personal_basic_stats?.days_worked_month || 0,
          avg_hours_per_day:
            data?.personal_basic_stats?.avg_hours_per_day || 0,
          attendance_rate: data?.personal_basic_stats?.attendance_rate || 0,
          week_hours: data?.personal_basic_stats?.week_hours || 0,
          month_hours:
            data?.personal_basic_stats?.month_hours ||
            data?.personal_basic_stats?.total_hours_month ||
            0,
          pending_justifications:
            data?.personal_basic_stats?.pending_justifications || 0,
          recent_activities:
            data?.personal_basic_stats?.recent_activities || [],
        },
        attendance_analytics: data?.attendance_analytics || {
          attendance_by_period: {
            today: 0,
            this_week: 0,
            this_month: 0,
          },
          weekly_trends: [],
        },
        organization_overview: data?.organization_overview || {
          total_active_users: 0,
          users_by_role: [],
          qr_code_stats: { active: 0, inactive: 0 },
        },
        weekly_progress: data?.weekly_progress
          ? { ...data.weekly_progress }
          : undefined,
        metadata: data?.metadata || {
          generated_at: new Date().toISOString(),
          user_rut: user.rut_usuario,
          version: "unknown",
          source: "basic-stats",
        },
      };


      setDashboardData(mappedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      console.error("❌ [useDashboard] Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.rut_usuario]);


  return {
    dashboardData,
    realTimeData,
    isLoading,
    error,
    refetch,
  };
}
