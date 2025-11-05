"use client"

import { useState, useEffect } from "react"
import { api, type Scenario, type Fase } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { FunctionalUnitForm, type FunctionalUnitFormData } from "@/components/prediction/functional-unit-form"
import { PredictionResultsTable, type ItemCosto } from "@/components/prediction/prediction-results-table"
import { ScenarioManager } from "@/components/prediction/scenario-manager"

export default function PrediccionPage() {
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [predictionItems, setPredictionItems] = useState<ItemCosto[]>([])
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    nombre: "",
    fase_id: 0,
    ubicacion: "",
  })

  const [unidadesFuncionales, setUnidadesFuncionales] = useState<FunctionalUnitFormData[]>([
    {
      numero: 1,
      longitud_km: 0,
      puentes_vehiculares_und: 0,
      puentes_vehiculares_mt2: 0,
      puentes_peatonales_und: 0,
      puentes_peatonales_mt2: 0,
      tuneles_und: 0,
      tuneles_km: 0,
      alcance: "",
      zona: "",
      tipo_terreno: "",
    },
  ])

  useEffect(() => {
    // loadScenarios()
    loadFases()
  }, [])

  const loadScenarios = async () => {
    const scenarios = await api.getScenarios()
    setSavedScenarios(scenarios)
  }

  const loadFases = async () => {
    const fases = await api.getFases()
    setFases(fases)
    if (fases.length > 0) {
      setFormData((prev) => ({ ...prev, fase_id: fases[0].id }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddUnidadFuncional = () => {
    setUnidadesFuncionales([
      ...unidadesFuncionales,
      {
        numero: unidadesFuncionales.length + 1,
        longitud_km: 0,
        puentes_vehiculares_und: 0,
        puentes_vehiculares_mt2: 0,
        puentes_peatonales_und: 0,
        puentes_peatonales_mt2: 0,
        tuneles_und: 0,
        tuneles_km: 0,
        alcance: "",
        zona: "",
        tipo_terreno: "",
      },
    ])
  }

  const handleRemoveUnidadFuncional = (index: number) => {
    if (unidadesFuncionales.length > 1) {
      setUnidadesFuncionales(unidadesFuncionales.filter((_, i) => i !== index))
    }
  }

  const handleUpdateUnidadFuncional = (index: number, data: FunctionalUnitFormData) => {
    const updated = [...unidadesFuncionales]
    updated[index] = data
    setUnidadesFuncionales(updated)
  }

  const handlePredict = async () => {
    setLoading(true)

    const predictionData = await api.predictCosto({
      proyecto_nombre: formData.nombre,
      fase_id: formData.fase_id,
      ubicacion: formData.ubicacion,
      unidades_funcionales: unidadesFuncionales,
    })

    setPrediction(predictionData)
    setPredictionItems(predictionData.items || [])
    setLoading(false)
  }

  const handleSaveScenario = async (nombre: string) => {
    if (!prediction) return

    const scenario = await api.saveScenario({
      nombre,
      proyecto_nombre: formData.nombre,
      fase_id: formData.fase_id,
      ubicacion: formData.ubicacion,
      costo_total: prediction.costo_estimado,
      unidades_funcionales: unidadesFuncionales,
      items: predictionItems,
    })

    setSavedScenarios([...savedScenarios, scenario])
  }

  const handleDeleteScenario = async (scenarioId: string) => {
    await api.deleteScenario(scenarioId)
    setSavedScenarios(savedScenarios.filter((s) => s.id !== scenarioId))
    setSelectedScenarioIds(selectedScenarioIds.filter((id) => id !== scenarioId))
  }

  const handleCompareScenarios = (scenarioIds: string[]) => {
    setSelectedScenarioIds(scenarioIds)
    // TODO: Implement comparison visualization in chart
    console.log("Comparing scenarios:", scenarioIds)
  }

  const isFormValid = () => {
    const hasBasicInfo = formData.nombre && formData.fase_id && formData.ubicacion
    const hasValidUFs = unidadesFuncionales.every(
      (uf) => uf.longitud_km > 0 && uf.alcance && uf.zona && uf.tipo_terreno
    )
    return hasBasicInfo && hasValidUFs
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      fase_id: 0,
      ubicacion: "",
    })
    setUnidadesFuncionales([
      {
        numero: 1,
        longitud_km: 0,
        puentes_vehiculares_und: 0,
        puentes_vehiculares_mt2: 0,
        puentes_peatonales_und: 0,
        puentes_peatonales_mt2: 0,
        tuneles_und: 0,
        tuneles_km: 0,
        alcance: "",
        zona: "",
        tipo_terreno: "",
      },
    ])
    setPrediction(null)
    setPredictionItems([])
  }

  return (
    <main className="flex flex-1 justify-center p-5 sm:p-10">
      <div className="flex flex-col w-full max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-[#071d49] text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
            Predicción de Costos
          </h1>
        </div>

        {/* Layout Principal */}
        <div className="flex flex-col gap-8 p-4">
          {/* Información General */}
          <details className="flex flex-col rounded-xl border border-[#dee2e6] bg-white group" open>
            <summary className="flex cursor-pointer items-center justify-between gap-6 p-4">
              <p className="text-[#071d49] text-base font-bold leading-normal">Información General</p>
              <span className="material-symbols-outlined text-[#111418] transition-transform group-open:rotate-180">
                expand_more
              </span>
            </summary>
            <div className="border-t border-[#dee2e6] p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex flex-col">
                <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Nombre del Proyecto</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                  placeholder="ej. Autopista del Sol"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                />
              </label>
              <label className="flex flex-col">
                <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Fase del Proyecto</p>
                <select
                  className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 px-4 text-sm font-normal"
                  value={formData.fase_id}
                  onChange={(e) => handleInputChange("fase_id", e.target.value)}
                >
                  {fases.map((fase) => (
                    <option key={fase.id} value={fase.id}>
                      {fase.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col">
                <p className="text-[#111418] text-sm font-medium leading-normal pb-2">Ubicación</p>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dee2e6] bg-white h-12 placeholder:text-[#6c757d] px-4 text-sm font-normal"
                  placeholder="ej. Bogotá, Colombia"
                  value={formData.ubicacion}
                  onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                />
              </label>
            </div>
          </details>

          {/* Unidades Funcionales */}
          <div className="flex flex-col rounded-xl border border-[#dee2e6] bg-white">
            <div className="flex items-center justify-between p-4 border-b border-[#dee2e6]">
              <div>
                <p className="text-[#071d49] text-base font-bold leading-normal">Unidades Funcionales</p>
                <p className="text-sm text-gray-600 mt-1">Detalle completo de cada unidad funcional del proyecto</p>
              </div>
              <button
                onClick={handleAddUnidadFuncional}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Agregar UF
              </button>
            </div>
            <div className="p-6 space-y-6">
              {unidadesFuncionales.map((uf, index) => (
                <FunctionalUnitForm
                  key={index}
                  data={uf}
                  onChange={(data) => handleUpdateUnidadFuncional(index, data)}
                  onRemove={() => handleRemoveUnidadFuncional(index)}
                  showRemoveButton={unidadesFuncionales.length > 1}
                  unitNumber={index + 1}
                />
              ))}
            </div>
          </div>

          {/* Acciones del Formulario */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-[#111418] bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Limpiar Formulario
            </button>
            <button
              onClick={handlePredict}
              className="px-8 py-3 rounded-lg text-sm font-semibold text-white bg-[#e4002b] hover:bg-[#e4002b]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  Calculando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">calculate</span>
                  Calcular Predicción
                </>
              )}
            </button>
          </div>

          {/* Resultados de Predicción */}
          {prediction && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
                <h2 className="text-[#071d49] text-2xl font-bold">Resultados de Predicción</h2>
              </div>

              {/* Costo Total Estimado */}
              <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-6">
                <p className="text-sm font-medium text-primary uppercase tracking-wider">Costo Total Estimado</p>
                <p className="text-5xl font-extrabold text-primary mt-3">
                  {formatCurrency(prediction.costo_estimado)}
                </p>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Costo por km</p>
                    <p className="text-lg font-bold text-gray-700">{formatCurrency(prediction.costo_por_km)}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Confianza</p>
                    <p className="text-lg font-bold text-gray-700">{(prediction.confianza * 100).toFixed(0)}%</p>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Unidades Funcionales</p>
                    <p className="text-lg font-bold text-gray-700">{unidadesFuncionales.length}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de Items */}
              <PredictionResultsTable items={predictionItems} loading={loading} />
            </div>
          )}

          {/* Gestión de Escenarios */}
          {/* <ScenarioManager
            currentScenario={
              prediction
                ? {
                    proyecto_nombre: formData.nombre,
                    fase: formData.fase,
                    ubicacion: formData.ubicacion,
                    costo_total: prediction.costo_estimado,
                    num_ufs: unidadesFuncionales.length,
                  }
                : undefined
            }
            savedScenarios={savedScenarios}
            onSaveScenario={handleSaveScenario}
            onCompareScenarios={handleCompareScenarios}
            onDeleteScenario={handleDeleteScenario}
          /> */}

          {/* Nota informativa sobre comparación */}
          {selectedScenarioIds.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-blue-600 text-2xl">info</span>
                <div>
                  <h3 className="text-blue-900 font-bold text-lg mb-2">Escenarios Seleccionados para Comparación</h3>
                  <p className="text-blue-800 text-sm">
                    Has seleccionado {selectedScenarioIds.length} escenario(s) para comparar. Los escenarios
                    seleccionados se resaltarán en la gráfica de valor presente de la causación en el dashboard.
                  </p>
                  <button
                    onClick={() => {
                      // TODO: Navigate to dashboard with selected scenarios
                      console.log("Navigate to dashboard with scenarios:", selectedScenarioIds)
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    Ver Comparación en Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
