// components/Dashboard/Dashboard.tsx
import React from 'react';
import { useAuth } from '../Context/AuthContext';
import PersonalDashboard from './PersonalDashboard';
import AdminDashboard from './AdminDashboard';
import { AlertTriangle, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // ⛔ Sin sesión
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Acceso no autorizado
          </h3>
          <p className="text-slate-600">
            Debes iniciar sesión para acceder al dashboard.
          </p>
        </div>
      </div>
    );
  }

  // 🎭 Roles
  const isAdministrador = user.id_rol === 1;
  const isUsuario = user.id_rol === 2;
  const isDesarrollador = user.id_rol === 3;

  const shouldSeeAdminDashboard = isAdministrador || isDesarrollador;

  // 📊 Dashboard Admin / Jefaturas
  if (shouldSeeAdminDashboard) {
    return <AdminDashboard />;
  }

  // 👤 Dashboard Usuario (académico)
  if (isUsuario) {
    // 🔹 SIN wrappers extras: dejamos que PersonalDashboard maneje el layout
    return <PersonalDashboard />;
  }

  // 🌀 Fallback para roles raros
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
      <div className="text-center">
        <User className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Dashboard no disponible
        </h3>
        <p className="text-slate-600 mb-4">
          Tu rol ({user.id_rol}) no tiene un dashboard asignado.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
