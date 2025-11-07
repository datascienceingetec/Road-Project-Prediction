"use client"

interface ModelMetricsProps {
  metrics?: {
    r2?: number
    mae?: number
    rmse?: number
    mape?: number
    median_ae?: number
    max_error?: number
  }
}

export function ModelMetrics({ metrics }: ModelMetricsProps) {
  if (!metrics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Métricas del Modelo</h3>
        <p className="text-gray-500 text-sm">No hay métricas disponibles.</p>
      </div>
    )
  }

  const metricsList = [
    { key: 'r2', label: 'R²', value: metrics.r2, format: (v: number) => v.toFixed(3) },
    { key: 'mae', label: 'MAE', value: metrics.mae, format: (v: number) => v.toFixed(2) },
    { key: 'rmse', label: 'RMSE', value: metrics.rmse, format: (v: number) => v.toFixed(2) },
    { key: 'mape', label: 'MAPE', value: metrics.mape, format: (v: number) => `${v.toFixed(2)}%` },
    { key: 'median_ae', label: 'AE Mediana', value: metrics.median_ae, format: (v: number) => v.toFixed(2) },
    { key: 'max_error', label: 'Error Máximo', value: metrics.max_error, format: (v: number) => v.toFixed(0) },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-600 text-base">analytics</span>
          Métricas del Modelo
        </h3>
      </div>

      {metricsList.filter((m) => m.value !== undefined).length === 0 && (
        <div className="p-4">
          <p className="text-gray-500 text-sm">No hay métricas disponibles. Predicción simulada.</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
        {metricsList.map(
          (m) =>
            m.value !== undefined && (
              <div
                key={m.key}
                className="rounded-md border border-gray-100 bg-gray-50/40 px-3 py-2 text-center"
              >
                <p className="text-xs font-medium text-gray-500">{m.label}</p>
                <p className="text-lg font-semibold text-gray-800 mt-0.5">{m.format(m.value)}</p>
              </div>
            )
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <p className="text-[14px] text-gray-500 leading-snug">
          <strong>Nota:</strong> Un mayor R² indica un mejor ajuste. Un MAE, RMSE y MAPE más bajos implican una mayor precisión.
        </p>
      </div>
    </div>
  )
}