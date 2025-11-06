"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { api } from "@/lib/api"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface ValorPresenteChartProps {
  faseId?: number
  alcance?: string
  presentYear?: number
}

export function ValorPresenteChart({ faseId, alcance, presentYear = 2025 }: ValorPresenteChartProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [faseId, alcance, presentYear])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getValorPresenteCausacion(faseId, alcance, presentYear)
      if (result) {
        setData(result)
      } else {
        setError("No se pudieron cargar los datos")
      }
    } catch (err) {
      setError("Error al cargar los datos del gráfico")
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
          <p className="text-gray-600 text-sm">Cargando gráfico...</p>
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

  const { projects, trend_line, metadata } = data

  // Agrupar proyectos por tipo de alcance
  const groupedByAlcance = projects.reduce((acc: any, p: any) => {
    const key = p.alcance || "Sin definir"
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  // Crear una traza por alcance
  const scatterData = Object.keys(groupedByAlcance).map((alcance, i) => {
    const group = groupedByAlcance[alcance]
    return {
      x: group.map((p: any) => p.longitud_km),
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
          `N° Unidades Funcionales: ${p.unidades_funcionales}<br>` +
          `Longitud: ${p.longitud_km.toFixed(2)} km<br>` +
          `Costo VP: ${p.costo_millones.toFixed(2)} Millones<br>` +
          `Costo Total VP: ${p.costo_total_vp.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`
      ),
      hovertemplate: "%{text}<extra></extra>",
      marker: {
        size: group.map((p: any) =>
          Math.max(10, Math.min(60, Math.sqrt(p.costo_millones) * 0.8))
        ),
        line: { color: "white", width: 1.5 },
        opacity: 0.85,
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
        name: "Tendencia Lineal",
        line: { color: "#e74c3c", width: 2, dash: "dash" },
        hovertemplate: "Línea de Tendencia<extra></extra>",
      }
    : null

  const plotData = trendData ? [...scatterData, trendData] : scatterData

  return (
    <div className="w-full h-full">
      <Plot
        data={plotData as any}
        layout={{
          title: {
            text: `<b>Valor Presente de la Causación de Personal</b><br><sub>Relación entre Longitud del Proyecto y Causación Total (${metadata.present_year})</sub>`,
            font: {
              size: 18,
              color: "#1a252f",
              family: "Arial Black, Arial, sans-serif",
            },
            x: 0.5,
            xanchor: "center",
          },
          font: {
            family: "Arial, sans-serif",
            size: 12,
            color: "#2c3e50",
          },
          autosize: true,
          height: 600,
          xaxis: {
            title: {
              text: "Longitud del Proyecto (km)",
              font: { size: 14, color: "#34495e", family: "Arial" },
            },
            showgrid: true,
            gridcolor: "#ecf0f1",
            zeroline: false,
            tickfont: { size: 11 },
          },
          yaxis: {
            title: {
              text: "Valor Presente de la Causación de Personal (Millones COP)",
              font: { size: 14, color: "#34495e", family: "Arial" },
            },
            showgrid: true,
            gridcolor: "#ecf0f1",
            zeroline: false,
            tickfont: { size: 11 },
          },
          hovermode: "closest",
          showlegend: true,
          legend: {
            title: { text: "<b>Tipo de Alcance</b>", font: { size: 12 } },
            orientation: "h", // horizontal
            yanchor: "bottom",
            y: -0.25,
            xanchor: "center",
            x: 0.5,
            bgcolor: "rgba(255, 255, 255, 0.95)",
            bordercolor: "#bdc3c7",
            borderwidth: 1,
          },
          margin: { l: 80, r: 60, t: 100, b: 120 },
          plot_bgcolor: "white",
          paper_bgcolor: "white",
          colorway: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
        }}
        useResizeHandler={true}
        className="w-full"
        style={{ width: "100%" }}
      />
    </div>
  )
}