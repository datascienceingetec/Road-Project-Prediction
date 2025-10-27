"use client"

import { useSettings } from "@/lib/settings-context"

export default function ConfiguracionPage() {
  const { useSidebar, toggleNavigation } = useSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
          <p className="text-gray-600">Personaliza la apariencia y comportamiento de la aplicación</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Navegación</h2>
            <p className="text-sm text-gray-600">Elige cómo quieres navegar por la aplicación</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="radio"
                  name="navigation"
                  checked={useSidebar}
                  onChange={() => !useSidebar && toggleNavigation()}
                  className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary">menu</span>
                    <span className="font-medium text-gray-900">Barra lateral (Sidebar)</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Navegación persistente en el lado izquierdo de la pantalla. Ideal para acceso rápido a todas las
                    secciones.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="radio"
                  name="navigation"
                  checked={!useSidebar}
                  onChange={() => useSidebar && toggleNavigation()}
                  className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary">toolbar</span>
                    <span className="font-medium text-gray-900">Barra superior (Navbar)</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Navegación horizontal en la parte superior. Maximiza el espacio vertical para el contenido.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 flex-shrink-0">info</span>
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Nota:</p>
                  <p>Los cambios se aplicarán inmediatamente. Puedes cambiar entre modos en cualquier momento.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Información del Sistema</h2>
            <p className="text-sm text-gray-600">Detalles sobre la aplicación</p>
          </div>

          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Versión</dt>
                <dd className="text-base text-gray-900">1.0.0</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Última actualización</dt>
                <dd className="text-base text-gray-900">Enero 2025</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Desarrollado por</dt>
                <dd className="text-base text-gray-900">INGETEC</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Tipo de aplicación</dt>
                <dd className="text-base text-gray-900">Sistema de Predicción de Costos</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
