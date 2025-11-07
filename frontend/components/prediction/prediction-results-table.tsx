"use client"

import { formatCurrency } from "@/lib/utils"
import { PredictionMetrics } from "@/lib/api/types"

export interface ItemCosto {
  item: string
  item_tipo_id: number
  causacion_estimada: number
  metrics?: PredictionMetrics
  is_parent?: boolean
}

interface PredictionResultsTableProps {
  items: ItemCosto[]
  loading?: boolean
  onItemClick?: (item: ItemCosto) => void
  selectedItem?: ItemCosto | null
}

export function PredictionResultsTable({ items, loading = false, onItemClick, selectedItem }: PredictionResultsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#dee2e6] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <span className="ml-3 text-gray-600">Calculando costos...</span>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#dee2e6] p-6">
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-gray-400 text-5xl mb-3">description</span>
          <p className="text-gray-600">No hay resultados de predicción disponibles</p>
          <p className="text-sm text-gray-500 mt-2">Complete el formulario y haga clic en "Calcular Predicción"</p>
        </div>
      </div>
    )
  }

  // Calculate total excluding parent items to avoid double counting
  const totalCausacion = items.reduce((sum, item) => {
    return sum + (item.is_parent ? 0 : item.causacion_estimada)
  }, 0)

  return (
    <div className="bg-white rounded-xl border border-[#dee2e6] overflow-hidden">
      <div className="p-6 border-b border-[#dee2e6]">
        <h3 className="text-lg font-bold text-[#071d49]">Desglose de Costos por Item</h3>
        <p className="text-sm text-gray-600 mt-1">Causación estimada para cada item requerido</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead className="bg-gray-50 border-b border-[#dee2e6]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Causación Estimada
              </th>
              {/* 👇 Ocultar columna en pantallas pequeñas */}
              <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % del Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => {
              const percentage = totalCausacion > 0 ? (item.causacion_estimada / totalCausacion) * 100 : 0
              const isSelected = selectedItem?.item === item.item
              const isParent = item.is_parent || false
              const isClickable = !isParent
              
              return (
                <tr
                  key={index}
                  className={`transition-colors ${
                    isParent
                      ? 'bg-blue-50 cursor-default'
                      : isSelected 
                        ? 'bg-primary/10 hover:bg-primary/15 cursor-pointer' 
                        : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                  onClick={() => isClickable && onItemClick?.(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isParent ? (
                        <span className="material-symbols-outlined mr-2 text-sm text-blue-600">
                          functions
                        </span>
                      ) : (
                        <span className={`material-symbols-outlined mr-2 text-sm ${isSelected ? 'text-primary' : 'text-primary'}`}>
                          {isSelected ? 'radio_button_checked' : 'check_circle'}
                        </span>
                      )}
                      <span className={`text-sm font-medium ${
                        isParent 
                          ? 'text-blue-900' 
                          : isSelected 
                            ? 'text-primary' 
                            : 'text-gray-900'
                      }`}>
                        {item.item}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${
                    isParent ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {formatCurrency(item.causacion_estimada)}
                  </td>
                  {/* 👇 Esta celda también se oculta en pantallas pequeñas */}
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isParent
                        ? 'bg-blue-200 text-blue-800'
                        : isSelected 
                          ? 'bg-primary text-white' 
                          : 'bg-primary/10 text-primary'
                    }`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-[#dee2e6]">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-base font-bold text-primary">
                {formatCurrency(totalCausacion)}
              </td>
              {/* 👇 También se oculta el total de porcentaje en móvil */}
              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                  100%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}