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

  // Prepare scatter plot data - matching notebook style
  const scatterData = {
    x: projects.map((p: any) => p.longitud_km),
    y: projects.map((p: any) => p.costo_millones),
    mode: "markers",
    type: "scatter",
    name: projects.map((p: any) => p.codigo),
    text: projects.map(
      (p: any) =>
        `<b>${p.nombre}</b><br>` +
        `Código: ${p.codigo}<br>` +
        `Año Inicio: ${p.anio_inicio}<br>` +
        `Fase: ${p.fase}<br>` +
        `Alcance: ${p.alcance || 'N/A'}<br>` +
        `N° Unidades Funcionales: ${p.unidades_funcionales}<br>` +
        `Longitud: ${p.longitud_km.toFixed(2)} km<br>` +
        `Costo VP: ${p.costo_millones.toFixed(2)} Millones<br>` +
        `Costo Total VP: ${p.costo_total_vp.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`
    ),
    hovertemplate: "%{text}<extra></extra>",
    marker: {
      size: projects.map((p: any) => Math.max(8, Math.min(40, p.costo_millones / 50))),
      color: projects.map((p: any, i: number) => {
        // Use Set2 color palette from Plotly
        const colors = ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3']
        return colors[i % colors.length]
      }),
      line: {
        color: "white",
        width: 1.5,
      },
      opacity: 0.85,
      sizemin: 8,
    },
  }

  // Prepare trend line data
  const trendData = trend_line
    ? {
        x: trend_line.x,
        y: trend_line.y,
        mode: "lines",
        type: "scatter",
        name: "Tendencia Lineal",
        line: {
          color: "#e74c3c",
          width: 2,
          dash: "dash",
        },
        hovertemplate: "Línea de Tendencia<extra></extra>",
      }
    : null

  const plotData = trendData ? [scatterData, trendData] : [scatterData]

  return (
    <div className="w-full h-full">
      <Plot
        data={plotData as any}
        layout={{
          title: {
            text: "<b>Valor Presente de la Causación de Personal en Proyectos Viales</b><br><sub>Relación entre Longitud del Proyecto y Causación Total</sub>",
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
              font: {
                size: 14,
                color: "#34495e",
                family: "Arial",
              },
            },
            showgrid: true,
            gridcolor: "#ecf0f1",
            zeroline: false,
            tickfont: {
              size: 11,
            },
          },
          yaxis: {
            title: {
              text: "Valor Presente de la Causación de Personal (Millones COP)",
              font: {
                size: 14,
                color: "#34495e",
                family: "Arial",
              },
            },
            showgrid: true,
            gridcolor: "#ecf0f1",
            zeroline: false,
            tickfont: {
              size: 11,
            },
          },
          hovermode: "closest",
          showlegend: true,
          legend: {
            title: {
              text: "<b>Código Proyecto</b>",
              font: {
                size: 12,
              },
            },
            orientation: "v",
            yanchor: "top",
            y: 1,
            xanchor: "left",
            x: 1.02,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            bordercolor: "#bdc3c7",
            borderwidth: 1,
          },
          margin: { l: 80, r: 200, t: 100, b: 80 },
          plot_bgcolor: "white",
          paper_bgcolor: "white",
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
