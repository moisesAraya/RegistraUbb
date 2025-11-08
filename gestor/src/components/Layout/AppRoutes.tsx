import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from '../Dashboard/Dashboard';
import QRCodeManager from '../QRCode/QRCodeManager';
import AttendanceList from '../Attendance/AttendanceList';
import ManualAttendanceButton from '../Attendance/ManualAttendanceButton';
import IDCardGenerator from '../ID/IDCardGenerator';
import Login from '../Auth/LoginForm';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  console.log('🚀 AppRoutes renderizando...');
  console.log('👤 Usuario:', user);
  console.log('🔐 Autenticado:', isAuthenticated);
  console.log('⏳ Cargando:', authLoading);

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
    return <Login />;
  }

  const userForHeader = {
    nombres: user.nombres,
    apellidos: user.apellidos,
    rut_usuario: user.rut_usuario,
    id_rol: user.id_rol,
    email: user.email || `${user.rut_usuario}@ubiobio.cl`
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={userForHeader} 
          onLogout={logout} 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              
              <Route path="/qr" element={
                <QRCodeManager 
                  userName={`${user.nombres || ''} ${user.apellidos || ''}`.trim()}
                  userRut={user.rut_usuario}
                />
              } />
              
              <Route path="/id-card" element={
                <IDCardGenerator 
                  user={userForHeader}
                  qrData={`${window.location.origin}/attendance/checkin/${user.rut_usuario}`}
                />
              } />
              
              <Route path="/attendance" element={
                <div className="space-y-6">
                  {user.id_rol === 2 && (
                    <ManualAttendanceButton 
                      onSubmit={async (data) => {
                        console.log('📝 Registro manual enviado:', data);
                        return { success: true };
                      }} 
                    />
                  )}
                  <AttendanceList records={[]} />
                </div>
              } />
              
              <Route path="/reports" element={
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Reportes</h2>
                  <p className="text-slate-600">Sección de reportes en desarrollo...</p>
                </div>
              } />
              
              {user.id_rol === 1 && (
                <>
                  <Route path="/users" element={
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Gestión de Usuarios</h2>
                      <p className="text-slate-600">Sección de usuarios en desarrollo...</p>
                    </div>
                  } />
                  
                  <Route path="/settings" element={
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Configuración</h2>
                      <p className="text-slate-600">Sección de configuración en desarrollo...</p>
                    </div>
                  } />
                </>
              )}
              
              <Route path="/justifications" element={
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Justificaciones</h2>
                  <p className="text-slate-600">Sección de justificaciones en desarrollo...</p>
                </div>
              } />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppRoutes;