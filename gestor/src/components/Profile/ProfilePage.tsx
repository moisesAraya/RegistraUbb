import React, { useState, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import { Camera, Lock, Eye, EyeOff, X, Key } from "lucide-react";
import { UserAvatar } from "../Common/UserAvatar";
import { useProfileImage } from "../../hooks/useProfileImage";

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

  // ---------------- FOTO PERFIL ----------------
  const { imageUrl, loading: imageLoading, refreshImage } = useProfileImage(
    user?.rut_usuario
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // previewUrl solo para previsualizar la imagen local recién elegida
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImage = previewUrl || imageUrl;

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
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/profile/upload/${user.rut_usuario}`,
        {
          method: "POST",
          body: formData,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.success) {
        // Recargar imagen desde el hook (usa URL segura /minio/... y maneja https)
        await refreshImage();
        // dejamos de usar la URL local, ahora mostrará la real desde MinIO/backend
        setPreviewUrl(null);
        alert("✅ Foto actualizada correctamente");
      } else {
        alert("❌ " + (data.message || "Error al subir la imagen"));
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      alert("❌ Error al subir la imagen");
    } finally {
      setLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---------------- CAMBIO DE CONTRASEÑA ----------------
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rut_usuario: user.rut_usuario,
          currentPassword,
          newPassword,
        }),
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

  // ---------------- CAMBIO DE PIN ----------------
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const handlePinChange = async () => {
    setPinError(null);
    setPinSuccess(null);

    if (!currentPin || !newPin || !confirmPin) {
      setPinError("Por favor, completa todos los campos");
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setPinError("El nuevo PIN debe ser un número de 4 dígitos");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("Los PIN nuevos no coinciden");
      return;
    }

    if (currentPin === newPin) {
      setPinError("El nuevo PIN no puede ser igual al actual");
      return;
    }

    setPinLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/profile/change-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rut_usuario: user.rut_usuario,
          currentPin,
          newPin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPinSuccess("✅ PIN actualizado correctamente");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setTimeout(() => {
          setShowPinModal(false);
          setPinSuccess(null);
        }, 2000);
      } else {
        setPinError(data.message || "Error al cambiar el PIN");
      }
    } catch (error) {
      console.error("Error cambiando PIN:", error);
      setPinError("Error de conexión. Intenta nuevamente.");
    } finally {
      setPinLoading(false);
    }
  };

  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const resetPinModal = () => {
    setShowPinModal(false);
    setPinError(null);
    setPinSuccess(null);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-200 space-y-8">
      {/* FOTO DE PERFIL */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          {imageLoading ? (
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-blue-300 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentImage ? (
            <img
              src={currentImage}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full border-4 border-blue-300 shadow-lg object-cover"
              onError={() => {
                console.log("Error cargando imagen, mostrando inicial");
                setPreviewUrl(null);
              }}
            />
          ) : (
            <UserAvatar
              nombres={user.nombres}
              apellidos={user.apellidos}
              rut_usuario={user.rut_usuario}
              size="xl"
              showBorder={true}
              className="bg-gray-200 text-gray-400"
            />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow transition"
            title="Cambiar foto"
          >
            <Camera className="w-5 h-5" />
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
        <h2 className="text-2xl font-bold text-gray-900">
          {user.nombres} {user.apellidos}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {rol} | {cargo}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 text-sm">
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">
            Correo
          </span>
          <span className="font-medium text-gray-800">
            {user.email || "No registrado"}
          </span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">
            RUT
          </span>
          <span className="font-medium text-gray-800">
            {user.rut_usuario}
          </span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">
            Cargo
          </span>
          <span className="font-medium text-gray-800">{cargo}</span>
        </div>
        <div>
          <span className="block text-gray-400 uppercase tracking-wide">
            Rol
          </span>
          <span className="font-medium text-gray-800">{rol}</span>
        </div>
      </div>

      {/* BOTONES CAMBIO DE CONTRASEÑA / PIN */}
      <div className="mt-6 space-y-3">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-semibold shadow transition"
        >
          <Lock className="w-5 h-5" />
          Cambiar contraseña
        </button>

        <button
          onClick={() => setShowPinModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-3 rounded-lg font-semibold shadow-inner border border-gray-300 transition"
        >
          <Key className="w-5 h-5" />
          Cambiar PIN
        </button>
      </div>

      {/* MODAL CAMBIAR CONTRASEÑA */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={resetPasswordModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Cambiar contraseña
            </h3>

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
                    onClick={() =>
                      setShowCurrentPassword(!showCurrentPassword)
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
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
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
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
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={resetPasswordModal}
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

      {/* MODAL CAMBIAR PIN */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={resetPinModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Cambiar PIN
            </h3>

            {pinError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {pinError}
              </div>
            )}

            {pinSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {pinSuccess}
              </div>
            )}

            <div className="space-y-4">
              {/* PIN actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) =>
                      setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Ingresa tu PIN actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPin ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nuevo PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo PIN
                </label>
                <div className="relative">
                  <input
                    type={showNewPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Ingresa tu nuevo PIN (4 dígitos)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPin ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nuevo PIN
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    placeholder="Confirma tu nuevo PIN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPin ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={resetPinModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handlePinChange}
                disabled={pinLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pinLoading ? "Cambiando..." : "Cambiar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
