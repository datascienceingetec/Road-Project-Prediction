"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { AvailableModel } from "@/lib/api/types"

interface TrainingModalProps {
  isOpen: boolean
  onClose: () => void
  onModelTrained?: () => Promise<void>
}

export function TrainingModal({ isOpen, onClose, onModelTrained }: TrainingModalProps) {
  const [trainingModel, setTrainingModel] = useState(false)
  const [selectedTrainFaseId, setSelectedTrainFaseId] = useState<number | null>(null)
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [loadingModels, setLoadingModels] = useState(true)

  const loadAvailableModels = async () => {
    setLoadingModels(true)
    try {
      const response = await api.getAvailableModels()
      setAvailableModels(response.models)
      console.log(response.models)
    } catch (error) {
      console.error('Error loading available models:', error)
      toast.error('Error al cargar los modelos disponibles')
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadAvailableModels()
      setSelectedTrainFaseId(null)
    }
  }, [isOpen])

  const handleTrainModel = async () => {
    if (!selectedTrainFaseId) {
      toast.warning('Por favor selecciona una fase para entrenar')
      return
    }
    
    setTrainingModel(true)
    try {
      await api.trainModel(selectedTrainFaseId)
      const selectedModel = availableModels.find(m => m.fase_id === selectedTrainFaseId)
      toast.success(`Modelo de ${selectedModel?.fase_nombre || 'la fase seleccionada'} entrenado exitosamente`)
      onClose()
      await onModelTrained?.()
    } catch (error) {
      console.error('Error al entrenar modelo:', error)
      toast.error('Error al entrenar el modelo', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setTrainingModel(false)
    }
  }

  if (!isOpen) return null

  return (
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
            availableModels.map((model) => (
              <label 
                key={model.fase}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors`}
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
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      model.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {model.available ? 'Disponible' : 'No entrenado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{model.fase_nombre}</p>
                  {model.metadata?.training_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Última actualización: {new Date(model.metadata.training_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={trainingModel}
            className="flex-1 px-4 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleTrainModel}
            disabled={trainingModel || !selectedTrainFaseId}
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
  )
}
