"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { api, formatCurrency, formatNumber, type Proyecto } from "@/lib/api"
import { StatCard } from "@/components/stat-card"

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

  useEffect(() => {
    async function cargarEstadisticas() {
      try {
        const data = await api.getEstadisticas()
        setEstadisticas(data)
      } catch (error) {
        console.error("[v0] Error cargando estadísticas:", error)
      } finally {
        setLoading(false)
      }
    }
    cargarEstadisticas()
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <StatCard
            title="Total Proyectos"
            value={estadisticas.totalProyectos.toString()}
            icon="folder"
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Inversión Total"
            value={formatCurrency(estadisticas.inversionTotal)}
            icon="payments"
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <StatCard
            title="Longitud Total"
            value={`${formatNumber(estadisticas.kmTotales)} km`}
            icon="route"
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
          <StatCard
            title="Costo Promedio/km"
            value={formatCurrency(costoPromedioPorKm)}
            icon="analytics"
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Line Chart - Inversión Acumulada */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
            <div className="flex flex-col">
              <h3 className="text-gray-900 text-lg font-semibold">Inversión Acumulada</h3>
              <p className="text-gray-500 text-sm">Últimos 7 meses</p>
            </div>
            <div className="flex min-h-[280px] w-full flex-col">
              <div className="flex-1 relative">
                <svg className="w-full h-full" viewBox="0 0 700 280" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  <g className="text-gray-200" stroke="currentColor" strokeWidth="1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line key={i} x1="60" y1={40 + i * 50} x2="680" y2={40 + i * 50} strokeDasharray="4 4" />
                    ))}
                  </g>

                  {/* Y-axis labels */}
                  <g className="text-gray-600 text-xs">
                    {estadisticas.inversionPorMes.map((_, i) => {
                      const maxInversion = Math.max(...estadisticas.inversionPorMes.map((d) => d.inversion))
                      const value = maxInversion - (i * maxInversion) / 4
                      return (
                        <text key={i} x="50" y={45 + i * 50} textAnchor="end" fill="currentColor">
                          {formatCurrency(value).replace(/\s/g, "")}
                        </text>
                      )
                    })}
                  </g>

                  {/* Line path */}
                  <path
                    d={estadisticas.inversionPorMes
                      .map((d, i) => {
                        const maxInversion = Math.max(...estadisticas.inversionPorMes.map((d) => d.inversion))
                        const x = 80 + (i * 560) / (estadisticas.inversionPorMes.length - 1)
                        const y = 240 - (d.inversion / maxInversion) * 200
                        return `${i === 0 ? "M" : "L"} ${x} ${y}`
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#1D428A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Area fill */}
                  <path
                    d={
                      estadisticas.inversionPorMes
                        .map((d, i) => {
                          const maxInversion = Math.max(...estadisticas.inversionPorMes.map((d) => d.inversion))
                          const x = 80 + (i * 560) / (estadisticas.inversionPorMes.length - 1)
                          const y = 240 - (d.inversion / maxInversion) * 200
                          return `${i === 0 ? "M" : "L"} ${x} ${y}`
                        })
                        .join(" ") + " L 640 240 L 80 240 Z"
                    }
                    fill="url(#gradient)"
                    opacity="0.2"
                  />

                  {/* Data points */}
                  {estadisticas.inversionPorMes.map((d, i) => {
                    const maxInversion = Math.max(...estadisticas.inversionPorMes.map((d) => d.inversion))
                    const x = 80 + (i * 560) / (estadisticas.inversionPorMes.length - 1)
                    const y = 240 - (d.inversion / maxInversion) * 200
                    return (
                      <circle key={i} cx={x} cy={y} r="4" fill="#1D428A" stroke="white" strokeWidth="2">
                        <title>{`${d.mes}: ${formatCurrency(d.inversion)}`}</title>
                      </circle>
                    )
                  })}

                  {/* X-axis labels */}
                  <g className="text-gray-600 text-sm">
                    {estadisticas.inversionPorMes.map((d, i) => {
                      const x = 80 + (i * 560) / (estadisticas.inversionPorMes.length - 1)
                      return (
                        <text key={i} x={x} y="265" textAnchor="middle" fill="currentColor">
                          {d.mes}
                        </text>
                      )
                    })}
                  </g>

                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D428A" />
                      <stop offset="100%" stopColor="#1D428A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Donut Chart - Distribución por Fase */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-gray-900 text-lg font-semibold">Distribución por Fase</h3>
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="stroke-current text-gray-200"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="15.9155"
                    strokeWidth="3"
                  />
                  {Object.entries(estadisticas.distribucionFase).map(([fase, count], index) => {
                    const total = Object.values(estadisticas.distribucionFase).reduce((a, b) => a + b, 0)
                    const percentage = (count / total) * 100
                    const colors = ["#1D428A", "#E4002B", "#071D49"]
                    const offset =
                      Object.entries(estadisticas.distribucionFase)
                        .slice(0, index)
                        .reduce((acc, [, c]) => acc + (c / total) * 100, 0) * -1
                    return (
                      <circle
                        key={fase}
                        className="stroke-current"
                        style={{ color: colors[index % colors.length] }}
                        cx="18"
                        cy="18"
                        fill="none"
                        r="15.9155"
                        strokeDasharray={`${percentage}, 100`}
                        strokeDashoffset={offset}
                        strokeWidth="3.5"
                      >
                        <title>{`${fase}: ${count}`}</title>
                      </circle>
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{estadisticas.totalProyectos}</span>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              {Object.entries(estadisticas.distribucionFase).map(([fase, count], index) => {
                const colors = ["bg-primary", "bg-accent", "bg-primary-dark"]
                return (
                  <div key={fase} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-full ${colors[index % colors.length]}`} />
                      <span className="text-gray-700">{fase}</span>
                    </div>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Projects Table */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900 text-lg font-semibold">Proyectos Recientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700">Código</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Fase</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Longitud</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Costo</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Año</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estadisticas.proyectosRecientes.map((proyecto) => (
                  <tr key={proyecto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/proyectos/${proyecto.codigo}`} className="font-medium text-primary hover:underline">
                        {proyecto.codigo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{proyecto.nombre}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          proyecto.fase.includes("Fase I")
                            ? "bg-yellow-100 text-yellow-800"
                            : proyecto.fase.includes("Fase II")
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {proyecto.fase}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatNumber(proyecto.longitud)} km</td>
                    <td className="px-6 py-4 text-gray-600">{formatCurrency(proyecto.costo)}</td>
                    <td className="px-6 py-4 text-gray-600">{proyecto.anio_inicio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <Link href="/proyectos" className="text-sm text-primary hover:underline font-medium">
              Ver todos los proyectos →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
