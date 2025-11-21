import React from 'react';
import { useAuth } from '../Context/AuthContext';
import PersonalDashboard from './PersonalDashboard';
import AdminDashboard from './AdminDashboard';

import ManualAttendanceButton from '../Attendance/ManualAttendanceButton';
import { useAsistenciaContext } from '../../context/AsistenciaContext';

import { AlertTriangle, Shield, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { registrarMarcajeManual } = useAsistenciaContext();

  // Si no hay sesión
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto">
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

  // Roles
  const isAdministrador = user.id_rol === 1;
  const isUsuario = user.id_rol === 2;
  const isDesarrollador = user.id_rol === 3;

  const shouldSeeAdminDashboard = isAdministrador || isDesarrollador;

  // Dashboard Admin
  if (shouldSeeAdminDashboard) {
    return <AdminDashboard />;
  }

  // Dashboard Usuario
  if (isUsuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto space-y-8">
          
          {/* 📊 Dashboard personal (FULL WIDTH) */}
          <PersonalDashboard />


        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <User className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Dashboard no disponible</h3>
            <p className="text-slate-600 mb-4">
              Tu rol ({user.id_rol}) no tiene un dashboard asignado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
