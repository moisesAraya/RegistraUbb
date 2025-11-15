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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: any) => {
    return await onSubmit(data);
  };

  return (
    <>
      {/* Banner de registro manual - Optimizado para header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all w-full">
        <div className="flex items-center justify-between gap-6">
          {/* Contenido izquierdo */}
          <div className="flex items-center gap-4 flex-1">
            {/* Icono */}
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            
            {/* Texto */}
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 text-sm leading-tight">
                ¿Problemas con el lector QR?
              </h4>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                Registre su asistencia manualmente.
              </p>
            </div>
          </div>
          
          {/* Botón de acción */}
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex-shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Registrar ahora</span>
          </button>
        </div>
      </div>


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