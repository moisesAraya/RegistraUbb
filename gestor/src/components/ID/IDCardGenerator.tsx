import React, { useRef, useEffect, useState } from 'react';
import { Download, CreditCard, User, Eye, RefreshCw, Palette, AlertCircle, Loader } from 'lucide-react';
import QRCode from 'qrcode';

interface User {
  nombres?: string;
  apellidos?: string;
  rut_usuario: string;
  id_rol: number;
  email?: string;
}

interface IDCardGeneratorProps {
  user: User;
  qrData?: string; // ✅ Ahora es opcional porque lo obtendremos de la API
}

interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface QRData {
  codigo_unico: string;
  hash_encriptado: string;
  activo: boolean;
  permanente: boolean;
  fecha_creacion: string;
  rut_usuario: string;
}

const IDCardGenerator: React.FC<IDCardGeneratorProps> = ({ user }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('classic');
  
  // ✅ Estados para manejar el QR desde la base de datos
  const [realQRData, setRealQRData] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);

  // 🎨 Temas de colores disponibles
  const colorThemes: Record<string, ColorTheme> = {
    classic: {
      name: 'Clásico UBB',
      primary: '#1E40AF',
      secondary: '#3B82F6',
      accent: '#2563EB',
      background: '#EFF6FF'
    },
    modern: {
      name: 'Moderno',
      primary: '#0F172A',
      secondary: '#334155',
      accent: '#64748B',
      background: '#F1F5F9'
    },
    green: {
      name: 'Verde Institucional',
      primary: '#059669',
      secondary: '#10B981',
      accent: '#047857',
      background: '#ECFDF5'
    },
    purple: {
      name: 'Púrpura',
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      accent: '#6D28D9',
      background: '#F3E8FF'
    },
    red: {
      name: 'Rojo Académico',
      primary: '#DC2626',
      secondary: '#EF4444',
      accent: '#B91C1C',
      background: '#FEF2F2'
    },
    orange: {
      name: 'Naranja Energético',
      primary: '#EA580C',
      secondary: '#F97316',
      accent: '#C2410C',
      background: '#FFF7ED'
    }
  };

  // ✅ Función para hacer requests API (igual que en QRCodeManager)
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

  // ✅ Cargar QR activo desde la base de datos
  const loadActiveQR = async () => {
    setLoadingQR(true);
    setQrError(null);
    
    try {
      console.log('🔍 Cargando QR activo desde la base de datos...');
      
      const response = await makeApiRequest('/api/qr/my-qr-codes', {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ QR codes obtenidos:', result);
        
        const qrCodes = result.data?.qr_codes || [];
        
        // ✅ Buscar QR activo
        const activeQR = qrCodes.find((qr: QRData) => qr.activo);
        
        if (activeQR) {
          console.log('🎯 QR activo encontrado:', activeQR.codigo_unico);
          setRealQRData(activeQR.hash_encriptado);
          setQrError(null);
        } else {
          console.log('⚠️ No se encontró QR activo');
          setRealQRData(null);
          setQrError('No tiene un código QR activo. Genere uno desde "Mi Código QR".');
        }
        
      } else {
        const responseText = await response.text();
        console.error('❌ Error response:', responseText.substring(0, 200));
        
        if (response.status === 401) {
          setQrError('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          setQrError('Error cargando código QR desde el servidor.');
        }
      }
    } catch (error) {
      console.error('Error cargando QR activo:', error);
      setQrError(`Error de conexión: ${error.message}`);
    } finally {
      setLoadingQR(false);
    }
  };

  const getRoleInfo = (id_rol: number) => {
    const roles = {
      1: { name: 'Administrador', color: '#DC2626', bgColor: '#FEF2F2' },
      2: { name: 'Académico', color: '#2563EB', bgColor: '#EFF6FF' },
      3: { name: 'Usuario', color: '#059669', bgColor: '#ECFDF5' }
    };
    return roles[id_rol as keyof typeof roles] || roles[3];
  };

  const generateCard = async () => {
    // ✅ No generar si no hay QR válido
    if (!realQRData) {
      console.log('⏸️ No se puede generar tarjeta: no hay QR activo');
      return;
    }

    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Configuración del canvas (tamaño tarjeta ID estándar 3.375" x 2.125" a 300 DPI)
      canvas.width = 1012;
      canvas.height = 638;

      const theme = colorThemes[selectedTheme];
      const roleInfo = getRoleInfo(user.id_rol);
      const nombreCompleto = `${user.nombres || ''} ${user.apellidos || ''}`.trim();

      // ✅ Fondo principal con gradiente usando el tema seleccionado
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.3, theme.background);
      gradient.addColorStop(1, '#F1F5F9');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Borde exterior
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // ✅ Header con colores del tema
      const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 120);
      headerGradient.addColorStop(0, theme.primary);
      headerGradient.addColorStop(1, theme.secondary);
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, canvas.width, 120);

      // Logo UBB
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('UBB', 30, 45);
      
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText('Universidad del Bío-Bío', 30, 70);
      ctx.fillText('RegistraUBB', 30, 95);

      // Título "TARJETA DE IDENTIFICACIÓN"
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('TARJETA DE IDENTIFICACIÓN', canvas.width - 30, 60);

      // ✅ Área de foto con colores del tema
      const photoX = 50;
      const photoY = 150;
      const photoSize = 180;

      // Fondo de la foto
      ctx.fillStyle = theme.background;
      ctx.fillRect(photoX, photoY, photoSize, photoSize);

      // Borde de la foto
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(photoX, photoY, photoSize, photoSize);

      // Icono de usuario (placeholder)
      ctx.fillStyle = theme.primary;
      ctx.font = 'bold 80px Arial, sans-serif';
      ctx.textAlign = 'center';
      const initials = `${user.nombres?.charAt(0) || ''}${user.apellidos?.charAt(0) || ''}`.toUpperCase() || 'U';
      ctx.fillText(initials, photoX + photoSize/2, photoY + photoSize/2 + 20);

      // Información del usuario
      const infoX = photoX + photoSize + 40;
      const infoStartY = 180;

      // Nombre
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(nombreCompleto.toUpperCase(), infoX, infoStartY);

      // RUT
      ctx.fillStyle = '#4B5563';
      ctx.font = '24px Arial, sans-serif';
      ctx.fillText(`RUT: ${user.rut_usuario}`, infoX, infoStartY + 45);

      // ✅ Rol con colores del tema
      const roleY = infoStartY + 90;
      const roleWidth = ctx.measureText(roleInfo.name).width + 40;
      
      ctx.fillStyle = theme.accent;
      ctx.fillRect(infoX, roleY - 25, roleWidth, 40);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(roleInfo.name, infoX + 20, roleY);

      // ✅ QR Code REAL desde la base de datos
      try {
        console.log('🎨 Generando QR con hash real:', realQRData.substring(0, 20) + '...');
        
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, realQRData, {
          width: 200,
          margin: 1,
          color: {
            dark: theme.primary,
            light: '#FFFFFF'
          }
        });

        const qrSize = 270;
        const qrX = canvas.width - qrSize - 50;
        const qrY = photoY + 90;
        
        // Fondo blanco para el QR
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
        
        // Borde del QR
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 3;
        ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
        
        // Dibujar el QR real
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        // Etiqueta del QR
        ctx.fillStyle = '#6B7280';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Código QR Activo', qrX + qrSize/2, qrY + qrSize + 35);
        
      } catch (error) {
        console.error('Error generando QR real:', error);
        
        // Fallback si falla el QR
        const qrSize = 200;
        const qrX = canvas.width - qrSize - 30;
        const qrY = photoY + 50;
        
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error generando QR', qrX + qrSize/2, qrY + qrSize/2);
      }

      // ✅ Footer con colores del tema
      const footerY = canvas.height - 80;
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, footerY, canvas.width, 80);
      
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, footerY, canvas.width, 80);

      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Esta tarjeta es válida únicamente para el sistema RegistraUBB', 30, footerY + 25);
      ctx.fillText('Generada el: ' + new Date().toLocaleDateString('es-CL'), 30, footerY + 45);
      
      ctx.textAlign = 'right';
      ctx.fillText('Universidad del Bío-Bío - Campus Concepción', canvas.width - 30, footerY + 25);
      ctx.fillText('registraubb.ubiobio.cl', canvas.width - 30, footerY + 45);

      setCardGenerated(true);
      console.log('✅ Tarjeta generada con QR real de la base de datos');
      
    } catch (error) {
      console.error('Error generando la tarjeta:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `tarjeta-${user.rut_usuario}-${selectedTheme}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // ✅ Cargar QR real al montar el componente
  useEffect(() => {
    loadActiveQR();
  }, []);

  // ✅ Regenerar tarjeta cuando cambie el QR o el tema
  useEffect(() => {
    if (realQRData) {
      generateCard();
    }
  }, [realQRData, selectedTheme, user]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Generador de Tarjeta ID</h3>
          <p className="text-sm text-slate-600">Cree y descargue su tarjeta de identificación con QR real</p>
        </div>
      </div>

      {/* ✅ Estado de carga del QR */}
      {loadingQR && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">Cargando código QR</p>
              <p className="text-xs text-blue-700">Obteniendo su QR activo desde la base de datos...</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Error del QR */}
      {qrError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Error con el código QR</p>
              <p className="text-xs text-red-700 mt-1">{qrError}</p>
              <button
                onClick={loadActiveQR}
                className="mt-2 text-xs text-red-800 hover:text-red-900 font-medium underline"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Información del QR activo */}
      {realQRData && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-green-900">QR activo detectado</p>
              <p className="text-xs text-green-700">
                Usando código QR real desde la base de datos (Hash: {realQRData.substring(0, 16)}...)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Selector de temas de colores */}
      <div className="mb-6">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Personalizar colores
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(colorThemes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => setSelectedTheme(key)}
              disabled={!realQRData}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${selectedTheme === key 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
                ${!realQRData ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: theme.primary }}
                ></div>
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: theme.secondary }}
                ></div>
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: theme.accent }}
                ></div>
              </div>
              <span className="text-sm font-medium text-slate-700">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Información del usuario */}
      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
          <User className="w-4 h-4 mr-2" />
          Información de la tarjeta
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Nombre:</span>
            <span className="ml-2 font-medium text-slate-900">
              {`${user.nombres || ''} ${user.apellidos || ''}`.trim()}
            </span>
          </div>
          <div>
            <span className="text-slate-500">RUT:</span>
            <span className="ml-2 font-medium text-slate-900">{user.rut_usuario}</span>
          </div>
          <div>
            <span className="text-slate-500">Rol:</span>
            <span className="ml-2 font-medium text-slate-900">
              {getRoleInfo(user.id_rol).name}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Tema:</span>
            <span className="ml-2 font-medium text-slate-900">
              {colorThemes[selectedTheme].name}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Vista previa del canvas */}
      {realQRData ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Vista previa
            </h4>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {previewMode ? 'Vista normal' : 'Vista ampliada'}
            </button>
          </div>
          
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 overflow-auto">
            <canvas
              ref={canvasRef}
              className={`
                border border-slate-300 rounded-lg shadow-md bg-white mx-auto block
                ${previewMode ? 'max-w-full h-auto' : 'max-w-md h-auto'}
              `}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6 text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base font-medium text-slate-900 mb-2">
            No se puede generar la tarjeta
          </h3>
          <p className="text-slate-600 text-sm">
            Necesita un código QR activo para generar su tarjeta de identificación
          </p>
        </div>
      )}

      {/* ✅ Acciones */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={generateCard}
          disabled={isGenerating || !realQRData}
          className={`
            flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
            ${isGenerating || !realQRData
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-800 text-white shadow-md hover:shadow-lg'
            }
          `}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-transparent"></div>
              <span>Generando...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Regenerar Tarjeta</span>
            </>
          )}
        </button>

        <button
          onClick={downloadCard}
          disabled={!cardGenerated || isGenerating || !realQRData}
          className={`
            flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
            ${!cardGenerated || isGenerating || !realQRData
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }
          `}
        >
          <Download className="w-4 h-4" />
          <span>Descargar Tarjeta</span>
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-semibold text-blue-900 mb-2">Características de la tarjeta:</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Tamaño estándar de tarjeta de identificación (86mm x 54mm)</li>
          <li>• 6 temas de colores disponibles</li>
          <li>• Descarga en alta resolución (PNG)</li>
          <li>• Lista para imprimir en tarjetas PVC</li>
        </ul>
      </div>
    </div>
  );
};

export default IDCardGenerator;