"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { api } from "@/lib/api"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface CausacionKmChartProps {
  faseId?: number
  alcance?: string
  presentYear?: number
}

export function CausacionKmChart({ faseId, alcance, presentYear = 2025 }: CausacionKmChartProps) {
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
      const result = await api.getCausacionPorKm(faseId, alcance, presentYear)
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

  const { heatmap_data, categories, alcances, metadata } = data

  const zMatrix = categories.map((category: string) => {
    const row = heatmap_data.find((r: any) => r.category === category)
    return alcances.map((alcance: string) => row?.[alcance] || null)
  })

  const hoverText = categories.map((category: string, i: number) => {
    return alcances.map((alcance: string, j: number) => {
      const value = zMatrix[i][j]
      if (value === null) return "Sin datos"
      return `${category}<br>Alcance: ${alcance}<br>Costo promedio: $${value.toFixed(2)}M/km`
    })
  })

  const buildAnnotations = (
    z: (number | null)[][],
    xs: string[],
    ys: string[],
    fmt = (v: number) => v.toFixed(1)
  ) => {
    const anns: any[] = []
    const vals = z.flat().filter((v): v is number => v !== null).sort((a, b) => a - b)
    const idx = Math.floor(vals.length * 0.8)
    const threshold = vals.length ? vals[idx] : 0

    for (let i = 0; i < ys.length; i++) {
      for (let j = 0; j < xs.length; j++) {
        const v = z[i][j]
        if (v === null) continue
        anns.push({
          xref: "x1",
          yref: "y1",
          x: xs[j],
          y: ys[i],
          text: fmt(v),
          showarrow: false,
          font: {
            family: "Arial, sans-serif",
            size: 11,
            color: v >= threshold ? "white" : "black",
          },
        })
      }
    }
    return anns
  }

  const annotations = buildAnnotations(zMatrix, alcances, categories)

  const heatmapData = {
    z: zMatrix,
    x: alcances,
    y: categories,
    type: "heatmap",
    colorscale: "YlOrRd",
    reversescale: true,
    hovertemplate: "%{text}<extra></extra>",
    text: hoverText,
    showscale: true,
    colorbar: {
      title: {
        text: "Causación promedio por KM<br>(Millones COP)",
        side: "right",
      },
      titleside: "right",
    },
  }

  return (
    <div className="w-full">
      <Plot
        data={[heatmapData as any]}
        layout={{
          title: {
            text: "<b>Causación promedio por kilometro según alcance e item (INVÍAS)</b>",
            font: {
              size: 16,
              family: "Arial, sans-serif",
            },
            pad: {
              t: 20,
            },
          },
          font: {
            family: "Arial, sans-serif",
            size: 12,
          },
          autosize: true,
          height: Math.max(600, categories.length * 50),
          xaxis: {
            title: {
              text: "<b>Tipos de alcance</b>",
              font: {
                size: 12,
              },
            },
            side: "bottom",
            tickangle: 0,
            automargin: true,
          },
          yaxis: {
            title: {
              text: "<b>Item (INVÍAS)</b>",
              font: {
                size: 12,
              },
            },
            automargin: true,
            autorange: "reversed",
          },
          margin: { l: 200, r: 150, t: 80, b: 100 },
          plot_bgcolor: "#FFFFFF",
          paper_bgcolor: "#FFFFFF",
          annotations,
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
