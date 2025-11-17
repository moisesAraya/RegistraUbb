import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const LOGO_FILENAME = 'logo_registraubb.png';
const LOGO_BUCKET = 'registraubb';

const LoginForm: React.FC = () => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Obtener logo desde MinIO
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/minio/logo-url?bucket=${LOGO_BUCKET}&filename=${LOGO_FILENAME}`
        );
        const json = await res.json();
        if (json.success && json.url) {
          setLogoUrl(json.url);
        } else {
          // Fallback: intento directo a MinIO
          const directUrl = `${
            import.meta.env.VITE_MINIO_ENDPOINT || 'http://localhost:9000'
          }/${LOGO_BUCKET}/${LOGO_FILENAME}`;
          console.log('🔄 Intentando acceso directo al logo:', directUrl);
          setLogoUrl(directUrl);
        }
      } catch (error) {
        console.error('❌ Error obteniendo logo:', error);
        const directUrl = `${
          import.meta.env.VITE_MINIO_ENDPOINT || 'http://localhost:9000'
        }/${LOGO_BUCKET}/${LOGO_FILENAME}`;
        console.log('🔄 Intentando acceso directo al logo (fallback):', directUrl);
        setLogoUrl(directUrl);
      }
    };
    fetchLogo();
  }, []);  // Función para formatear RUT mientras se escribe
  const formatRut = (value: string) => {
    // Eliminar todo lo que no sea número, k o K
    const cleaned = value.replace(/[^0-9kK]/g, '');
    
    // Si está vacío, retornar vacío
    if (!cleaned) return '';
    
    // Separar dígito verificador
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    // Si solo hay dígito verificador
    if (body.length === 0) return dv;
    
    // Formatear con puntos
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formattedBody = '.' + formattedBody;
      }
      formattedBody = body[i] + formattedBody;
    }
    
    return `${formattedBody}-${dv}`;
  };
  
  // **[AÑADIDO]** Función para quitar el formato (puntos y guion) del RUT antes de enviarlo
  const stripRutFormat = (formattedRut: string) => {
    return formattedRut.replace(/\./g, '').replace('-', '');
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatRut(value);
    setRut(formatted);
  };

  // Validar formato de RUT
  const validateRut = (rut: string) => {
    const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$|^\d{7,8}-[\dkK]$/;
    return rutPattern.test(rut);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rut || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (!validateRut(rut)) {
      setError('Por favor, ingresa un RUT válido (ej: 12.345.678-9)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const unformattedRut = stripRutFormat(rut.trim());      const loginData = {
        rut_usuario: unformattedRut, // Usar el RUT sin formato
        password: password.trim()
      };

      console.log('=== FRONTEND LOGIN DEBUG ===');
      console.log('URL:', `${API_BASE_URL}/auth/login`);
      console.log('Datos a enviar:', loginData);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP ${response.status}`);
        } catch (parseError) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const responseData = await response.json();

      if (responseData.success && responseData.data) {
        const { user, token } = responseData.data;
        
        if (!user || !token) {
          throw new Error('Datos de autenticación incompletos');
        }

        localStorage.setItem('token', token);        // ✅ VERIFICAR QUE SE GUARDÓ
        const savedToken = localStorage.getItem('token');
        if (!savedToken) {
          throw new Error('Error guardando el token');
        }
        console.log('✅ Token verificado en localStorage');
        
        // ✅ GUARDAR DATOS DEL USUARIO
        const userData = {
          rut_usuario: user.rut_usuario,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          id_rol: user.id_rol,
          id_cargo: user.id_cargo
        };
        
        localStorage.setItem('user', JSON.stringify(userData));

        setSuccess('Login exitoso. Redirigiendo...');
        
        if (login && typeof login === 'function') {
          login(userData, token);
        }
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        
      } else {
        setError(responseData.message || 'Error en el login');
      }

    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        setError('Error de conexión. Verifica que el servidor esté ejecutándose.');
      } else {
        setError(err.message || 'Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillExampleUser = (userRut: string, userPassword: string) => {
    setRut(userRut);
    setPassword(userPassword);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {/* Logo desde MinIO */}
          <div className="mx-auto mb-6 flex justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo RegistraUBB"
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  console.error('❌ Error cargando logo desde URL:', logoUrl);
                  // Fallback al ícono si el logo no carga
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            {/* Fallback: ícono si no hay logo */}
            <div 
              className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center" 
              style={{ display: logoUrl ? 'none' : 'flex' }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600">Accede a tu cuenta para continuar</p>
        </div>        <div className="bg-white rounded-2xl shadow-xl p-8">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
                RUT
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="rut"
                  type="text"
                  value={rut}
                  onChange={handleRutChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="12.345.678-9"
                  required
                  autoComplete="username"
                  maxLength={12}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Ingresa tu RUT con puntos y guión (ej: 12.345.678-9)
              </p>
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
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Universidad del Bío-Bío © 2025
          </p>
          </div>
      </div>
    </div>
  );
};

export default LoginForm;