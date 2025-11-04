"use client"

import { useState, useEffect } from "react"
import { type EnumOption, api } from "@/lib/api"

export interface FunctionalUnitFormData {
  numero: number
  longitud_km: number
  puentes_vehiculares_und: number
  puentes_vehiculares_mt2: number
  puentes_peatonales_und: number
  puentes_peatonales_mt2: number
  tuneles_und: number
  tuneles_km: number
  alcance: string
  zona: string
  tipo_terreno: string
}

interface FunctionalUnitFormProps {
  data: FunctionalUnitFormData
  onChange: (data: FunctionalUnitFormData) => void
  onRemove?: () => void
  showRemoveButton?: boolean
  unitNumber?: number
}

export function FunctionalUnitForm({
  data,
  onChange,
  onRemove,
  showRemoveButton = false,
  unitNumber,
}: FunctionalUnitFormProps) {
  const [alcanceOptions, setAlcanceOptions] = useState<EnumOption[]>([])
  const [zonaOptions, setZonaOptions] = useState<EnumOption[]>([])
  const [tipoTerrenoOptions, setTipoTerrenoOptions] = useState<EnumOption[]>([])

  useEffect(() => {
    const loadEnums = async () => {
      const [alcance, zona, tipoTerreno] = await Promise.all([
        api.getAlcanceOptions(),
        api.getZonaOptions(),
        api.getTipoTerrenoOptions(),
      ])
      setAlcanceOptions(alcance)
      setZonaOptions(zona)
      setTipoTerrenoOptions(tipoTerreno)
    }
    loadEnums()
  }, [])

  const handleChange = (field: keyof FunctionalUnitFormData, value: string | number) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="bg-white rounded-xl border border-[#dee2e6] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#071d49]">
          Unidad Funcional {unitNumber !== undefined ? unitNumber : data.numero}
        </h3>
        {showRemoveButton && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Eliminar unidad funcional"
          >
            <span className="material-symbols-outlined text-red-600">delete</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información básica */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Número de UF</label>
          <input
            type="number"
            value={data.numero}
            onChange={(e) => handleChange("numero", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Longitud (km)</label>
          <input
            type="number"
            step="0.1"
            value={data.longitud_km}
            onChange={(e) => handleChange("longitud_km", Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alcance</label>
          <select
            value={data.alcance}
            onChange={(e) => handleChange("alcance", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="">Seleccione...</option>
            {alcanceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
          <select
            value={data.zona}
            onChange={(e) => handleChange("zona", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="">Seleccione...</option>
            {zonaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Terreno</label>
          <select
            value={data.tipo_terreno}
            onChange={(e) => handleChange("tipo_terreno", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="">Seleccione...</option>
            {tipoTerrenoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Puentes Vehiculares */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-base font-semibold text-[#111418] mb-4">Puentes Vehiculares</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (und)</label>
            <input
              type="number"
              value={data.puentes_vehiculares_und}
              onChange={(e) => handleChange("puentes_vehiculares_und", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
            <input
              type="number"
              value={data.puentes_vehiculares_mt2}
              onChange={(e) => handleChange("puentes_vehiculares_mt2", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Puentes Peatonales */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-base font-semibold text-[#111418] mb-4">Puentes Peatonales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (und)</label>
            <input
              type="number"
              value={data.puentes_peatonales_und}
              onChange={(e) => handleChange("puentes_peatonales_und", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
            <input
              type="number"
              value={data.puentes_peatonales_mt2}
              onChange={(e) => handleChange("puentes_peatonales_mt2", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Túneles */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-base font-semibold text-[#111418] mb-4">Túneles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (und)</label>
            <input
              type="number"
              value={data.tuneles_und}
              onChange={(e) => handleChange("tuneles_und", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Longitud (km)</label>
            <input
              type="number"
              step="0.1"
              value={data.tuneles_km}
              onChange={(e) => handleChange("tuneles_km", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
