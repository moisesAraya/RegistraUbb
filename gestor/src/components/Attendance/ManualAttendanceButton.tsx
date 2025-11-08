import React, { useState } from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import ManualAttendanceModal from './ManualAttendanceModal';

interface ManualAttendanceButtonProps {
  onSubmit: (data: {
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    activityType: string;
    location?: string;
    notes?: string;
    justificationReason: string;
  }) => Promise<{ success: boolean }>;
}

const ManualAttendanceButton: React.FC<ManualAttendanceButtonProps> = ({ onSubmit }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    console.log('🔵 Abriendo modal de registro manual'); // Debug
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('🔴 Cerrando modal de registro manual'); // Debug
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: any) => {
    console.log('📝 Datos del formulario modal:', data); // Debug
    return await onSubmit(data);
  };

  return (
    <>
      {/* Tarjeta compacta con botón */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 text-sm">¿No puede usar el QR?</h4>
              <p className="text-amber-700 text-xs leading-relaxed">
                Solicite un registro manual excepcional
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <FileText className="w-4 h-4" />
            <span>Solicitar</span>
          </button>
        </div>
        
        <div className="mt-3 text-xs text-amber-800 bg-amber-100 rounded-lg p-2">
          <strong>Nota:</strong> Solo para casos excepcionales. 
        </div>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-slate-500">
          Estado del modal: {isModalOpen ? 'ABIERTO' : 'CERRADO'}
        </div>
      )}

      {/* Modal */}
      <ManualAttendanceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default ManualAttendanceButton;