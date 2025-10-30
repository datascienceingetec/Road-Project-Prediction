"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type UnidadFuncional, type EnumOption, api } from "@/lib/api"

interface EditFunctionalUnitModalProps {
  unidad: UnidadFuncional | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  codigoProyecto: string
}

export function EditFunctionalUnitModal({
  unidad,
  isOpen,
  onClose,
  onSave,
  codigoProyecto,
}: EditFunctionalUnitModalProps) {
  const [formData, setFormData] = useState<Partial<UnidadFuncional>>({})
  const [loading, setLoading] = useState(false)
  const [alcanceOptions, setAlcanceOptions] = useState<EnumOption[]>([])
  const [zonaOptions, setZonaOptions] = useState<EnumOption[]>([])
  const [tipoTerrenoOptions, setTipoTerrenoOptions] = useState<EnumOption[]>([])

  useEffect(() => {
    // Load enum options
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

  useEffect(() => {
    if (unidad) {
      setFormData(unidad)
    } else {
      setFormData({
        proyecto_id: 0,
        numero: 1,
        longitud_km: 0,
        puentes_vehiculares_und: 0,
        puentes_vehiculares_mt2: 0,
        puentes_peatonales_und: 0,
        puentes_peatonales_mt2: 0,
        tuneles_und: 0,
        tuneles_km: 0,
        alcance: alcanceOptions[0]?.value || "",
        zona: zonaOptions[0]?.value || "",
        tipo_terreno: tipoTerrenoOptions[0]?.value || "",
      })
    }
  }, [unidad, codigoProyecto, alcanceOptions, zonaOptions, tipoTerrenoOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (unidad) {
        // Actualizar (por ahora solo creamos nuevas)
        await api.createUnidadFuncional(codigoProyecto, formData as Omit<UnidadFuncional, "id" | "proyecto_id">)
      } else {
        // Crear nueva
        await api.createUnidadFuncional(codigoProyecto, formData as Omit<UnidadFuncional, "id" | "proyecto_id">)
      }
      onSave()
      onClose()
    } catch (error) {
      console.error("Error al guardar unidad funcional:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#111418]">
            {unidad ? "Editar Unidad Funcional" : "Nueva Unidad Funcional"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Cerrar">
            <span className="material-symbols-outlined text-gray-600">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número de Unidad Funcional</label>
              <input
                type="number"
                value={formData.numero || ""}
                onChange={(e) => setFormData({ ...formData, numero: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitud (km)</label>
              <input
                type="number"
                step="0.1"
                value={formData.longitud_km || ""}
                onChange={(e) => setFormData({ ...formData, longitud_km: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alcance</label>
              <select
                value={formData.alcance || ""}
                onChange={(e) => setFormData({ ...formData, alcance: e.target.value })}
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
                value={formData.zona || ""}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
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
                value={formData.tipo_terreno || ""}
                onChange={(e) => setFormData({ ...formData, tipo_terreno: e.target.value })}
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

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-[#111418] mb-4">Puentes Vehiculares</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (und)</label>
                <input
                  type="number"
                  value={formData.puentes_vehiculares_und || 0}
                  onChange={(e) => setFormData({ ...formData, puentes_vehiculares_und: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
                <input
                  type="number"
                  value={formData.puentes_vehiculares_mt2 || 0}
                  onChange={(e) => setFormData({ ...formData, puentes_vehiculares_mt2: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-[#111418] mb-4">Puentes Peatonales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (und)</label>
                <input
                  type="number"
                  value={formData.puentes_peatonales_und || 0}
                  onChange={(e) => setFormData({ ...formData, puentes_peatonales_und: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
                <input
                  type="number"
                  value={formData.puentes_peatonales_mt2 || 0}
                  onChange={(e) => setFormData({ ...formData, puentes_peatonales_mt2: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-[#111418] mb-4">Túneles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (und)</label>
                <input
                  type="number"
                  value={formData.tuneles_und || 0}
                  onChange={(e) => setFormData({ ...formData, tuneles_und: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitud (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.tuneles_km || 0}
                  onChange={(e) => setFormData({ ...formData, tuneles_km: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
