import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { login } = useAuth();

  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, ingresa un email válido');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const loginData = {
        email: email.trim(),
        password: password.trim()
      };

      console.log('=== FRONTEND LOGIN DEBUG ===');
      console.log('URL:', `${API_BASE_URL}/auth/login`);
      console.log('Datos:', loginData);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(loginData),
      });

      console.log('Status:', response.status);
      console.log('Headers:', [...response.headers.entries()]);

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('Parsed data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      if (responseData.success) {
        const { data } = responseData;
        
        if (!data?.user || !data?.token) {
          throw new Error('Datos de respuesta incompletos');
        }

        console.log('Login exitoso:', data.user);
        setSuccess('Login exitoso. Redirigiendo...');
        login(data.user, data.token);
      } else {
        setError(responseData.message || 'Error en el login');
      }

    } catch (err: any) {
      console.error('=== ERROR FRONTEND ===');
      console.error('Error:', err);
      
      if (err.message.includes('Failed to fetch')) {
        setError('Error de conexión. Verifica que el servidor esté ejecutándose en http://localhost:3000');
      } else if (err.message.includes('CORS')) {
        setError('Error de CORS. Contacta al administrador.');
      } else {
        setError(err.message || 'Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillExampleUser = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RegistraUbb</h1>
          <p className="text-gray-600">Accede a tu cuenta para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Debug info */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <strong>Debug:</strong><br />
            API: {API_BASE_URL}<br />
            Email: "{email}"<br />
            Pass Length: {password.length}
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800 break-words">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Usuarios de ejemplo */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Usuarios de prueba:</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillExampleUser('saraya@ubiobio.cl', '99952')}
                className="w-full text-left p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-blue-600">Administrador</div>
                <div className="text-gray-500">saraya@ubiobio.cl / 99952</div>
              </button>
              <button
                type="button"
                onClick={() => fillExampleUser('tgutierr@ubiobio.cl', '123456')}
                className="w-full text-left p-2 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-green-600">Profesor</div>
                <div className="text-gray-500">tgutierr@ubiobio.cl / 123456</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="tu.email@ubb.cl"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Tu contraseña"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Problemas para acceder?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                Contacta al administrador
              </a>
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Universidad del Bío-Bío © 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;