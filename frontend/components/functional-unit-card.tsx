"use client"

import type { UnidadFuncional } from "@/lib/api"

interface FunctionalUnitCardProps {
  unidad: UnidadFuncional
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
}

export function FunctionalUnitCard({
  unidad,
  isSelected,
  onClick,
  onEdit,
}: FunctionalUnitCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 transition-all cursor-pointer border shadow-sm
        ${
          isSelected
            ? "border-l-4"
            : "border"
        }`}
      style={{
        borderColor: isSelected ? "#E4002B" : "#DEE2E6",
        backgroundColor: isSelected ? "rgba(228,0,43,0.08)" : "#F8F9FA",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <h3
            className="font-bold text-base"
            style={{
              color: isSelected ? "#E4002B" : "#1D428A",
            }}
          >
            UF-{String(unidad.numero).padStart(2, "0")}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {unidad.alcance.trim()}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex items-center gap-1 text-gray-500 hover:text-[#1D428A] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-gray-500">Longitud</p>
          <p className="font-semibold">{unidad.longitud_km.toFixed(1)} km</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Tipo Terreno</p>
          <p className="font-semibold">{unidad.tipo_terreno}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Zona</p>
          <p className="font-semibold">{unidad.zona}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Puentes Vehic.</p>
          <p className="font-semibold">
            {unidad.puentes_vehiculares_und} und /{" "}
            {unidad.puentes_vehiculares_mt2.toLocaleString()} m²
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Puentes Peaton.</p>
          <p className="font-semibold">
            {unidad.puentes_peatonales_und} und /{" "}
            {unidad.puentes_peatonales_mt2.toLocaleString()} m²
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Túneles</p>
          <p className="font-semibold">
            {unidad.tuneles_und} und / {unidad.tuneles_km.toFixed(1)} km
          </p>
        </div>
      </div>
    </div>
  )
}
