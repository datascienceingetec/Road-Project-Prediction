"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"

export interface Scenario {
  id: string
  nombre: string
  proyecto_nombre: string
  fase: string
  ubicacion: string
  costo_total: number
  fecha_creacion: string
  num_ufs: number
}

interface ScenarioManagerProps {
  currentScenario?: {
    proyecto_nombre: string
    fase: string
    ubicacion: string
    costo_total: number
    num_ufs: number
  }
  savedScenarios: Scenario[]
  onSaveScenario: (nombre: string) => void
  onCompareScenarios: (scenarioIds: string[]) => void
  onDeleteScenario: (scenarioId: string) => void
}

export function ScenarioManager({
  currentScenario,
  savedScenarios,
  onSaveScenario,
  onCompareScenarios,
  onDeleteScenario,
}: ScenarioManagerProps) {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [scenarioName, setScenarioName] = useState("")
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [showCompareView, setShowCompareView] = useState(false)

  const handleSave = () => {
    if (!currentScenario) return

    const defaultName = `${currentScenario.proyecto_nombre} - Escenario ${savedScenarios.length + 1}`
    const finalName = scenarioName.trim() || defaultName

    onSaveScenario(finalName)
    setScenarioName("")
    setShowSaveModal(false)
  }

  const handleToggleScenario = (scenarioId: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId) ? prev.filter((id) => id !== scenarioId) : [...prev, scenarioId]
    )
  }

  const handleCompare = () => {
    if (selectedScenarios.length > 0) {
      onCompareScenarios(selectedScenarios)
      setShowCompareView(true)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#dee2e6] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#071d49]">Gestión de Escenarios</h3>
          <p className="text-sm text-gray-600 mt-1">Guarde y compare diferentes predicciones</p>
        </div>
        {currentScenario && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Guardar Escenario
          </button>
        )}
      </div>

      {/* Lista de Escenarios Guardados */}
      {savedScenarios.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Escenarios Guardados ({savedScenarios.length})</h4>
            {selectedScenarios.length > 0 && (
              <button
                onClick={handleCompare}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">compare_arrows</span>
                Comparar ({selectedScenarios.length})
              </button>
            )}
          </div>

          {savedScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedScenarios.includes(scenario.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedScenarios.includes(scenario.id)}
                    onChange={() => handleToggleScenario(scenario.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{scenario.nombre}</h5>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Fase:</span> {scenario.fase}
                      </div>
                      <div>
                        <span className="font-medium">Ubicación:</span> {scenario.ubicacion}
                      </div>
                      <div>
                        <span className="font-medium">UFs:</span> {scenario.num_ufs}
                      </div>
                      <div>
                        <span className="font-medium">Costo:</span>{" "}
                        <span className="font-semibold text-primary">{formatCurrency(scenario.costo_total)}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Creado: {new Date(scenario.fecha_creacion).toLocaleDateString("es-CO")}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteScenario(scenario.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Eliminar escenario"
                >
                  <span className="material-symbols-outlined text-red-600 text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">folder_open</span>
          <p className="text-gray-600 font-medium">No hay escenarios guardados</p>
          <p className="text-sm text-gray-500 mt-1">Realice una predicción y guárdela como escenario</p>
        </div>
      )}

      {/* Modal para Guardar Escenario */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#111418]">Guardar Escenario</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Escenario</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder={`${currentScenario?.proyecto_nombre} - Escenario ${savedScenarios.length + 1}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Si deja vacío, se usará el nombre por defecto
              </p>

              {currentScenario && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Resumen del Escenario</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Proyecto:</span> {currentScenario.proyecto_nombre}
                    </div>
                    <div>
                      <span className="font-medium">Fase:</span> {currentScenario.fase}
                    </div>
                    <div>
                      <span className="font-medium">Ubicación:</span> {currentScenario.ubicacion}
                    </div>
                    <div>
                      <span className="font-medium">Unidades Funcionales:</span> {currentScenario.num_ufs}
                    </div>
                    <div>
                      <span className="font-medium">Costo Total:</span>{" "}
                      <span className="font-semibold text-primary">
                        {formatCurrency(currentScenario.costo_total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nota sobre comparación */}
      {savedScenarios.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">info</span>
            <p className="text-xs text-blue-800">
              Seleccione uno o más escenarios para compararlos con el histórico de proyectos en la gráfica de valor
              presente de la causación.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
