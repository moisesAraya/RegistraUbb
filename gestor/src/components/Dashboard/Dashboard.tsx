import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Target, 
  QrCode,
  Calendar,
  Award,
  Activity,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import StatsCard from './StatsCard';

interface DashboardStats {
  presentToday: number;
  attendanceRate: number;
  pendingJustifications: number;
  weeklyHours: number;
}

const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    presentToday: 0,
    attendanceRate: 0,
    pendingJustifications: 0,
    weeklyHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ✅ Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  console.log('🏠 Dashboard renderizando...');
  console.log('👤 Usuario en Dashboard:', user);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md border border-slate-200">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-300 border-t-slate-600 mx-auto mb-6"></div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Error de Sesión</h2>
          <p className="text-slate-600 mb-6">Usuario no encontrado. Por favor, inicie sesión nuevamente.</p>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  const nombreCompleto = `${user.nombres || ''} ${user.apellidos || ''}`.trim();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Buenos días', emoji: '🌅', color: 'text-amber-600' };
    if (hour < 18) return { text: 'Buenas tardes', emoji: '☀️', color: 'text-orange-600' };
    return { text: 'Buenas noches', emoji: '🌙', color: 'text-indigo-600' };
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log('📊 Cargando estadísticas del dashboard...');
        
        setTimeout(() => {
          setStats({
            presentToday: 42,
            attendanceRate: 94,
            pendingJustifications: 3,
            weeklyHours: 38.5
          });
          setLoading(false);
        }, 1500);
        
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const currentWeekHours = stats.weeklyHours;
  const requiredWeeklyHours = user.horas_atrabajar || 44;
  const weeklyProgress = Math.min((currentWeekHours / requiredWeeklyHours) * 100, 100);
  const hoursRemaining = Math.max(requiredWeeklyHours - currentWeekHours, 0);

  const greeting = getGreeting();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-3 border-slate-200 border-t-slate-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-slate-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Cargando Dashboard</h3>
          <p className="text-slate-600">Preparando su espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ✅ Header Hero profesional */}
      <div className="relative bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 overflow-hidden">
        {/* Decorative background más sutil */}
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute top-0 left-0 right-0 h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-200 opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-200 opacity-10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">{greeting.emoji}</span>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                    {greeting.text}, <span className="text-slate-300">{user.nombres}</span>
                  </h1>
                  <p className="text-slate-300 text-base mt-2">
                    Sistema de Gestión de Asistencia - Universidad del Bío-Bío
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-slate-300">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">RUT: {user.rut_usuario}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {user.id_rol === 1 ? 'Administrador' : user.id_rol === 2 ? 'Académico' : 'Usuario'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {currentTime.toLocaleTimeString('es-CL', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Card más profesional */}
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-white/20 shadow-lg">
                <h3 className="text-slate-800 font-semibold mb-4 flex items-center text-sm">
                  <Target className="h-4 w-4 mr-2" />
                  Progreso Semanal
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-700 text-sm">
                    <span>Horas trabajadas:</span>
                    <span className="font-semibold">{currentWeekHours}h / {requiredWeeklyHours}h</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600">
                    {hoursRemaining > 0 ? `Faltan ${hoursRemaining}h para cumplir la meta` : 'Meta semanal cumplida'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ✅ Stats Cards profesionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="group bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-xs font-medium uppercase tracking-wide">Presentes Hoy</p>
                <p className="text-2xl font-bold mt-1">{stats.presentToday}</p>
                <p className="text-slate-300 text-xs mt-1">+8% vs ayer</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Tasa Asistencia</p>
                <p className="text-2xl font-bold mt-1">{stats.attendanceRate}%</p>
                <p className="text-blue-200 text-xs mt-1">Excelente</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Justificaciones</p>
                <p className="text-2xl font-bold mt-1">{stats.pendingJustifications}</p>
                <p className="text-amber-200 text-xs mt-1">Pendientes</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs font-medium uppercase tracking-wide">Horas Semana</p>
                <p className="text-2xl font-bold mt-1">{currentWeekHours}h</p>
                <p className="text-indigo-200 text-xs mt-1">de {requiredWeeklyHours}h</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Quick Actions profesionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Mi Código QR</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Generar y gestionar su código QR personal para registro de asistencia
              </p>
              <a
                href="/qr"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span>Gestionar QR</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-slate-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Mis Registros</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Visualizar historial de asistencia y estadísticas personales
              </p>
              <button className="inline-flex items-center space-x-2 bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                <span>Próximamente</span>
              </button>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Reportes</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Generar reportes de asistencia y productividad
              </p>
              <button className="inline-flex items-center space-x-2 bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                <span>Próximamente</span>
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Charts Section profesional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Progress Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Calendar className="h-5 w-5 text-slate-600 mr-2" />
                Asistencia Semanal
              </h3>
              <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full border">
                Semana Actual
              </span>
            </div>
            <div className="space-y-3">
              {[
                { day: 'Lunes', percentage: 95, hours: '8.5h', status: 'complete' },
                { day: 'Martes', percentage: 90, hours: '8.0h', status: 'complete' },
                { day: 'Miércoles', percentage: 85, hours: '7.5h', status: 'complete' },
                { day: 'Jueves', percentage: 80, hours: '7.0h', status: 'complete' },
                { day: 'Viernes', percentage: 75, hours: '6.5h', status: 'current' },
              ].map((day, index) => (
                <div key={day.day} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      day.status === 'complete' ? 'bg-blue-500' : 
                      day.status === 'current' ? 'bg-slate-400 animate-pulse' : 'bg-slate-300'
                    }`}></div>
                    <span className="text-sm font-medium text-slate-900 min-w-[70px]">{day.day}</span>
                    <span className="text-xs text-slate-500">{day.hours}</span>
                  </div>
                  <div className="flex items-center space-x-3 flex-1 max-w-[180px]">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-700 delay-${index * 100} ${
                          day.status === 'complete' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          day.status === 'current' ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                          'bg-slate-300'
                        }`}
                        style={{ width: `${day.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-slate-700 min-w-[35px]">
                      {day.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Activity className="h-5 w-5 text-slate-600 mr-2" />
                Actividad Reciente
              </h3>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                Ver todo
              </button>
            </div>
            <div className="space-y-3">
              {[
                { 
                  time: '09:30', 
                  action: 'Inicio de jornada', 
                  status: 'success',
                  icon: CheckCircle2,
                  color: 'text-blue-600 bg-blue-50'
                },
                { 
                  time: '10:15', 
                  action: 'Generación de QR personal', 
                  status: 'info',
                  icon: QrCode,
                  color: 'text-slate-600 bg-slate-50'
                },
                { 
                  time: '11:00', 
                  action: 'Registro de asistencia', 
                  status: 'success',
                  icon: Clock,
                  color: 'text-blue-600 bg-blue-50'
                },
                { 
                  time: '11:45', 
                  action: 'Última actividad registrada', 
                  status: 'info',
                  icon: Activity,
                  color: 'text-slate-600 bg-slate-50'
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`p-1.5 rounded-lg ${activity.color}`}>
                    <activity.icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                  <div className="text-xs text-slate-400">
                    Hoy
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ Debug info profesional */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
              <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
              Información de Desarrollo
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="font-medium text-slate-900">Usuario</p>
                <p className="text-slate-700">{user.rut_usuario}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="font-medium text-blue-900">Nombre</p>
                <p className="text-blue-700">{nombreCompleto}</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg">
                <p className="font-medium text-indigo-900">Rol</p>
                <p className="text-indigo-700">ID {user.id_rol}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="font-medium text-slate-900">Estado</p>
                <p className="text-slate-700">{isAuthenticated ? 'Autenticado' : 'No auth'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;