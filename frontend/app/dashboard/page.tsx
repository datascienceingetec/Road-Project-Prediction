"use client"

import { useEffect, useState } from "react"
import { api, type Proyecto } from "@/lib/api"
import { ValorPresenteChart } from "@/components/charts/valor-presente-chart"
import { CausacionKmChart } from "@/components/charts/causacion-km-chart"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

interface Estadisticas {
  totalProyectos: number
  inversionTotal: number
  kmTotales: number
  distribucionFase: Record<string, number>
  inversionPorMes: Array<{ mes: string; inversion: number }>
  proyectosRecientes: Proyecto[]
}

export default function DashboardPage() {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filtros para los gráficos
  const [selectedFase, setSelectedFase] = useState<number | undefined>(undefined)
  const [selectedAlcance, setSelectedAlcance] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [fases, setFases] = useState<any[]>([])
  const [alcances, setAlcances] = useState<any[]>([])

  useEffect(() => {
    async function cargarEstadisticas() {
      try {
        const data = await api.getEstadisticas()
        setEstadisticas(data)
      } catch (error) {
        console.error("Error cargando estadísticas:", error)
      } finally {
        setLoading(false)
      }
    }
    cargarEstadisticas()
  }, [])

  useEffect(() => {
    async function cargarOpciones() {
      try {
        const [fasesData, alcancesData] = await Promise.all([
          api.getFases(),
          api.getAlcanceOptions(),
        ])
        setFases(fasesData)
        setAlcances(alcancesData)
      } catch (error) {
        console.error("Error cargando opciones:", error)
      }
    }
    cargarOpciones()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!estadisticas) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Error cargando datos</p>
      </div>
    )
  }

  const costoPromedioPorKm = estadisticas.kmTotales > 0 ? estadisticas.inversionTotal / estadisticas.kmTotales : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen general de proyectos de infraestructura vial</p>
        </div>

        {/* Stats Grid */}
        {/* <StatsGrid
          totalProyectos={estadisticas.totalProyectos}
          inversionTotal={estadisticas.inversionTotal}
          kmTotales={estadisticas.kmTotales}
          costoPromedioPorKm={costoPromedioPorKm}
        /> */}

        {/* Charts Section */}
        {/* <DashboardCharts
          inversionPorMes={estadisticas.inversionPorMes}
          distribucionFase={estadisticas.distribucionFase}
          totalProyectos={estadisticas.totalProyectos}
        /> */}

        {/* Analytics Charts Section */}
        <div className="mb-8">
          {/* Filters Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Análisis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fase Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fase</label>
                <select
                  value={selectedFase || ""}
                  onChange={(e) => setSelectedFase(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todas las fases</option>
                  {fases.map((fase) => (
                    <option key={fase.id} value={fase.id}>
                      {fase.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alcance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alcance</label>
                <select
                  value={selectedAlcance}
                  onChange={(e) => setSelectedAlcance(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos los alcances</option>
                  {alcances.map((alcance) => (
                    <option key={alcance.value} value={alcance.value}>
                      {alcance.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año Base (Valor Presente)</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  min="2000"
                  max="2100"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            {/* Reset Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedFase(undefined)
                  setSelectedAlcance("")
                  setSelectedYear(2025)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Valor Presente Chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <ValorPresenteChart faseId={selectedFase} alcance={selectedAlcance} presentYear={selectedYear} />
            </div>

            {/* Causación por Km Chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <CausacionKmChart faseId={selectedFase} alcance={selectedAlcance} presentYear={selectedYear} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
