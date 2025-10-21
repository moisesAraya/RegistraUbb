import React from 'react';
import { 
  BarChart3, AlertCircle, Users, RefreshCw, Wifi, WifiOff, Activity, Shield
} from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { MetricsCards } from './MetricsCards';
import { Charts } from './Charts';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, realTimeData, isLoading, error, refetch } = useDashboard();

  console.log('👑 [ADMIN-DASHBOARD] Renderizando para:', user?.nombres, 'Rol:', user?.id_rol);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 font-medium">Cargando dashboard administrativo...</p>
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error al cargar dashboard administrativo</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <p className="text-slate-500 text-sm mb-4">Usuario: {user?.rut_usuario}</p>
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

  const userName = user ? `${user.nombres} ${user.apellidos}` : 'Administrator';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header administrativo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <Shield className="h-7 w-7 text-red-600 mr-3" />
                Dashboard Administrativo - RegistraUBB
              </h1>
              <p className="text-slate-600 mt-1">
                Panel de control - {userName}
              </p>
              <p className="text-slate-500 text-sm">
                RUT: {user?.rut_usuario} | Rol: {user?.id_rol === 1 ? 'Desarrollador' : 'Administrador'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {realTimeData ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-slate-600">
                  {realTimeData ? 'Sistema operativo' : 'Sistema degradado'}
                </span>
              </div>

              <button
                onClick={refetch}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Actualizar</span>
              </button>
            </div>
          </div>

          {/* Banner administrativo */}
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <div>
                <p><strong>Panel Administrativo:</strong> {dashboardData ? '✅ Operativo' : '❌ Degradado'}</p>
                <p><strong>Estadísticas globales:</strong> Horas: {dashboardData?.personal_basic_stats?.week_hours || 0}h | Asistencia: {dashboardData?.personal_basic_stats?.attendance_rate || 0}%</p>
                {error && <p><strong>Error:</strong> {error}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido administrativo completo */}
        {dashboardData && (
          <div className="space-y-6">
            {/* MetricsCards administrativos */}
            <MetricsCards 
              personalStats={dashboardData.personal_basic_stats}
              attendanceAnalytics={dashboardData.attendance_analytics}
              realTimeData={realTimeData}
            />

            {/* Charts administrativos */}
            <Charts 
              weeklyTrends={dashboardData.attendance_analytics?.weekly_trends}
              attendanceByPeriod={dashboardData.attendance_analytics?.attendance_by_period}
              personalStats={dashboardData.personal_basic_stats}
            />

            {/* Vista organizacional completa */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                Vista General de la Organización
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData.organization_overview?.total_active_users || 0}
                  </p>
                  <p className="text-sm text-slate-600">Usuarios Activos</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData.organization_overview?.qr_code_stats?.active || 0}
                  </p>
                  <p className="text-sm text-slate-600">QR Codes Activos</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData.attendance_analytics?.attendance_by_period?.this_month || 0}
                  </p>
                  <p className="text-sm text-slate-600">Registros Este Mes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer administrativo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex items-center space-x-4">
              <span>Última actualización: {new Date().toLocaleString('es-CL')}</span>
              {realTimeData && (
                <span className="flex items-center space-x-1">
                  <Activity className="h-3 w-3" />
                  <span>Usuarios conectados: {realTimeData.currently_active}</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span>Panel Administrativo - RegistraUBB</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;