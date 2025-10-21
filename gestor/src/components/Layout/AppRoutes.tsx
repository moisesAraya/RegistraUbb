import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from '../Dashboard/Dashboard';
import QRCodeManager from '../QRCode/QRCodeManager';
import AttendanceList from '../Attendance/AttendanceList';
import IDCardGenerator from '../ID/IDCardGenerator';
import Login from '../Auth/LoginForm';

// Nuevos componentes importados
import ReportsSection from '../Reports/ReportsSection';
import JustificationManager from '../Justifications/JustificationManager';
import UserManagement from '../Admin/UserManagement';
import ApprovalManager from '../Admin/ApprovalManager';
import AdminDashboard from '../Dashboard/AdminDashboard';
import ProfilePage from '../Profile/ProfilePage';
import HelpPage from '../Help/HelpPage';

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      
      case 'attendance':
        return <AttendanceList />;
      
      case 'qr-management':
        return <QRCodeManager />;
      
      case 'users':
        return <UserManagement />;
      
      case 'reports':
      case 'my-reports':
        return <ReportsSection />;
      
      case 'justifications':
        return <JustificationManager />;
      
      case 'approvals':
        return <ApprovalManager />;
      
      case 'staff-attendance':
        return <AttendanceList />;
      
      case 'id-card':
        return <IDCardGenerator />;
      
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h2>
            <p className="text-gray-600">Panel de configuración en desarrollo...</p>
          </div>
        );
      
      default:
        return <Dashboard />;
    }
  };

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
                <AttendanceList records={[]} />
              } />
              
              <Route path="/reports" element={
                <ReportsSection />
              } />
              
              <Route path="/justifications" element={
                <JustificationManager />
              } />
              
              {user.id_rol === 1 && (
                <>
                  <Route path="/users" element={
                    <UserManagement />
                  } />
                  
                  <Route path="/approvals" element={
                    <ApprovalManager />
                  } />
                  
                  <Route path="/settings" element={
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Configuración</h2>
                      <p className="text-slate-600">Sección de configuración en desarrollo...</p>
                    </div>
                  } />
                </>
              )}
              
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/reportes" element={<ReportsSection />} />
              <Route path="/ayuda" element={<HelpPage />} />
              
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