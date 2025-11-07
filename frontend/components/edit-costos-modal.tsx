"use client"

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { type FaseItemRequerido, type CostoItem, api } from "@/lib/api"

interface EditCostosModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  codigoProyecto: string
  faseItems: FaseItemRequerido[]
}

export function EditCostosModal({
  isOpen,
  onClose,
  onSave,
  codigoProyecto,
  faseItems,
}: EditCostosModalProps) {
  const [costos, setCostos] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const costosMap: Record<number, number> = {}
      faseItems.forEach((item) => {
        if (item.has_children) return
        
        costosMap[item.item_tipo_id] = item.valor_calculado || 0
      })
      setCostos(costosMap)
      setHasChanges(false)
    }
  }, [isOpen, faseItems])

  const handleCostoChange = (itemTipoId: number, valor: string) => {
    const numericValue = parseFloat(valor) || 0
    setCostos((prev) => ({ ...prev, [itemTipoId]: numericValue }))
    setHasChanges(true)
  }

  const handleResetAll = () => {
    const costosMap: Record<number, number> = {}
    faseItems.forEach((item) => {
      if (item.has_children) return
      costosMap[item.item_tipo_id] = 0
    })
    setCostos(costosMap)
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const costosArray = Object.entries(costos).map(([item_tipo_id, valor]) => ({
        item_tipo_id: parseInt(item_tipo_id),
        valor,
      }))

      await api.createOrUpdateCostos(codigoProyecto, costosArray)
      onSave()
      onClose()
    } catch (error) {
      console.error("Error al guardar costos:", error)
    } finally {
      setLoading(false)
    }
  }

  const parentItems = faseItems.filter(item => item.has_children)
  const nonParentItems = faseItems.filter(item => !item.has_children)
  
  const calculateParentValue = (parentItem: FaseItemRequerido): number => {
    const children = faseItems.filter(item => item.parent_id === parentItem.id)
    return children.reduce((sum, child) => {
      if (child.has_children) {
        return sum + calculateParentValue(child)
      }
      return sum + (costos[child.item_tipo_id] || 0)
    }, 0)
  }
  
  const totalCostos = Object.values(costos).reduce((sum, valor) => sum + valor, 0) + 
    parentItems.reduce((sum, item) => sum + calculateParentValue(item), 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#111418]">Editar Costos del Proyecto</h2>
            <p className="text-sm text-gray-600 mt-1">Ingrese el valor para cada item requerido</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Cerrar">
            <span className="material-symbols-outlined text-gray-600">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {nonParentItems.length} items editables, {parentItems.length} items calculados
              </p>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reiniciar a $0
              </button>
            </div>
            <div className="space-y-4">
            {/* All items in order - editable and calculated */}
            {faseItems.map((item) => {
              const itemTipoId = item.item_tipo_id
              const isParent = item.has_children
              const valor = isParent ? calculateParentValue(item) : (costos[itemTipoId] || 0)

              if (isParent) {
                // Parent item - calculated, read-only with blue styling
                return (
                  <div key={item.id} className="flex flex-col gap-2 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-blue-900 mb-1">
                          {item.descripcion || item.item_tipo?.nombre || "Item desconocido"}
                        </label>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-200 text-blue-800">
                          Calculado
                        </span>
                      </div>
                      <div className="w-48">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="text"
                            value={formatCurrency(valor)}
                            disabled
                            className="w-full pl-7 pr-3 py-2 border border-blue-300 bg-blue-100 rounded-lg text-right font-semibold text-blue-900 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              } else {
                // Regular item - editable
                return (
                  <div key={item.id} className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                          {item.descripcion || item.item_tipo?.nombre || "Item desconocido"}
                        </label>
                        {item.obligatorio && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <div className="w-48">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => handleCostoChange(itemTipoId, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right font-semibold"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">{formatCurrency(valor)}</p>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>

            {faseItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="material-symbols-outlined text-5xl mb-3">description</span>
                <p>No hay items definidos para esta fase</p>
              </div>
            )}

            {faseItems.length > 0 && (
              <div className="mt-6 mb-6 p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">Total del Proyecto</span>
                  <span className="text-2xl font-extrabold text-primary">{formatCurrency(totalCostos)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Guardar Costos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
