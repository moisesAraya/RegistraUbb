import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/Context/AuthContext';
import { AsistenciaProvider } from './context/AsistenciaContext';
import AppRoutes from './components/Layout/AppRoutes';

const App: React.FC = () => {
  console.log('🚀 App principal iniciando...');
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AsistenciaProvider>
          <AppRoutes />
        </AsistenciaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;