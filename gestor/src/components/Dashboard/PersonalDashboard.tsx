import React from 'react';
import { 
  Clock, Calendar, TrendingUp, CheckCircle, AlertTriangle, 
  User, RefreshCw, BarChart3
} from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';

const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, isLoading, error, refetch } = useDashboard();

  console.log('👤 [PERSONAL-DASHBOARD] Renderizando para:', user?.nombres, 'Rol:', user?.id_rol);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 font-medium">Cargando mis estadísticas...</p>
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

  const stats = dashboardData?.personal_basic_stats || {
    today_hours: 0,
    week_hours: 0,
    month_hours: 0,
    attendance_rate: 0,
    pending_justifications: 0,
    recent_activities: []
  };

  const userName = user ? `${user.nombres} ${user.apellidos}` : 'Usuario';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ✅ Header Personal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <User className="h-7 w-7 text-blue-600 mr-3" />
                Mi Dashboard Personal
              </h1>
              <p className="text-slate-600 mt-1">
                Bienvenido, {userName}
              </p>
              <p className="text-slate-500 text-sm">
                RUT: {user?.rut_usuario} | Académico
              </p>
            </div>
            
            <button
              onClick={refetch}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Actualizar</span>
            </button>
          </div>

          {/* ✅ Banner personal con mis datos */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <p><strong>Mi estado:</strong> {dashboardData ? '✅ Datos disponibles' : '❌ Sin datos'}</p>
              <p><strong>Mis horas hoy:</strong> {stats.today_hours}h | <strong>Esta semana:</strong> {stats.week_hours}h | <strong>Mi asistencia:</strong> {stats.attendance_rate}%</p>
            </div>
          </div>
        </div>

        {/* ✅ Cards de MIS Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Mis Horas de Hoy */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mis Horas Hoy</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.today_hours}h
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.today_hours > 0 ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Trabajé hoy
                </span>
              ) : (
                <span className="text-slate-500">Sin registros hoy</span>
              )}
            </div>
          </div>

          {/* Mis Horas de la Semana */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Esta Semana</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.week_hours}h
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-500">
                Promedio: {stats.week_hours > 0 ? (stats.week_hours / 5).toFixed(1) : 0}h/día
              </span>
            </div>
          </div>

          {/* Mis Horas del Mes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Este Mes</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.month_hours}h
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-500">
                Total acumulado
              </span>
            </div>
          </div>

          {/* Mi Asistencia */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mi Asistencia</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.attendance_rate}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                stats.attendance_rate >= 90 ? 'bg-green-100' : 
                stats.attendance_rate >= 70 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <TrendingUp className={`h-6 w-6 ${
                  stats.attendance_rate >= 90 ? 'text-green-600' : 
                  stats.attendance_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`${
                stats.attendance_rate >= 90 ? 'text-green-600' : 
                stats.attendance_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.attendance_rate >= 90 ? 'Excelente' : 
                 stats.attendance_rate >= 70 ? 'Bueno' : 'Mejorar'}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ Mi Actividad Reciente */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            Mi Actividad Reciente
          </h3>
          
          {stats.recent_activities.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_activities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-500' : 
                      activity.status === 'warning' ? 'bg-yellow-500' : 'bg-slate-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-slate-900">{activity.description}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(activity.date).toLocaleDateString('es-CL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{activity.time}</p>
                    <p className={`text-xs ${
                      activity.status === 'completed' ? 'text-green-600' : 
                      activity.status === 'warning' ? 'text-yellow-600' : 'text-slate-500'
                    }`}>
                      {activity.status === 'completed' ? 'Presente' : 
                       activity.status === 'warning' ? 'Tarde' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No hay actividad reciente registrada</p>
            </div>
          )}
        </div>

        {/* ✅ Mi Resumen Personal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Mi Resumen del Mes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.month_hours}h</p>
              <p className="text-sm text-slate-600">Horas trabajadas</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.attendance_rate}%</p>
              <p className="text-sm text-slate-600">Mi asistencia</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.recent_activities.length}</p>
              <p className="text-sm text-slate-600">Días registrados</p>
            </div>
          </div>
        </div>

        {/* ✅ Footer personal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-slate-600">
            <span>Última actualización: {new Date().toLocaleString('es-CL')}</span>
            <span>Mi Dashboard Personal - RegistraUBB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;