import React, { useState, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import { Camera, Lock, Eye, EyeOff, X } from "lucide-react";

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

  // Estados para cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Por favor, completa todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (newPassword.length < 5) {
      setPasswordError("La nueva contraseña debe tener al menos 5 caracteres");
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          rut_usuario: user.rut_usuario,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPasswordSuccess("✅ Contraseña actualizada correctamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(null);
        }, 2000);
      } else {
        setPasswordError(data.message || "Error al cambiar la contraseña");
      }
    } catch (error) {
      setPasswordError("Error de conexión. Intenta nuevamente.");
    } finally {
      setPasswordLoading(false);
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

      {/* BOTÓN CAMBIAR CONTRASEÑA */}
      <div className="mt-6">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-semibold shadow transition"
        >
          <Lock className="w-5 h-5" />
          Cambiar contraseña
        </button>
      </div>

      {/* MODAL CAMBIAR CONTRASEÑA */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordError(null);
                setPasswordSuccess(null);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">Cambiar contraseña</h3>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-4">
              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Ingresa tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? "Cambiando..." : "Cambiar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
