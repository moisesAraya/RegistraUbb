import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from '../Dashboard/Dashboard';
import QRCodeManager from '../QRCode/QRCodeManager';
import AttendanceList from '../Attendance/AttendanceList';
import ManualAttendanceButton from '../Attendance/ManualAttendanceButton';
import ReportsSection from '../Reports/ReportsSection';
import JustificationManager from '../Justifications/JustificationManager';
import UserManagement from '../Admin/UserManagement';
import ApprovalManager from '../Admin/ApprovalManager';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Convertir usuario del contexto al formato esperado por Header
  const userForHeader = {
    id: user.rut_usuario,
    name: `${user.nombres} ${user.apellidos}`,
    email: user.email,
    role: user.id_rol === 1 ? 'admin' : user.id_rol === 2 ? 'academic' : 'usuario',
    department: 'Ingeniería',
    rut: user.rut_usuario,
    horas_atrabajar: user.horas_atrabajar
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Header siempre visible */}
      <Header 
        user={userForHeader} 
        onLogout={logout} 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      
      <div className="flex">
        {/* ✅ Sidebar siempre disponible */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
        
        {/* ✅ Main content con rutas */}
        <main className="flex-1 p-4 lg:p-6 transition-all duration-300">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/qr" element={<QRCodeManager />} />
            <Route path="/attendance" element={
              <div className="space-y-6">
                {userForHeader.role === 'academic' && (
                  <ManualAttendanceButton 
                    onSubmit={async (data) => {
                      console.log('🎯 Datos recibidos en AppContent:', data);
                      // Aquí iría la lógica para enviar al backend
                      return { success: true };
                    }} 
                  />
                )}
                <AttendanceList records={[]} />
              </div>
            } />
            <Route path="/reports" element={<ReportsSection />} />
            <Route path="/users" element={
              userForHeader.role === 'admin' ? <UserManagement /> : <Navigate to="/dashboard" />
            } />
            <Route path="/justifications" element={<JustificationManager />} />
            <Route path="/approvals" element={
              userForHeader.role === 'admin' ? <ApprovalManager /> : <Navigate to="/dashboard" />
            } />
            <Route path="/settings" element={
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración del Sistema
                </h3>
                <p className="text-gray-600">
                  Configuración de horarios, permisos y parámetros del sistema.
                </p>
              </div>
            } />
            
            {/* ✅ Ruta por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AppContent;