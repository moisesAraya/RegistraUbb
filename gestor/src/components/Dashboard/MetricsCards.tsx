import React from 'react';
import { 
  Clock, TrendingUp, AlertCircle, Users, BarChart3, 
  CheckCircle2, Calendar, Activity, Target, Award 
} from 'lucide-react';

interface MetricsCardsProps {
  personalStats?: {
    today_hours: number;
    week_hours: number;
    month_hours: number;
    attendance_rate: number;
    pending_justifications: number;
  };
  // ✅ AGREGAR DATOS REALES DE ASISTENCIA
  attendanceAnalytics?: {
    attendance_by_period: {
      today: number;
      this_week: number;
      this_month: number;
    };
  };
  realTimeData?: {
    currently_active: number;
  };
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  personalStats, 
  attendanceAnalytics,
  realTimeData 
}) => {
  // ✅ USAR DATOS REALES EN LUGAR DE VALORES HARDCODEADOS
  const cards = [
    {
      title: 'Horas Hoy',
      value: personalStats?.today_hours || 0,
      unit: 'hrs',
      icon: Clock,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: personalStats?.today_hours > 0 ? `${personalStats.today_hours}h registradas` : 'Sin registros hoy'
    },
    {
      title: 'Horas Semana',
      value: personalStats?.week_hours || 0,
      unit: 'hrs',
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: personalStats?.week_hours > 0 ? `${personalStats.week_hours}h esta semana` : 'Sin horas esta semana'
    },
    {
      title: 'Tasa Asistencia',
      value: personalStats?.attendance_rate || 0,
      unit: '%',
      icon: TrendingUp,
      color: personalStats?.attendance_rate >= 80 ? 'bg-green-500' : 'bg-yellow-500',
      bgColor: personalStats?.attendance_rate >= 80 ? 'bg-green-50' : 'bg-yellow-50',
      textColor: personalStats?.attendance_rate >= 80 ? 'text-green-700' : 'text-yellow-700',
      change: personalStats?.attendance_rate >= 80 ? 'Excelente asistencia' : 'Puede mejorar'
    },
    {
      title: 'Asistencia Hoy',
      value: attendanceAnalytics?.attendance_by_period?.today || realTimeData?.currently_active || 0,
      unit: 'personas',
      icon: Users,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      change: `${attendanceAnalytics?.attendance_by_period?.this_week || 0} esta semana`
    },
    {
      title: 'Justificaciones',
      value: personalStats?.pending_justifications || 0,
      unit: 'pendientes',
      icon: AlertCircle,
      color: personalStats?.pending_justifications > 0 ? 'bg-red-500' : 'bg-gray-500',
      bgColor: personalStats?.pending_justifications > 0 ? 'bg-red-50' : 'bg-gray-50',
      textColor: personalStats?.pending_justifications > 0 ? 'text-red-700' : 'text-gray-700',
      change: personalStats?.pending_justifications > 0 ? 'Requiere atención' : 'Todo al día'
    }
  ];

  // ✅ DEBUG: Mostrar datos recibidos en consola
  console.log('🎯 [METRICS-CARDS] Datos recibidos:', {
    personalStats,
    attendanceAnalytics,
    realTimeData
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 ${card.color} rounded-lg`}>
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-baseline space-x-1">
                  <span className={`text-2xl font-bold ${card.textColor}`}>
                    {typeof card.value === 'number' ? card.value.toFixed(card.unit === 'hrs' ? 1 : 0) : card.value}
                  </span>
                  <span className={`text-sm font-medium ${card.textColor} opacity-70`}>
                    {card.unit}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className={`font-medium ${card.textColor} text-sm mb-1`}>
                {card.title}
              </h3>
              <p className={`text-xs ${card.textColor} opacity-60`}>
                {card.change}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};