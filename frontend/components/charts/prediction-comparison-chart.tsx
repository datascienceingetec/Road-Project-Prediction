"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { api } from "@/lib/api"
import { getAlcanceColor } from "@/lib/chart-colors"
import { toast } from "sonner"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface PredictionComparisonChartProps {
  itemNombre: string
  itemTipoId: number
  faseId?: number
  predictedValue: number
  predictedLength: number
  presentYear?: number
}

export function PredictionComparisonChart({
  itemNombre,
  itemTipoId,
  faseId,
  predictedValue,
  predictedLength,
  presentYear = 2025,
}: PredictionComparisonChartProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [itemTipoId, faseId, presentYear])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getItemComparison(itemTipoId, faseId, presentYear)
      if (result) {
        setData(result)
      } else {
        const errorMsg = "No se pudieron cargar los datos del gráfico"
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      const errorMsg = "Error al cargar los datos del gráfico"
      setError(errorMsg)
      toast.error(errorMsg, {
        description: err instanceof Error ? err.message : "Error desconocido"
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
          <p className="text-gray-600 text-sm">Cargando comparación...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">{error || "No hay datos disponibles"}</p>
      </div>
    )
  }

  const { historical_data, trend_line, metadata } = data

  // Agrupar proyectos históricos por alcance
  const groupedByAlcance = historical_data.reduce((acc: any, p: any) => {
    const key = p.alcance || "Sin especificar"
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  // Usar el predictor específico en lugar de siempre longitud
  const predictorName = metadata.predictor_name || "Longitud (Km)"
  const isLengthPredictor = predictorName.includes("Longitud")

  // Crear una traza por alcance usando colores consistentes
  const scatterData = Object.keys(groupedByAlcance).map((alcance) => {
    const group = groupedByAlcance[alcance]
    const color = getAlcanceColor(alcance)
    
    return {
      x: group.map((p: any) => p.predictor_value || p.longitud_km),
      y: group.map((p: any) => p.costo_millones),
      mode: "markers",
      type: "scatter",
      name: alcance,
      text: group.map(
        (p: any) =>
          `<b>${p.nombre}</b><br>` +
          `Código: ${p.codigo}<br>` +
          `Año Inicio: ${p.anio_inicio}<br>` +
          `Fase: ${p.fase}<br>` +
          `Alcance: ${p.alcance}<br>` +
          `Longitud: ${p.longitud_km.toFixed(2)} km<br>` +
          `${predictorName}: ${(p.predictor_value || p.longitud_km).toFixed(2)}<br>` +
          `Costo VP: ${p.costo_millones.toFixed(2)} Millones<br>` +
          `Costo Total VP: ${p.costo_total_vp.toLocaleString("es-CO", { maximumFractionDigits: 0 })} COP`
      ),
      hovertemplate: "%{text}<extra></extra>",
      marker: {
        size: 12,
        opacity: 0.8,
        color: color,
        line: { color: "DarkSlateGrey", width: 1 },
      },
    }
  })

  // Línea de tendencia
  const trendData = trend_line
    ? {
        x: trend_line.x,
        y: trend_line.y,
        mode: "lines",
        type: "scatter",
        name: `Tendencia ${predictorName}`,
        line: { color: "red", width: 2, dash: "dash" },
        hovertemplate: `Línea de tendencia (${predictorName})<extra></extra>`,
      }
    : null

  // Punto de predicción actual - usar predictor apropiado
  const predictorValue = isLengthPredictor ? predictedLength : predictedLength // Por ahora usar longitud como fallback
  const predictedPoint = {
    x: [predictorValue],
    y: [predictedValue / 1_000_000],
    mode: "markers",
    type: "scatter",
    name: "Predicción Actual",
    text: [
      `<b>PREDICCIÓN</b><br>` +
        `Longitud: ${predictedLength.toFixed(2)} km<br>` +
        `${predictorName}: ${predictorValue.toFixed(2)}<br>` +
        `Costo Predicho: ${(predictedValue / 1_000_000).toFixed(2)} Millones<br>` +
        `Item: ${itemNombre}`,
    ],
    hovertemplate: "%{text}<extra></extra>",
    marker: {
      size: 16,
      color: "#e4002b",
      symbol: "star",
      line: { color: "white", width: 2 },
    },
  }

  const plotData = trendData
    ? [...scatterData, trendData, predictedPoint]
    : [...scatterData, predictedPoint]

  return (
    <div className="w-full h-full">
      <Plot
        data={plotData as any}
        layout={{
          title: {
            text: `<b>${itemNombre}</b><br><sub>Costo vs ${predictorName} (${metadata.present_year})</sub>`,
            font: { size: 16, family: "Arial", color: "#1a252f" },
            x: 0.5,
            xanchor: "center",
          },
          font: { family: "Arial", size: 12, color: "#2c3e50" },
          autosize: true,
          height: 500,
          xaxis: {
            title: { text: predictorName.toUpperCase(), font: { size: 13 } },
            showgrid: true,
            gridcolor: "lightgray",
            gridwidth: 0.5,
            zeroline: false,
          },
          yaxis: {
            title: { text: `Costo de ${itemNombre} (Millones COP)`, font: { size: 13 } },
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
            xanchor: "right",
            x: 0.99,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            bordercolor: "lightgray",
            borderwidth: 1,
          },
          margin: { l: 80, r: 50, t: 80, b: 80 },
          plot_bgcolor: "white",
          paper_bgcolor: "white",
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
