"use client"

import { formatCurrency } from "@/lib/utils"

interface InversionPorMes {
  mes: string
  inversion: number
}

interface DistribucionFase {
  [fase: string]: number
}

interface DashboardChartsProps {
  inversionPorMes: InversionPorMes[]
  distribucionFase: DistribucionFase
  totalProyectos: number
}

export function DashboardCharts({ inversionPorMes, distribucionFase, totalProyectos }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
      {/* Causación Total Chart */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
        <div className="flex flex-col">
          <h3 className="text-gray-900 text-lg font-semibold">Causación Total</h3>
          <p className="text-gray-500 text-sm">Últimos 7 meses</p>
        </div>
        <div className="flex min-h-[280px] w-full flex-col">
          <div className="flex-1 relative">
            <svg className="w-full h-full" viewBox="0 0 700 280" preserveAspectRatio="xMidYMid meet">
              <g className="text-gray-200" stroke="currentColor" strokeWidth="1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={i} x1="60" y1={40 + i * 50} x2="680" y2={40 + i * 50} strokeDasharray="4 4" />
                ))}
              </g>

              <g className="text-gray-600 text-xs">
                {inversionPorMes.map((_, i) => {
                  const maxInversion = Math.max(...inversionPorMes.map((d) => d.inversion))
                  const value = maxInversion - (i * maxInversion) / 4
                  return (
                    <text key={i} x="50" y={45 + i * 50} textAnchor="end" fill="currentColor">
                      {formatCurrency(value).replace(/\s/g, "")}
                    </text>
                  )
                })}
              </g>

              <path
                d={inversionPorMes
                  .map((d, i) => {
                    const maxInversion = Math.max(...inversionPorMes.map((d) => d.inversion))
                    const x = 80 + (i * 560) / (inversionPorMes.length - 1)
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

              <path
                d={
                  inversionPorMes
                    .map((d, i) => {
                      const maxInversion = Math.max(...inversionPorMes.map((d) => d.inversion))
                      const x = 80 + (i * 560) / (inversionPorMes.length - 1)
                      const y = 240 - (d.inversion / maxInversion) * 200
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`
                    })
                    .join(" ") + " L 640 240 L 80 240 Z"
                }
                fill="url(#gradient)"
                opacity="0.2"
              />

              {inversionPorMes.map((d, i) => {
                const maxInversion = Math.max(...inversionPorMes.map((d) => d.inversion))
                const x = 80 + (i * 560) / (inversionPorMes.length - 1)
                const y = 240 - (d.inversion / maxInversion) * 200
                return (
                  <circle key={i} cx={x} cy={y} r="4" fill="#1D428A" stroke="white" strokeWidth="2">
                    <title>{`${d.mes}: ${formatCurrency(d.inversion)}`}</title>
                  </circle>
                )
              })}

              <g className="text-gray-600 text-sm">
                {inversionPorMes.map((d, i) => {
                  const x = 80 + (i * 560) / (inversionPorMes.length - 1)
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

      {/* Distribución por Fase Chart */}
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
              {Object.entries(distribucionFase).map(([fase, count], index) => {
                const total = Object.values(distribucionFase).reduce((a, b) => a + b, 0)
                const percentage = (count / total) * 100
                const colors = ["#1D428A", "#E4002B", "#071D49"]
                const offset =
                  Object.entries(distribucionFase)
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
              <span className="text-2xl font-bold text-gray-900">{totalProyectos}</span>
              <span className="text-sm text-gray-500">Total</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {Object.entries(distribucionFase).map(([fase, count], index) => {
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
  )
}
