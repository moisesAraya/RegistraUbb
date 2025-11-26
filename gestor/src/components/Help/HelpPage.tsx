import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "soporte@ubiobio.cl";
const REPO_URL = import.meta.env.VITE_REPO_URL || "https://github.com/moisesAraya/RegistraUbb";

const faqs = [
  { q: "¿Qué es RegistraUBB?", a: "RegistraUBB centraliza marcajes, justificaciones y la gestión de usuarios para los académicos del departamento de Sistemas de información de la universidad del Bío-Bío." },
  { q: "¿Cómo reporto un error?", a: "Pulsa 'Reportar incidencia' para abrir tu cliente de correo con asunto prellenado." },
  { q: "¿Cómo cambio mi foto de perfil?", a: "En tu perfil pulsa el icono de cámara y sube la foto. Si falla, contacta soporte." },
  { q: "¿Dónde veo las notificaciones?", a: "La campana en el header muestra notificaciones reales. Pulsa una notificación para ir al recurso relacionado." }
];

const HelpPage: React.FC = () => {
  const { user } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); alert("Copiado al portapapeles"); }
    catch { alert("No se pudo copiar. Copia manualmente."); }
  };

  const buildMailto = () => {
    const subject = encodeURIComponent("Incidencia registraubb");
    const body = encodeURIComponent(
      `Hola soporte,\n\nQuiero reportar una incidencia.\n\nUsuario: ${user?.nombres || ""} ${user?.apellidos || ""}\nRUT: ${user?.rut_usuario || ""}\n\nDescripción:\n\n(Describe aquí el problema)\n`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow border border-slate-200">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Ayuda & Soporte</h1>
        <p className="text-sm text-slate-500">Información del proyecto, contacto y preguntas frecuentes.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 space-y-3">
          <h2 className="text-lg font-medium text-slate-800">Acerca del proyecto</h2>
          <p className="text-sm text-slate-600">
            RegistraUBB es la plataforma para la gestión de marcajes, justificaciones y control de accesos.
            Accede al repositorio o contacta al equipo de soporte si necesitas ayuda.
          </p>

          <div className="flex flex-wrap gap-3 mt-3">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm">
              Ver repositorio
            </a>

            {/* Reportar incidencia: abre cliente de correo con asunto prellenado */}
            <a
              href={buildMailto()}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
            >
              Reportar incidencia
            </a>
          </div>
        </div>

        <aside className="bg-slate-50 p-3 rounded text-sm">
          <h3 className="font-medium text-slate-700 mb-2">Contacto de soporte</h3>
          <div className="space-y-2 text-slate-600">
            <div>
              <div className="text-xs text-slate-500">Email</div>
              <div className="flex items-center gap-2">
                <span>{SUPPORT_EMAIL}</span>
                <button onClick={() => handleCopy(SUPPORT_EMAIL)} className="text-xs text-blue-600 hover:underline">Copiar</button>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Horario</div>
              <div>Lun - Vie, 9:00 - 18:00</div>
            </div>
            {user && (
              <div>
                <div className="text-xs text-slate-500">Tu usuario</div>
                <div className="text-sm text-slate-700">{user.nombres} {user.apellidos} — {user.rut_usuario}</div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="mb-4">
        <h2 className="text-lg font-medium text-slate-800 mb-2">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="border border-slate-100 rounded overflow-hidden">
              <button
                className="w-full text-left px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-medium text-slate-800">{f.q}</span>
                <span className="text-sm text-slate-500">{openIndex === i ? "−" : "+"}</span>
              </button>
              {openIndex === i && (
                <div className="px-4 py-3 bg-slate-50 text-sm text-slate-600">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-800 mb-2">Ayuda rápida</h2>
        <ul className="list-disc ml-5 text-sm text-slate-600 space-y-1">
          <li>Problemas con la foto: revisa permisos del navegador y vuelve a subir.</li>
          <li>Permisos y accesos: solicita al administrador del sistema.</li>
        </ul>
      </section>
    </div>
  );
};

export default HelpPage;