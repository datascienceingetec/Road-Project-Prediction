"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { Fase, EnumOption, PredictionRequest, PredictionResponse, UnidadFuncional, FunctionalUnitFormData, MetricRow, AvailableModel } from "@/lib/api/types"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { PredictionResultsTable, type ItemCosto } from "@/components/prediction/prediction-results-table"
import { PredictionComparisonChart } from "@/components/charts/prediction-comparison-chart"
import { PredictionRealVsPredictedChart } from "@/components/charts/prediction-real-vs-predicted-chart"
import { ModelMetrics } from "@/components/prediction/model-metrics"
import { EditFunctionalUnitModal } from "@/components/edit-functional-unit-modal"
import { FunctionalUnitCard } from "@/components/functional-unit-card"

export default function PrediccionPage() {
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [fases, setFases] = useState<Fase[]>([])
  const [selectedItem, setSelectedItem] = useState<ItemCosto | null>(null)
  const [modelMetrics, setModelMetrics] = useState<MetricRow | MetricRow[]>([])
  const [trainingModel, setTrainingModel] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUF, setEditingUF] = useState<{ index: number; data: FunctionalUnitFormData } | null>(null)
  const [selectedUFIndex, setSelectedUFIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [showTrainModal, setShowTrainModal] = useState(false)
  const [selectedTrainFaseId, setSelectedTrainFaseId] = useState<number | null>(null)
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    fase_id: 0,
    ubicacion: "",
  })

  const [unidadesFuncionales, setUnidadesFuncionales] = useState<FunctionalUnitFormData[]>([])

  useEffect(() => {
    loadFases()
    loadAvailableModels()
  }, [])

  const loadFases = async () => {
    const fases = await api.getFases()
    setFases(fases)
    if (fases.length > 0) {
      setFormData((prev) => ({ ...prev, fase_id: fases[0].id }))
    }
  }

  const loadAvailableModels = async () => {
    setLoadingModels(true)
    try {
      const response = await api.getAvailableModels()
      setAvailableModels(response.models)
      
      // Set default train fase to first available model
      const firstAvailable = response.models.find((m: AvailableModel) => m.available)
      if (firstAvailable) {
        setSelectedTrainFaseId(firstAvailable.fase)
      }
    } catch (error) {
      console.error('Error loading available models:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    // Convert fase_id to number
    const processedValue = field === 'fase_id' ? Number(value) : value
    setFormData((prev) => ({ ...prev, [field]: processedValue }))
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
    // Check if model is available for selected phase
    const selectedPhaseModel = availableModels.find(m => m.fase_id === formData.fase_id)
    if (!selectedPhaseModel || !selectedPhaseModel.available) {
      const faseName = fases.find(f => f.id === formData.fase_id)?.nombre || 'seleccionada'
      toast.error(`No hay modelo entrenado disponible para ${faseName}. Por favor, entrena un modelo primero usando el botón "Reentrenar Modelo".`)
      return
    }

    setLoading(true)
    setSelectedItem(null)
    setModelMetrics([])

    try {
      const predictionData = await api.predictCosto({
        proyecto_nombre: formData.nombre,
        fase_id: formData.fase_id,
        ubicacion: formData.ubicacion,
        unidades_funcionales: unidadesFuncionales,
      })

      setPrediction(predictionData)
      setActiveTab(0)
    } catch (error: any) {
      console.error('Error in prediction:', error)
      toast.error('Error al realizar la predicción', {
        description: error.message || 'Error desconocido'
      })
    } finally {
      setLoading(false)
    }
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
    setSelectedItem(null)
    setSelectedUFIndex(null)
    setActiveTab(0)
  }

  const handleItemClick = (item: ItemCosto) => {
    if (selectedItem && selectedItem.item_tipo_id === item.item_tipo_id) {
      setSelectedItem(null)
      return
    }
    setSelectedItem(item)
    setModelMetrics(item.metrics || [])
  }

  const handleTrainModel = async () => {
    if (!selectedTrainFaseId) {
      toast.warning('Por favor selecciona una fase para entrenar')
      return
    }
    
    setTrainingModel(true)
    try {
      const result = await api.trainModel(selectedTrainFaseId)
      const selectedModel = availableModels.find(m => m.fase_id === selectedTrainFaseId)
      toast.success(`Modelo de ${selectedModel?.fase_nombre || 'la fase seleccionada'} entrenado exitosamente`)
      setShowTrainModal(false)
      // Reload available models
      await loadAvailableModels()
    } catch (error) {
      console.error('Error al entrenar modelo:', error)
      toast.error('Error al entrenar el modelo', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
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
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowTrainModal(true)
              }}
              disabled={trainingModel}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">model_training</span>
              Entrenar Modelo
            </button>
          </div>
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
                
                {/* Indicador de modelo disponible */}
                {formData.fase_id > 0 && (
                  <div className="mt-2">
                    {loadingModels ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-gray-400 border-r-transparent"></div>
                        <span>Verificando modelo...</span>
                      </div>
                    ) : (() => {
                      const selectedPhaseModel = availableModels.find(m => m.fase_id === formData.fase_id)
                      const isAvailable = selectedPhaseModel?.available
                      
                      return (
                        <div className={`flex items-center gap-2 text-sm ${isAvailable ? 'text-green-700' : 'text-yellow-700'}`}>
                          <span className="material-symbols-outlined text-base">
                            {isAvailable ? 'check_circle' : 'warning'}
                          </span>
                          <span>
                            {isAvailable 
                              ? 'Modelo disponible para predicción' 
                              : 'No hay modelo entrenado. Entrena uno primero.'}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )}
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
                <p className="text-sm font-medium text-primary uppercase tracking-wider">{prediction.proyecto_nombre} - Costo Total Estimado para {fases.find((f) => f.id == prediction.fase_id)?.nombre}</p> 
                <p className="text-5xl font-extrabold text-primary mt-3">
                  {formatCurrency(prediction.costo_total)}
                </p>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Costo por km</p>
                    <p className="text-lg font-bold text-gray-700">{formatCurrency(prediction.costo_total_por_km)}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Longitud Total</p>
                    <p className="text-lg font-bold text-gray-700">{prediction.longitud_total_km.toFixed(2)} km</p>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">UFs</p>
                    <p className="text-lg font-bold text-gray-700">{prediction.num_unidades_funcionales}</p>
                  </div>
                </div>
              </div>

              {/* Tabs por Unidad Funcional */}
              <div className="bg-white rounded-xl border border-[#dee2e6] overflow-hidden">
                <div className="border-b border-[#dee2e6]">
                  <div className="flex overflow-x-auto">
                    {prediction.resultados.map((resultado, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveTab(index)
                          setSelectedItem(null)
                        }}
                        className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                          activeTab === index
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">route</span>
                          <span>UF {resultado.unidad_funcional}</span>
                          <span className="text-xs text-gray-500">({resultado.longitud_km.toFixed(1)} km)</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contenido del Tab Activo */}
                {prediction.resultados[activeTab] && (
                  <div className="p-6">
                    {/* Info de la UF */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Unidad Funcional</p>
                          <p className="text-lg font-bold text-gray-900">UF {prediction.resultados[activeTab].unidad_funcional}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Alcance</p>
                          <p className="text-lg font-bold text-gray-900">{prediction.resultados[activeTab].alcance}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Costo Estimado</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(prediction.resultados[activeTab].costo_estimado)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Costo por km</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(prediction.resultados[activeTab].costo_por_km)}</p>
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
                          items={prediction.resultados[activeTab].items} 
                          loading={loading}
                          onItemClick={handleItemClick}
                          selectedItem={selectedItem}
                        />
                      </div>

                      {/* Panel de Comparación */}
                      {selectedItem && selectedItem.item_tipo_id !== null && (
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
                              predictedLength={prediction.resultados[activeTab].longitud_km}
                            />
                            { selectedItem.predicted &&
                              <PredictionRealVsPredictedChart
                                itemNombre={selectedItem.item}
                                itemTipoId={selectedItem.item_tipo_id}
                                faseId={formData.fase_id}
                                alcance={prediction.resultados[activeTab].alcance}
                              />
                            }
                          </div>
                          
                          <ModelMetrics metrics={modelMetrics} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal de Entrenamiento */}
        {showTrainModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">model_training</span>
                <h2 className="text-xl font-bold text-[#071d49]">Entrenar Modelo</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Selecciona la fase del modelo que deseas entrenar. Este proceso puede tomar varios minutos.
              </p>

              <div className="space-y-3 mb-6">
                {loadingModels ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    <span className="ml-3 text-gray-600">Cargando modelos...</span>
                  </div>
                ) : availableModels.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <p>No hay modelos disponibles</p>
                  </div>
                ) : (
                  availableModels.map((model) => {
                    const isAvailable = model.available
                    
                    return (
                      <label 
                        key={model.fase}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                          isAvailable 
                            ? 'cursor-pointer hover:bg-gray-50' 
                            : 'opacity-50 cursor-not-allowed bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="fase"
                          value={model.fase_id}
                          checked={selectedTrainFaseId === model.fase_id}
                          onChange={(e) => setSelectedTrainFaseId(Number(e.target.value))}
                          className="w-5 h-5 text-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">Fase {model.fase}</p>
                            {isAvailable && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                Disponible
                              </span>
                            )}
                            {!isAvailable && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                No entrenado
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{model.fase_nombre}</p>
                          {model.metadata?.training_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Última actualización: {new Date(model.metadata.training_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTrainModal(false)}
                  disabled={trainingModel}
                  className="flex-1 px-4 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTrainModel}
                  disabled={trainingModel}
                  className="flex-1 px-4 py-3 rounded-lg font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {trainingModel ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      Entrenando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Entrenar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
