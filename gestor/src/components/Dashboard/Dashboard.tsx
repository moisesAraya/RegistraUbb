import React from 'react';
import { useAuth } from '../Context/AuthContext';
import PersonalDashboard from './PersonalDashboard';
import AdminDashboard from './AdminDashboard';

import ManualAttendanceButton from '../Attendance/ManualAttendanceButton';
import WeeklyAttendanceWidget from '../Dashboard/WeeklyCalendar'; 
import { useAsistencia } from '../../hooks/useAsistencia';

import { AlertTriangle, Shield, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { registrarMarcajeManual } = useAsistencia();

  console.log('🎯 [DASHBOARD-ROUTER] Usuario:', user?.nombres, 'Rol:', user?.id_rol);

  // ✅ Verificar autenticación
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Acceso no autorizado</h3>
              <p className="text-slate-600">Debes iniciar sesión para acceder al dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ LÓGICA DE ROLES SEGÚN SEEDERS
  const userRole = user.id_rol;

  console.log('🔍 [DASHBOARD-ROUTER] Analizando rol:', userRole, 'Tipo:', typeof userRole);

  // Rol 1: Administrador
  // Rol 2: Usuario / Académico
  // Rol 3: Desarrollador

  const isAdministrador = userRole === 1;
  const isUsuario = userRole === 2;      // <- usuario final
  const isDesarrollador = userRole === 3;

  const shouldSeeAdminDashboard = isAdministrador || isDesarrollador;

  console.log('🔍 [DASHBOARD-ROUTER] Roles detectados:', {
    administrador: isAdministrador,
    usuario: isUsuario,
    desarrollador: isDesarrollador,
    deberiaVerAdmin: shouldSeeAdminDashboard
  });

  // ✅ ADMIN / DEV → Panel administrativo
  if (shouldSeeAdminDashboard) {
    console.log('👑 Renderizando AdminDashboard para rol administrativo/desarrollador:', userRole);
    return <AdminDashboard />;
  }

  // ✅ USUARIO FINAL (rol 2) → Dashboard de usuario
  if (isUsuario) {
    console.log('👤 Renderizando Dashboard de usuario (PersonalDashboard):', userRole);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ⭐ Banner / botón de registro manual de asistencia */}
          <ManualAttendanceButton
            onSubmit={async (data) => {
              const result = await registrarMarcajeManual(data);
              return { success: !!result?.success };
            }}
          />
          {/* 🔵 Contenido del dashboard de usuario */}
          <PersonalDashboard />

          
          {/* 📅 Calendario semanal de asistencia (widget) */}
          <WeeklyAttendanceWidget />
        </div>
      </div>
    );
  }

  // ✅ FALLBACK PARA ROLES NO DEFINIDOS
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <User className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Dashboard no disponible
            </h3>
            <p className="text-slate-600 mb-4">
              Tu rol ({userRole}) no tiene un dashboard asignado.
            </p>

            {/* ✅ INFO DE DEBUG CON ROLES CORRECTOS */}
            <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg max-w-md mx-auto">
              <p className="font-medium mb-2">Debug de roles:</p>
              <div className="text-left space-y-1">
                <p>• Usuario: {user.nombres} {user.apellidos}</p>
                <p>• RUT: {user.rut_usuario}</p>
                <p>• Rol ID: {userRole} (tipo: {typeof userRole})</p>
                <p>• Es Administrador (1): {isAdministrador ? '✅' : '❌'}</p>
                <p>• Es Usuario (2): {isUsuario ? '✅' : '❌'}</p>
                <p>• Es Desarrollador (3): {isDesarrollador ? '✅' : '❌'}</p>
                <p>• Debería ver Admin: {shouldSeeAdminDashboard ? '✅' : '❌'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="font-medium mb-2">Dashboards según seeders:</p>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <Shield className="h-4 w-4 text-red-500 mr-2" />
                    Rol 1 (Admin) y 3 (Dev): Dashboard Administrativo
                  </li>
                  <li className="flex items-center">
                    <User className="h-4 w-4 text-blue-500 mr-2" />
                    Rol 2 (Usuario): Dashboard de Usuario
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
