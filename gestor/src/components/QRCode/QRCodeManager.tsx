import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Context/AuthContext';
import QRCode from 'qrcode';
import { 
  QrCode, 
  RefreshCw, 
  Trash2, 
  Download, 
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Shield,
  ShieldCheck,
  Sparkles,
  Unlock
} from 'lucide-react';

interface QRData {
  codigo_unico: string;
  hash_encriptado: string;
  activo: boolean;
  permanente: boolean;
  fecha_creacion: string;
  rut_usuario: string;
}

const QRCodeManager: React.FC = () => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrHistory, setQrHistory] = useState<QRData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRData, setShowQRData] = useState(false);
  const [isQRRevealed, setIsQRRevealed] = useState(false);
  const [revealAnimation, setRevealAnimation] = useState(false);

  // ✅ Función para obtener token
  const getAuthToken = () => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      console.log('💾 Usando token del localStorage');
      return localToken;
    }
    
    console.error('❌ No se encontró token');
    return null;
  };

  // ✅ Función para hacer requests API
  const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };
    
    console.log(`🌐 API Request: ${config.method || 'GET'} ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, config);
      console.log(`📥 API Response: ${response.status} ${endpoint}`);
      return response;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      throw error;
    }
  };

  // ✅ Generar imagen QR desde hash
  const generateQRImage = async (hash: string) => {
    try {
      console.log('🎨 Generando imagen QR...');
      
      const qrDataURL = await QRCode.toDataURL(hash, {
        width: 280,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrImage(qrDataURL);
      console.log('✅ Imagen QR generada');
      
    } catch (error) {
      console.error('Error generando imagen QR:', error);
      setError('Error generando la imagen del código QR');
    }
  };

  // ✅ Función de prueba
  const testApiConnection = async () => {
    try {
      console.log('🧪 Probando conectividad API...');
      
      const response = await makeApiRequest('/api/qr/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const testData = await response.json();
        console.log('✅ API conectada correctamente:', testData);
        return true;
      } else {
        console.log('❌ API no responde correctamente');
        return false;
      }
    } catch (error) {
      console.error('❌ Error conectando con API:', error);
      return false;
    }
  };

  // ✅ Cargar historial de QR codes y mostrar el activo
  const loadQRHistory = async () => {
    try {
      console.log('📜 Cargando historial de QR codes...');
      
      const authToken = getAuthToken();
      if (!authToken) {
        setError('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }
      
      const response = await makeApiRequest('/api/qr/my-qr-codes', {
        method: 'GET'
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Historial cargado:', result);
        
        const qrCodes = result.data?.qr_codes || [];
        setQrHistory(qrCodes);
        
        // ✅ Buscar QR activo y mostrarlo automáticamente
        const activeQR = qrCodes.find((qr: QRData) => qr.activo);
        if (activeQR) {
          console.log('🔍 QR activo encontrado:', activeQR.codigo_unico);
          setQrData(activeQR.hash_encriptado);
          await generateQRImage(activeQR.hash_encriptado);
          setIsQRRevealed(false);
        } else {
          console.log('ℹ️ No se encontró QR activo');
          setQrData(null);
          setQrImage(null);
          setIsQRRevealed(false);
        }
        
      } else {
        const responseText = await response.text();
        console.error('❌ Error response:', responseText.substring(0, 200));
        
        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          try {
            const errorData = JSON.parse(responseText);
            setError(errorData.message || 'Error cargando historial');
          } catch {
            setError(`Error del servidor (${response.status})`);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando historial QR:', error);
      setError(`Error de red: ${error.message}`);
    }
  };

  // ✅ Generar nuevo QR code
  const handleGenerateQR = async () => {
    if (!user?.rut_usuario) {
      setError('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Generando nuevo QR code...');
      
      const authToken = getAuthToken();
      if (!authToken) {
        setError('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }
      
      const response = await makeApiRequest('/api/qr/generate-my-qr', {
        method: 'GET'
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ QR generado correctamente:', result);
        
        const hash = result.data.qrData;
        setQrData(hash);
        setIsQRRevealed(true);
        
        await generateQRImage(hash);
        await loadQRHistory();
        
      } else {
        const responseText = await response.text();
        console.error('❌ Error response:', responseText.substring(0, 200));
        
        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          try {
            const errorData = JSON.parse(responseText);
            setError(errorData.message || 'Error generando código QR');
          } catch {
            setError(`Error del servidor (${response.status})`);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error de red: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función para revelar el QR con animación
  const handleRevealQR = () => {
    setRevealAnimation(true);
    
    setTimeout(() => {
      setIsQRRevealed(true);
    }, 200);
    
    setTimeout(() => {
      setRevealAnimation(false);
    }, 600);
  };

  // ✅ Invalidar QR codes
  const handleInvalidateQR = async () => {
    if (!confirm('¿Está seguro de que desea invalidar sus códigos QR activos?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await makeApiRequest('/api/qr/invalidate-my-qr', {
        method: 'DELETE'
      });

      if (response.ok) {
        setQrData(null);
        setQrImage(null);
        setIsQRRevealed(false);
        await loadQRHistory();
        console.log('✅ QR codes invalidados');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error invalidando códigos QR');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Descargar QR como imagen
  const handleDownloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement('a');
    link.download = `qr-code-${user?.rut_usuario}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ Copiar hash al portapapeles
  const handleCopyHash = async () => {
    if (!qrData) return;
    
    try {
      await navigator.clipboard.writeText(qrData);
      console.log('✅ Hash copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando hash:', error);
    }
  };

  // ✅ Cargar historial al montar el componente
  useEffect(() => {
    console.log('🔍 Iniciando QRCodeManager...');
    testApiConnection().then((connected) => {
      if (connected) {
        const authToken = getAuthToken();
        if (authToken) {
          loadQRHistory();
        }
      }
    });
  }, []);

  // ✅ Verificar autenticación
  if (!getAuthToken()) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-amber-600 text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold text-amber-800 mb-2">
            Sesión no válida
          </h2>
          <p className="text-amber-700 text-sm mb-4">
            No se encontró token de autenticación válido. Por favor, inicie sesión nuevamente.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header profesional */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Gestión de Código QR</h1>
              <p className="text-slate-600 text-sm">
                Genere y gestione su código QR personal para registro de asistencia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert profesional */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* QR Code Display profesional */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Código QR Actual</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleGenerateQR}
              disabled={loading}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${loading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-700 hover:bg-slate-800 text-white'
                }
              `}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Generando...' : 'Generar Nuevo'}</span>
            </button>
            
            {qrData && (
              <button
                onClick={handleInvalidateQR}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Trash2 className="h-4 w-4" />
                <span>Invalidar</span>
              </button>
            )}
          </div>
        </div>

        {qrImage ? (
          <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-6 lg:space-y-0">
            {/* ✅ QR Image profesional con efecto blur */}
            <div className="lg:w-1/2">
              <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 text-center overflow-hidden border border-slate-200">
                
                {/* ✅ Efectos de fondo más sutiles */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-slate-200 rounded-full opacity-20"></div>
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
                </div>

                {/* ✅ QR Image con blur condicional */}
                <div className="relative z-10">
                  <img 
                    src={qrImage} 
                    alt="Código QR" 
                    className={`
                      mx-auto mb-4 border-2 border-slate-200 shadow-lg rounded-xl transition-all duration-500 transform
                      ${!isQRRevealed ? 'blur-sm scale-95 opacity-70' : 'blur-0 scale-100 opacity-100'}
                      ${revealAnimation ? 'animate-pulse' : ''}
                    `}
                  />

                  {/* ✅ Overlay profesional cuando está borroso */}
                  {!isQRRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-slate-200 transform transition-all duration-300 hover:scale-105">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 mb-2">
                            Código QR Protegido
                          </h3>
                          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            Haga clic para mostrar su código QR
                          </p>
                          <button
                            onClick={handleRevealQR}
                            className="group bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
                          >
                            <Unlock className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                            <span>Mostrar QR</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ Botones de acción profesionales */}
                {isQRRevealed && (
                  <div className="relative z-10">
                    <p className="text-sm text-slate-600 mb-4 font-medium">
                      Escanee este código con el tótem para registrar su asistencia
                    </p>
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={handleDownloadQR}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all duration-200"
                      >
                        <Download className="h-3 w-3" />
                        <span>Descargar</span>
                      </button>
                      <button
                        onClick={handleCopyHash}
                        className="flex items-center space-x-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-all duration-200"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copiar</span>
                      </button>
                      <button
                        onClick={() => setIsQRRevealed(false)}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all duration-200"
                      >
                        <EyeOff className="h-3 w-3" />
                        <span>Ocultar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Info profesional */}
            <div className="lg:w-1/2">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-600 rounded-full p-2">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">QR Activo</h3>
                      <p className="text-sm text-blue-800 mt-1">
                        Su código QR está activo y listo para usar
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Hash del QR:</span>
                    <button
                      onClick={() => setShowQRData(!showQRData)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      {showQRData ? (
                        <><EyeOff className="h-3 w-3 inline mr-1" />Ocultar</>
                      ) : (
                        <><Eye className="h-3 w-3 inline mr-1" />Mostrar</>
                      )}
                    </button>
                  </div>
                  
                  {showQRData && (
                    <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                      <code className="text-xs text-slate-700 break-all font-mono">
                        {qrData}
                      </code>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Válido indefinidamente</p>
                      <p className="text-xs text-slate-600">Hasta que lo invalide manualmente</p>
                    </div>
                  </div>
                </div>

                {/* ✅ Indicador de estado profesional */}
                <div className={`
                  border rounded-xl p-4 transition-all duration-300
                  ${isQRRevealed 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-slate-50 border-slate-200'
                  }
                `}>
                  <div className="flex items-center space-x-3">
                    {isQRRevealed ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">QR Visible</p>
                          <p className="text-xs text-amber-700">El código está siendo mostrado</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">QR Protegido</p>
                          <p className="text-xs text-slate-600">El código está oculto por seguridad</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative">
              <QrCode className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-slate-200 border-dashed rounded-lg"></div>
              </div>
            </div>
            <h3 className="text-base font-medium text-slate-900 mb-2">
              No tiene un código QR activo
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Genere un nuevo código QR para poder registrar su asistencia
            </p>
          </div>
        )}
      </div>

      {/* QR History profesional */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Historial de Códigos QR</h2>
          <button
            onClick={loadQRHistory}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-3 w-3 inline mr-1" />
            Actualizar
          </button>
        </div>

        {qrHistory.length > 0 ? (
          <div className="space-y-3">
            {qrHistory.map((qr, index) => (
              <div
                key={qr.codigo_unico}
                className={`
                  flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                  ${qr.activo 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                    : 'bg-slate-50 border-slate-200'
                  }
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${qr.activo ? 'bg-blue-600' : 'bg-slate-400'}
                  `}>
                    {qr.activo ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <XCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 flex items-center space-x-2 text-sm">
                      <span>{qr.activo ? 'Código QR Activo' : 'Código QR Inactivo'}</span>
                      {qr.activo && (
                        <span className="bg-blue-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600">
                      Creado: {new Date(qr.fecha_creacion).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${qr.activo 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }
                  `}>
                    {qr.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">No hay códigos QR en el historial</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeManager;