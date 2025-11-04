"use client"

import { StatCard } from "@/components/stat-card"
import { formatCurrency, formatNumber } from "@/lib/utils"

interface StatsGridProps {
  totalProyectos: number
  inversionTotal: number
  kmTotales: number
  costoPromedioPorKm: number
}

export function StatsGrid({ totalProyectos, inversionTotal, kmTotales, costoPromedioPorKm }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-8">
      <StatCard
        title="Total Proyectos"
        value={totalProyectos.toString()}
      />
      <StatCard
        title="Causación Total"
        value={formatCurrency(inversionTotal)}
      />
      <StatCard
        title="Longitud Total"
        value={`${formatNumber(kmTotales)} km`}
      />
      <StatCard
        title="Costo Promedio/km"
        value={formatCurrency(costoPromedioPorKm)}
      />
    </div>
  )
}
