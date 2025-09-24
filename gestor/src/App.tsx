import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAttendance } from './hooks/useAttendance';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import AttendanceForm from './components/Attendance/AttendanceForm';
import AttendanceList from './components/Attendance/AttendanceList';
import ManualAttendanceForm from './components/Attendance/ManualAttendanceForm';
import ReportsSection from './components/Reports/ReportsSection';
import QRCodeManager from './components/QRCode/QRCodeManager';
import JustificationManager from './components/Justifications/JustificationManager';
import UserManagement from './components/Admin/UserManagement';
import ApprovalManager from './components/Admin/ApprovalManager';

function App() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { attendanceRecords, dashboardStats, loading: attendanceLoading, checkIn } = useAttendance();
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

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} stats={dashboardStats} />;
      
      case 'attendance':
        return (
          <div className="space-y-6">
            {user.role === 'academic' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Registro Manual de Asistencia</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Use esta opción solo cuando no pueda registrar su asistencia con el código QR.
                  Requiere justificación y aprobación del director.
                </p>
                <ManualAttendanceForm onSubmit={async (data) => {
                  console.log('Registro manual:', data);
                  return { success: true };
                }} />
              </div>
            )}
            <AttendanceList records={attendanceRecords} />
          </div>
        );
      
      case 'reports':
      case 'my-reports':
        return <ReportsSection />;
      
      case 'qr-codes':
        return <QRCodeManager />;
      
      case 'staff-attendance':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Asistencia del Personal
              </h3>
              <p className="text-gray-600 mb-4">
                Vista consolidada de la asistencia de todos los académicos del departamento.
              </p>
            </div>
            <AttendanceList records={attendanceRecords} showUserName={true} />
          </div>
        );
      
      case 'users':
        return (
          <UserManagement />
        );
      
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configuración del Sistema
            </h3>
            <p className="text-gray-600">
              Configuración de horarios, permisos y parámetros del sistema.
            </p>
          </div>
        );
      
      case 'justifications':
        return (
          <JustificationManager />
        );
      
      case 'approvals':
        return (
          <ApprovalManager />
        );
      
      default:
        return <Dashboard user={user} stats={dashboardStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLogout={logout} 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="flex">
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
        <main className="flex-1 p-4 lg:p-6 lg:ml-0">
          {attendanceLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}

export default App;