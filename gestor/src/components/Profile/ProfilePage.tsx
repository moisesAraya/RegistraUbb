import React, { useState, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import { Camera } from "lucide-react"; // Cambia Eye/EyeOff por Camera

// ✅ Mappings de roles y cargos
const rolesMap: Record<number, string> = {
  1: "Administrador",
  2: "Académico",
  3: "Desarrollador",
};

const cargosMap: Record<number, string> = {
  1: "Docente universitario",
  2: "Encargado",
  3: "Secretaria",
  4: "Encargado de software",
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.foto_url || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        No hay datos de usuario
      </div>
    );
  }

  const cargo = cargosMap[user.id_cargo] || "No registrado";
  const rol = rolesMap[user.id_rol] || "No registrado";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    const formData = new FormData();
    formData.append("foto", selectedFile);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile/upload/${user.rut_usuario}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setPreviewUrl(data.data.imageUrl);
        alert("✅ Foto actualizada correctamente");
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
    } finally {
      setLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-200 space-y-8">
      {/* FOTO DE PERFIL */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full border-4 border-blue-300 shadow-lg object-cover"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-5xl text-gray-400 font-bold">
              {user.nombres?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow transition"
            title="Cambiar foto"
          >
            <Camera className="w-5 h-5" /> {/* Ícono de cámara */}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className={`w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? "Subiendo..." : "Actualizar foto"}
        </button>
      </div>

      {/* DATOS DEL USUARIO */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{user.nombres} {user.apellidos}</h2>
        <p className="text-sm text-gray-500 mt-1">{rol} | {cargo}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 text-sm">
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">Correo</span>
          <span className="font-medium text-gray-800">{user.email || "No registrado"}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">RUT</span>
          <span className="font-medium text-gray-800">{user.rut_usuario}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">Cargo</span>
          <span className="font-medium text-gray-800">{cargo}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">Rol</span>
          <span className="font-medium text-gray-800">{rol}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
