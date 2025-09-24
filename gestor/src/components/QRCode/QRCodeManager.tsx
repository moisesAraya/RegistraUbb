import React, { useState, useEffect } from 'react';
import { QrCode, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react';

interface QRCodeData {
  id: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  usageCount: number;
}

const QRCodeManager: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCode, setShowCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = () => {
    // Mock data - en producción vendría de la API
    const mockQRCodes: QRCodeData[] = [
      {
        id: '1',
        code: 'QR-2024-001-ABC123',
        isActive: true,
        createdAt: new Date(2024, 0, 15),
        expiresAt: new Date(2024, 2, 15), // 2 meses después
        usageCount: 45
      },
      {
        id: '2',
        code: 'QR-2023-012-XYZ789',
        isActive: false,
        createdAt: new Date(2023, 11, 1),
        expiresAt: new Date(2024, 1, 1),
        usageCount: 120
      }
    ];
    setQrCodes(mockQRCodes);
  };

  const generateNewQRCode = async () => {
    setIsGenerating(true);
    
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Desactivar código actual
      setQrCodes(prev => prev.map(qr => ({ ...qr, isActive: false })));
      
      // Generar nuevo código
      const newQRCode: QRCodeData = {
        id: Date.now().toString(),
        code: `QR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
        usageCount: 0
      };
      
      setQrCodes(prev => [newQRCode, ...prev]);
    } catch (error) {
      console.error('Error generando código QR:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const deactivateQRCode = async (id: string) => {
    setQrCodes(prev => 
      prev.map(qr => 
        qr.id === id ? { ...qr, isActive: false } : qr
      )
    );
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(code);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const downloadQRCode = (code: string) => {
    // Simular descarga del código QR
    console.log('Descargando código QR:', code);
    // En producción, esto generaría y descargaría la imagen del QR
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isExpired = (date: Date) => {
    return new Date() > date;
  };

  const activeQRCode = qrCodes.find(qr => qr.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <QrCode className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Gestión de Códigos QR
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          Genera y administra tus códigos QR para el registro de asistencia. 
          Solo puede haber un código activo a la vez.
        </p>

        {/* Código activo */}
        {activeQRCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900 mb-1">Código QR Activo</h4>
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono text-green-800 bg-green-100 px-2 py-1 rounded">
                    {showCode === activeQRCode.id ? activeQRCode.code : '••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowCode(showCode === activeQRCode.id ? null : activeQRCode.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    {showCode === activeQRCode.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(activeQRCode.code)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Expira: {formatDate(activeQRCode.expiresAt)} | 
                  Usos: {activeQRCode.usageCount}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadQRCode(activeQRCode.code)}
                  className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generar nuevo código */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Generar Nuevo Código QR</h4>
            <p className="text-sm text-gray-600">
              {activeQRCode 
                ? 'Al generar un nuevo código, el actual se desactivará automáticamente.'
                : 'No tienes ningún código QR activo. Genera uno para comenzar.'
              }
            </p>
          </div>
          <button
            onClick={generateNewQRCode}
            disabled={isGenerating}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generando...' : 'Generar Código QR'}</span>
          </button>
        </div>
      </div>

      {/* Historial de códigos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Códigos QR
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {qrCodes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay códigos QR generados.
            </div>
          ) : (
            qrCodes.map((qrCode) => (
              <div key={qrCode.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                          {showCode === qrCode.id ? qrCode.code : '••••••••••••'}
                        </code>
                        <button
                          onClick={() => setShowCode(showCode === qrCode.id ? null : qrCode.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showCode === qrCode.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(qrCode.code)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                          {copySuccess === qrCode.code && (
                            <span className="ml-1 text-xs text-green-600">¡Copiado!</span>
                          )}
                        </button>
                      </div>
                      
                      {qrCode.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Inactivo
                        </span>
                      )}
                      
                      {isExpired(qrCode.expiresAt) && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Expirado
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span>Creado: {formatDate(qrCode.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>Expira: {formatDate(qrCode.expiresAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>Usos: {qrCode.usageCount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadQRCode(qrCode.code)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Descargar QR"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    {qrCode.isActive && (
                      <button
                        onClick={() => deactivateQRCode(qrCode.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Desactivar"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Información Importante</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Solo puede haber un código QR activo a la vez</li>
              <li>• Los códigos QR expiran automáticamente después de 60 días</li>
              <li>• Al generar un nuevo código, el anterior se desactiva automáticamente</li>
              <li>• Puedes descargar la imagen del código QR para imprimirlo</li>
              <li>• El código QR debe ser escaneado en el lector externo para registrar asistencia</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeManager;