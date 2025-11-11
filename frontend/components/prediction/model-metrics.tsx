"use client"
import { type MetricRow } from "@/lib/api/types"

interface ModelMetricsProps {
  metrics?: MetricRow | MetricRow[]
}

export function ModelMetrics({ metrics }: ModelMetricsProps) {
  if (!metrics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Métricas del Modelo</h3>
        <p className="text-gray-500 text-sm">No hay métricas disponibles para este item.</p>
      </div>
    )
  }

  // Convert to array if single object
  const metricsArray = Array.isArray(metrics) ? metrics : [metrics]
  
  if (metricsArray.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Métricas del Modelo</h3>
        <p className="text-gray-500 text-sm">No hay métricas disponibles para este item.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-600 text-base">analytics</span>
          Métricas del Modelo
        </h3>
        {metricsArray.length > 1 && (
          <span className="text-xs text-gray-500">
            {metricsArray.length} modelos entrenados
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alcance
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modelo
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                R²
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                MAE
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                RMSE
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                MAPE
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Muestras
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metricsArray.map((metric, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {metric.alcance}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {metric.model}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                  {metric.r2 !== undefined ? metric.r2.toFixed(3) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {metric.mae !== undefined 
                    ? `$${metric.mae.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {metric.rmse !== undefined 
                    ? `$${metric.rmse.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {metric.mape !== undefined ? `${metric.mape.toFixed(2)}%` : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-center text-gray-600">
                  {metric.n_samples || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-500 leading-snug">
          <strong>Nota:</strong> Estas métricas corresponden al rendimiento de los modelos durante el entrenamiento. 
          Cada fila representa un modelo entrenado con un alcance específico.
        </p>
      </div>
    </div>
  )
}