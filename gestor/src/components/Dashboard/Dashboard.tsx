import React from 'react';
import { Clock, TrendingUp, AlertCircle, Target } from 'lucide-react';
import StatsCard from './StatsCard';
import type { DashboardStats, User } from '../../types';

interface DashboardProps {
  user: User;
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ user, stats }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Calcular horas de la semana actual (simulado)
  const currentWeekHours = 38.5; // Horas trabajadas esta semana
  const requiredWeeklyHours = 44; // Horas requeridas por semana
  const weeklyProgress = Math.min((currentWeekHours / requiredWeeklyHours) * 100, 100);
  const hoursRemaining = Math.max(requiredWeeklyHours - currentWeekHours, 0);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido al sistema de gestión de asistencia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Horas Semanales"
          value={`${currentWeekHours}h / ${requiredWeeklyHours}h`}
          icon={Target}
          color="blue"
          trend={{ 
            value: weeklyProgress, 
            isPositive: weeklyProgress >= 80,
            label: hoursRemaining > 0 ? `Faltan ${hoursRemaining}h` : '¡Meta cumplida!'
          }}
        />
        
        <StatsCard
          title="Presentes Hoy"
          value={stats.presentToday}
          icon={Clock}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Tasa de Asistencia"
          value={`${stats.attendanceRate}%`}
          icon={TrendingUp}
          color="cyan"
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title="Justificaciones Pendientes"
          value={stats.pendingJustifications}
          icon={AlertCircle}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Asistencia de la Semana
          </h3>
          <div className="space-y-3">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, index) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{day}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${75 + index * 5}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {75 + index * 5}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actividades Recientes
          </h3>
          <div className="space-y-4">
            {[
              { time: '09:30', action: 'Inicio de jornada', user: 'Ana López' },
              { time: '10:15', action: 'Registro de clase', user: 'Carlos Mendoza' },
              { time: '11:00', action: 'Justificación aprobada', user: 'María González' },
              { time: '11:45', action: 'Fin de actividad', user: 'Pedro Silva' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user} - {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;