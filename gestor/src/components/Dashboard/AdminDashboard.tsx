import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Users, RefreshCw, Clock, TrendingUp,
  Shield, CheckCircle, BarChart3, FileText, 
  Server, UserCheck, Monitor
} from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SemanaAnteriorHora {
  dia: string;
  fecha: string;
  horas: number;
}

interface AdminStats {
  organization_overview: {
    total_active_users: number;
    totems_count: number;
    academicos_presentes: number;
    promedio_diario_academicos: number;
    total_academicos: number;
    qr_code_stats: {
      active: number;
      total: number;
    };
    system_status: string;
  };
  attendance_analytics: {
    attendance_by_period: {
      today: number;
      this_week: number;
      this_month: number;
    };
    semana_anterior_horas: SemanaAnteriorHora[];
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('👑 [ADMIN-DASHBOARD] Renderizando para:', user?.nombres, 'Rol:', user?.id_rol);

  useEffect(() => {
    if (user?.id_rol === 1) {
      fetchAdminStats();
    } else {
      setError('Acceso restringido: solo administradores');
      setIsLoading(false);
    }

  }, [user]);

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token no encontrado');

      // 👈 IMPORTANTE: usamos el backend admin
      const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error al cargar estadísticas (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      console.log('📊 [ADMIN-DASHBOARD] Datos recibidos crudos:', data);

      // Puede venir como { success, data } o directo
      const payload = (data && typeof data === 'object' && 'data' in data)
        ? data.data
        : data;

      console.log('📊 [ADMIN-DASHBOARD] Payload normalizado:', payload);

      setStats(payload);
      setError(null);
    } catch (err) {
      console.error('❌ [ADMIN-DASHBOARD] Error fetchAdminStats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error al cargar dashboard administrativo</h3>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={fetchAdminStats}
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

  // 🔐 Por si acaso, evitar que un no-admin vea algo aunque llegue aquí
  if (user && user.id_rol !== 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center space-y-3">
          <Shield className="h-10 w-10 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">Acceso restringido</h2>
          <p className="text-slate-600 text-sm text-center">
            Este panel está disponible solo para usuarios con rol de administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Administrativo */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                Panel de Administración
              </h1>
              <p className="text-slate-600 mt-2">
                Sistema de Registro de Horas - RegistraUBB
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Administrador: {userName}
              </p>
            </div>
            
            <button
              onClick={fetchAdminStats}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Resumen General - 4 Cards principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Usuarios */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stats?.organization_overview?.total_active_users ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Registrados en el sistema</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Totems Activos */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Totems Activos</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stats?.organization_overview?.totems_count ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Dispositivos disponibles</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Server className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Académicos Presentes */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Académicos Presentes</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stats?.organization_overview?.academicos_presentes ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Trabajando hoy</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Promedio Diario de Académicos */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Promedio Diario</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stats?.organization_overview?.promedio_diario_academicos ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Académicos por día</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Fila de 2 columnas: Gráfico de Horas y Estado del Sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico de Horas de Semana Anterior */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              Horas Trabajadas - Semana Anterior
            </h3>
            
            <div className="h-64">
              {stats?.attendance_analytics?.semana_anterior_horas && stats.attendance_analytics.semana_anterior_horas.length > 0 ? (
                <Bar
                  data={{
                    labels: stats.attendance_analytics.semana_anterior_horas.map((item: SemanaAnteriorHora) => item.dia),
                    datasets: [
                      {
                        label: 'Horas Trabajadas',
                        data: stats.attendance_analytics.semana_anterior_horas.map((item: SemanaAnteriorHora) => item.horas),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Horas'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Días de la Semana'
                        }
                      }
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p>No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              Estado del Sistema
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-slate-700">QR Codes Activos</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {stats?.organization_overview?.qr_code_stats?.active ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-slate-700">Totems Disponibles</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {stats?.organization_overview?.totems_count ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-slate-700">Total Académicos</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {stats?.organization_overview?.total_academicos ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-slate-700">Última Actualización</span>
                </div>
                <span className="text-xs text-slate-600">
                  {new Date().toLocaleTimeString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Accesos Rápidos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/users"
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <Users className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-medium text-slate-900">Gestión Usuarios</p>
                <p className="text-xs text-slate-600">Administrar académicos</p>
              </div>
            </a>

            <a
              href="/totems"
              className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <Shield className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-medium text-slate-900">Gestión Totems</p>
                <p className="text-xs text-slate-600">Configurar totems</p>
              </div>
            </a>

            <a
              href="/reports"
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <FileText className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-medium text-slate-900">Reportes</p>
                <p className="text-xs text-slate-600">Generar informes</p>
              </div>
            </a>

            <a
              href="/settings"
              className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <Shield className="h-6 w-6 text-orange-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-medium text-slate-900">Configuración</p>
                <p className="text-xs text-slate-600">Ajustes del sistema</p>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex items-center space-x-4">
              <span>Última actualización: {new Date().toLocaleString('es-CL')}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span>RegistraUBB v2.0</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                ADMINISTRADOR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
