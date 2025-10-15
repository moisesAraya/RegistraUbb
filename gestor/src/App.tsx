import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/Context/AuthContext';
import AppRoutes from './components/Layout/AppRoutes';

const App: React.FC = () => {
  console.log('🚀 App principal iniciando...');
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;