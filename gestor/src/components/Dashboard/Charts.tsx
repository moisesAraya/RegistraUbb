import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer
} from 'recharts';

interface ChartsProps {
  weeklyTrends?: Array<{
    day_name: string;
    unique_users: number;
    total_records: number;
  }>;
  attendanceByPeriod?: {
    today: number;
    this_week: number;
    this_month: number;
  };
  personalStats?: {
    recent_activities?: Array<{
      date: string;
      time: string;
      description: string;
      status: string;
    }>;
  };
}

export const Charts: React.FC<ChartsProps> = ({ 
  weeklyTrends, 
  attendanceByPeriod,
  personalStats 
}) => {
  
  // ✅ USAR DATOS REALES O FALLBACK
  const weeklyData = weeklyTrends && weeklyTrends.length > 0 ? weeklyTrends : [
    { day_name: 'Lun', unique_users: 8, total_records: 15 },
    { day_name: 'Mar', unique_users: 9, total_records: 18 },
    { day_name: 'Mié', unique_users: 10, total_records: 20 },
    { day_name: 'Jue', unique_users: 7, total_records: 14 },
    { day_name: 'Vie', unique_users: 6, total_records: 12 }
  ];

  // ✅ DATOS REALES PARA GRÁFICO CIRCULAR
  const periodData = [
    { 
      name: 'Hoy', 
      value: attendanceByPeriod?.today || 0, 
      color: '#3B82F6' 
    },
    { 
      name: 'Esta Semana', 
      value: attendanceByPeriod?.this_week || 0, 
      color: '#10B981' 
    },
    { 
      name: 'Este Mes', 
      value: attendanceByPeriod?.this_month || 0, 
      color: '#8B5CF6' 
    }
  ];

  // ✅ GENERAR DATOS DE ACTIVIDAD DIARIA DESDE ACTIVIDADES RECIENTES
  const dailyActivity = React.useMemo(() => {
    if (personalStats?.recent_activities && personalStats.recent_activities.length > 0) {
      // Agrupar por hora
      const hourCounts = personalStats.recent_activities.reduce((acc, activity) => {
        const hour = activity.time.split(':')[0] + ':00';
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(hourCounts).map(([time, marcajes]) => ({
        time,
        marcajes
      }));
    }

    // Datos de fallback
    return [
      { time: '08:00', marcajes: 5 },
      { time: '09:00', marcajes: 2 },
      { time: '12:00', marcajes: 8 },
      { time: '13:00', marcajes: 6 },
      { time: '17:00', marcajes: 4 },
      { time: '18:00', marcajes: 3 }
    ];
  }, [personalStats?.recent_activities]);

  // ✅ DEBUG: Mostrar datos recibidos
  console.log('📊 [CHARTS] Datos recibidos:', {
    weeklyTrends,
    attendanceByPeriod,
    personalStats,
    processedWeeklyData: weeklyData,
    processedPeriodData: periodData,
    processedDailyActivity: dailyActivity
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Gráfico de Tendencias Semanales */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Tendencias Semanales</h3>
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Usuarios Únicos</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Total Registros</span>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="day_name" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="unique_users" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="total_records" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Actividad Diaria */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Actividad por Horas</h3>
          <span className="text-sm text-slate-600">
            {personalStats?.recent_activities?.length > 0 ? 'Datos reales' : 'Datos de ejemplo'}
          </span>
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="marcajes" 
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico Circular de Distribución */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Distribución de Asistencia</h3>
          <span className="text-sm text-slate-600">
            Total: {(periodData.reduce((sum, item) => sum + item.value, 0))}
          </span>
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={periodData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {periodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Actividades Recientes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Actividades Recientes</h3>
          <span className="text-sm text-slate-600">
            {personalStats?.recent_activities?.length || 0} registros
          </span>
        </div>
        
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {personalStats?.recent_activities && personalStats.recent_activities.length > 0 ? (
            personalStats.recent_activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-500' : 
                    activity.status === 'justified' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-600">{activity.date} a las {activity.time}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                  activity.status === 'justified' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.status === 'completed' ? 'Completado' :
                   activity.status === 'justified' ? 'Justificado' : 'Pendiente'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No hay actividades recientes disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};