"use client"

import { type Fase } from "@/lib/api"

interface PhaseFiltersProps {
  fases: Fase[]
  selectedFaseId: number | null
  onFilterChange: (faseId: number | null) => void
}

export function PhaseFilters({ fases, selectedFaseId, onFilterChange }: PhaseFiltersProps) {
  return (
    <div className="flex gap-2 p-1 overflow-x-auto">
      <button
        onClick={() => onFilterChange(null)}
        className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-semibold ${
          selectedFaseId === null
            ? "bg-primary text-white"
            : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
        }`}
      >
        Todas
      </button>
      {fases.map((fase) => (
        <button
          key={fase.id}
          onClick={() => onFilterChange(fase.id)}
          className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-semibold ${
            selectedFaseId === fase.id
              ? "bg-primary text-white"
              : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
          }`}
        >
          {fase.nombre}
        </button>
      ))}
    </div>
  )
}
