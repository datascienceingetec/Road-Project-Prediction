"use client"

import { useState, useEffect } from "react"
import { api, type Fase, type PredictionResponse, type FunctionalUnitFormData } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { PredictionResultsTable, type ItemCosto } from "@/components/prediction/prediction-results-table"
import { PredictionComparisonChart } from "@/components/charts/prediction-comparison-chart"
import { ModelMetrics } from "@/components/prediction/model-metrics"
import { EditFunctionalUnitModal } from "@/components/edit-functional-unit-modal"
import { FunctionalUnitCard } from "@/components/functional-unit-card"

export default function PrediccionPage() {
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [predictionItems, setPredictionItems] = useState<ItemCosto[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [selectedItem, setSelectedItem] = useState<ItemCosto | null>(null)
  const [modelMetrics, setModelMetrics] = useState<PredictionResponse['metrics']>({})
  const [trainingModel, setTrainingModel] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUF, setEditingUF] = useState<{ index: number; data: FunctionalUnitFormData } | null>(null)
  const [selectedUFIndex, setSelectedUFIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    fase_id: 0,
    ubicacion: "",
  })

  const [unidadesFuncionales, setUnidadesFuncionales] = useState<FunctionalUnitFormData[]>([])

  useEffect(() => {
    loadFases()
  }, [])

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
    setEditingUF(null)
    setIsModalOpen(true)
  }

  const handleEditUnidadFuncional = (index: number) => {
    setEditingUF({ index, data: unidadesFuncionales[index] })
    setIsModalOpen(true)
  }

  const handleSaveUnidadFuncional = (data?: FunctionalUnitFormData) => {
    if (!data) return
    
    if (editingUF !== null) {
      // Editing existing
      const updated = [...unidadesFuncionales]
      updated[editingUF.index] = { ...data, numero: editingUF.index + 1 }
      setUnidadesFuncionales(updated)
    } else {
      // Adding new
      setUnidadesFuncionales([
        ...unidadesFuncionales,
        { ...data, numero: unidadesFuncionales.length + 1 },
      ])
    }
    setEditingUF(null)
  }

  const handleRemoveUnidadFuncional = (index: number) => {
    const updated = unidadesFuncionales.filter((_, i) => i !== index)
    // Renumerar las unidades funcionales
    const renumbered = updated.map((uf, idx) => ({ ...uf, numero: idx + 1 }))
    setUnidadesFuncionales(renumbered)
    if (selectedUFIndex === index) {
      setSelectedUFIndex(null)
    } else if (selectedUFIndex !== null && selectedUFIndex > index) {
      setSelectedUFIndex(selectedUFIndex - 1)
    }
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
    setModelMetrics(predictionData.metrics) 
    setLoading(false)
  }

  const isFormValid = () => {
    const hasBasicInfo = formData.nombre && formData.fase_id && formData.ubicacion
    const hasUFs = unidadesFuncionales.length > 0
    const hasValidUFs = unidadesFuncionales.every(
      (uf) => uf.longitud_km > 0 && uf.alcance && uf.zona && uf.tipo_terreno
    )
    return hasBasicInfo && hasUFs && hasValidUFs
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      fase_id: fases.length > 0 ? fases[0].id : 0,
      ubicacion: "",
    })
    setUnidadesFuncionales([])
    setPrediction(null)
    setPredictionItems([])
    setSelectedItem(null)
    setSelectedUFIndex(null)
  }

  const handleItemClick = (item: ItemCosto) => {
    if (selectedItem && selectedItem.item_tipo_id === item.item_tipo_id) {
      setSelectedItem(null)
      return
    }
    setSelectedItem(item)
  }

  const handleTrainModel = async () => {
    setTrainingModel(true)
    try {
      const result = await api.trainModel()
      alert(result.message || 'Modelo entrenado exitosamente')
    } catch (error) {
      console.error('Error al entrenar modelo:', error)
      alert('Error al entrenar el modelo')
    } finally {
      setTrainingModel(false)
    }
  }

  const getTotalLength = () => {
    return unidadesFuncionales.reduce((sum, uf) => sum + (uf.longitud_km || 0), 0)
  }

  return (
    <main className="flex flex-1 justify-center p-5 sm:p-10">
      <div className="flex flex-col w-full">
        {/* Encabezado */}
        <div className="flex flex-wrap justify-between items-center gap-3 p-4">
          <h1 className="text-[#071d49] text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
            Predicción de Costos
          </h1>
          <button
            onClick={handleTrainModel}
            disabled={trainingModel}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {trainingModel ? (
              <>
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                Entrenando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">model_training</span>
                Reentrenar Modelo
              </>
            )}
          </button>
        </div>

        {/* Layout Principal */}
        <div className="flex flex-col gap-8 p-4">
          {/* Información General */}
          <div className="bg-white rounded-xl border border-[#dee2e6] p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <h2 className="text-[#071d49] text-lg font-bold">Información General</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proyecto
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder="ej. Autopista del Sol"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fase del Proyecto
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  value={formData.fase_id}
                  onChange={(e) => handleInputChange("fase_id", e.target.value)}
                >
                  {fases.map((fase) => (
                    <option key={fase.id} value={fase.id}>
                      {fase.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder="ej. Bogotá, Colombia"
                  value={formData.ubicacion}
                  onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Unidades Funcionales */}
          <div className="flex flex-col rounded-xl border border-[#dee2e6] bg-white">
            <div className="flex items-center justify-between p-4 border-b border-[#dee2e6]">
              <div>
                <p className="text-[#071d49] text-base font-bold leading-normal">Unidades Funcionales</p>
                <p className="text-sm text-gray-600 mt-1">
                  {unidadesFuncionales.length} {unidadesFuncionales.length === 1 ? 'unidad' : 'unidades'} • {getTotalLength().toFixed(1)} km total
                </p>
              </div>
              <button
                onClick={handleAddUnidadFuncional}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Agregar UF
              </button>
            </div>
            <div className="p-4 space-y-3">
              {unidadesFuncionales.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-gray-400 text-5xl mb-3">add_road</span>
                  <p className="text-gray-600">No hay unidades funcionales</p>
                  <p className="text-sm text-gray-500 mt-2">Haz clic en "Agregar UF" para comenzar</p>
                </div>
              ) : (
                unidadesFuncionales.map((uf, index) => (
                  <FunctionalUnitCard
                    key={index}
                    unidad={uf}
                    isSelected={selectedUFIndex === index}
                    onClick={() => setSelectedUFIndex(selectedUFIndex === index ? null : index)}
                    onEdit={() => handleEditUnidadFuncional(index)}
                    onDelete={() => handleRemoveUnidadFuncional(index)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Modal */}
          <EditFunctionalUnitModal
            unidad={editingUF?.data || null}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setEditingUF(null)
            }}
            onSave={handleSaveUnidadFuncional}
          />

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

              {/* Split Layout: Tabla y Comparación */}
              <div
                className={`grid gap-6 transition-all duration-300 ${
                  selectedItem ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1'
                }`}
              >
                {/* Tabla de Items */}
                <div className={`transition-all duration-300 ${selectedItem ? 'md:col-span-2' : 'col-span-1'}`}>
                  <PredictionResultsTable 
                    items={predictionItems} 
                    loading={loading}
                    onItemClick={handleItemClick}
                    selectedItem={selectedItem}
                  />
                </div>

                {/* Panel de Comparación */}
                {selectedItem && (
                  <div className="md:col-span-3 space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="bg-white rounded-xl border border-[#dee2e6] p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#071d49]">Análisis de Item</h3>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <PredictionComparisonChart
                        itemNombre={selectedItem.item}
                        itemTipoId={selectedItem.item_tipo_id}
                        faseId={formData.fase_id}
                        predictedValue={selectedItem.causacion_estimada}
                        predictedLength={getTotalLength()}
                      />
                    </div>
                    
                    <ModelMetrics metrics={modelMetrics} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
