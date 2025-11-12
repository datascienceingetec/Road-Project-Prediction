"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { api } from "@/lib/api"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface PredictionRealVsPredictedChartProps {
  itemNombre: string
  itemTipoId: number
  faseId: number
  alcance?: string
}

interface RealVsPredictedPoint {
  codigo: string
  proyecto: string
  alcance: string
  longitud_km: number
  valor_real: number
  valor_predicho: number
}

interface RealVsPredictedResponse {
  points: RealVsPredictedPoint[]
  ideal_line: { x: number[]; y: number[] } | null
  summary: {
    count: number
    mae: number | null
    rmse: number | null
    r2: number | null
  }
  metadata: Record<string, any>
}

export function PredictionRealVsPredictedChart({
  itemNombre,
  itemTipoId,
  faseId,
  alcance,
}: PredictionRealVsPredictedChartProps) {
  const [data, setData] = useState<RealVsPredictedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await api.getItemRealVsPredicted(itemTipoId, faseId, alcance)
        setData(result)
      } catch (err) {
        console.error(err)
        setError("Error al cargar el gráfico de valor real vs predicho")
      } finally {
        setLoading(false)
      }
    }

    if (itemTipoId && faseId) {
      loadData()
    }
  }, [itemTipoId, faseId, alcance])

  const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"]

  const chartData = useMemo(() => {
    if (!data || !data.points) return null

    const points = data.points
    if (points.length === 0) return null

    const metadata = data.metadata || {}
    const predictorName = metadata.predictor_name || "LONGITUD KM"

    const categories = Array.from(new Set(points.map((p) => p.alcance || "Sin especificar"))).sort((a, b) =>
      a.localeCompare(b, "es")
    )

    const traces = categories.map((category) => {
      const filtered = points.filter((point) => (point.alcance || "Sin especificar") === category)
      const customdata = filtered.map((point) => [
        category,
        point.codigo || "N/A",
        point.proyecto || "Proyecto sin nombre",
        point.longitud_km ?? 0,
        point.valor_real ?? 0,
        point.valor_predicho ?? 0,
      ])

      return {
        x: filtered.map((point) => point.valor_real ?? 0),
        y: filtered.map((point) => point.valor_predicho ?? 0),
        mode: "markers",
        type: "scatter",
        name: category,
        marker: {
          size: 12,
          opacity: 0.8,
          line: { color: "white", width: 1 },
        },
        customdata,
        hovertemplate:
          `<b>${itemNombre}</b><br>` +
          `<b>Alcance:</b> %{customdata[0]}<br>` +
          `<b>Código:</b> %{customdata[1]}<br>` +
          `<b>Proyecto:</b> %{customdata[2]}<br>` +
          `<b>${predictorName}:</b> %{customdata[3]:,.2f}<br>` +
          `<b>Valor Real:</b> COP %{customdata[4]:,.0f}<br>` +
          `<b>Predicción:</b> COP %{customdata[5]:,.0f}<extra></extra>`,
      }
    })

    const allValues = points.flatMap((point) => [point.valor_real ?? 0, point.valor_predicho ?? 0])
    const minValue = Math.min(...allValues)
    const maxValue = Math.max(...allValues)

    const lineTrace =
      data.ideal_line && data.ideal_line.x && data.ideal_line.y
        ? {
            x: [minValue, maxValue],
            y: [minValue, maxValue],
            mode: "lines",
            type: "scatter",
            name: "Predicción Perfecta",
            line: { color: "#e4002b", width: 2, dash: "dash" },
            hoverinfo: "skip",
          }
        : null

    return lineTrace ? [...traces, lineTrace] : traces
  }, [data, itemNombre])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
          <p className="text-gray-600 text-sm">Cargando histórico real vs predicho...</p>
        </div>
      </div>
    )
  }

  if (error || !data || !chartData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">{error || "No hay datos históricos disponibles"}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
    <Plot
        data={chartData as any}
        layout={{
        title: {
            text: `<b>Valor Real vs Predicción - ${itemNombre}</b>`,
            font: { size: 16, family: "Arial", color: "#1a252f" },
            x: 0.5,
            xanchor: "center",
        },
        font: { family: "Arial", size: 12, color: "#2c3e50" },
        autosize: true,
        height: 600,
        xaxis: {
            title: { text: "<b>Valor Real (COP)</b>", font: { size: 14 } },
            showgrid: true,
            gridcolor: "lightgray",
            gridwidth: 0.5,
            zeroline: false,
        },
        yaxis: {
            title: { text: "<b>Valor Predicho (COP)</b>", font: { size: 14 } },
            showgrid: true,
            gridcolor: "lightgray",
            gridwidth: 0.5,
            zeroline: false,
        },
        hovermode: "closest",
        showlegend: true,
        legend: {
            orientation: "v",
            yanchor: "top",
            y: 0.99,
            xanchor: "left",
            x: 0.01,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            bordercolor: "lightgray",
            borderwidth: 1,
        },
        margin: { l: 80, r: 40, t: 80, b: 80 },
        plot_bgcolor: "white",
        paper_bgcolor: "white",
        colorway: colors,
        }}
        config={{
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
        }}
        useResizeHandler
        style={{ width: "100%" }}
    />
    </div>
  )
}

