"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type UnidadFuncional, type EnumOption, type FunctionalUnitFormData, api } from "@/lib/api"
import { Upload, MapPin } from "lucide-react"
import { toast } from "sonner"

interface EditFunctionalUnitModalProps {
  unidad: UnidadFuncional | FunctionalUnitFormData | null
  isOpen: boolean
  onClose: () => void
  onSave: (data?: any) => void
  onDeleteGeometry?: () => void
  proyectoId?: number
}

export function EditFunctionalUnitModal({
  unidad,
  isOpen,
  onClose,
  onSave,
  onDeleteGeometry,
  proyectoId,
}: EditFunctionalUnitModalProps) {
  const [formData, setFormData] = useState<Partial<UnidadFuncional>>({})
  const [loading, setLoading] = useState(false)
  const [alcanceOptions, setAlcanceOptions] = useState<EnumOption[]>([])
  const [zonaOptions, setZonaOptions] = useState<EnumOption[]>([])
  const [tipoTerrenoOptions, setTipoTerrenoOptions] = useState<EnumOption[]>([])
  const [hasGeometry, setHasGeometry] = useState(false)
  const [uploadingGeometry, setUploadingGeometry] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [geometryChanged, setGeometryChanged] = useState(false)

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

  const checkGeometry = async (ufId: number) => {
    try {
      await api.getUFGeometry(ufId)
      setHasGeometry(true)
    } catch {
      setHasGeometry(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setGeometryChanged(true)
    }
  }

  const uploadGeometry = async (ufId: number) => {
    if (!selectedFile) return

    setUploadingGeometry(true)

    try {
      await api.uploadUFGeometry(ufId, selectedFile)
      setHasGeometry(true)
      setGeometryChanged(false)
      setSelectedFile(null)
      return true
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'No se pudo cargar la geometría'}`)
      return false
    } finally {
      setUploadingGeometry(false)
    }
  }

  const deleteGeometry = async (ufId: number) => {
    toast("¿Estás seguro de eliminar la geometría de esta unidad funcional?", {
      description: "Esta acción no se puede deshacer",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await api.deleteUFGeometry(ufId)
            setHasGeometry(false)
            toast.success('Geometría eliminada exitosamente')
            onDeleteGeometry?.()
          } catch (error) {
            toast.error(`Error: ${error instanceof Error ? error.message : 'No se pudo eliminar la geometría'}`)
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    })
  }

  useEffect(() => {
    if (unidad) {
      setFormData(unidad)
      // Check if this UF has geometry
      if ('id' in unidad && unidad.id) {
        checkGeometry(unidad.id)
      }
    } else {
      const baseData = {
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
      }
      setFormData(proyectoId !== undefined ? { ...baseData, proyecto_id: proyectoId } : baseData)
    }
  }, [unidad, proyectoId, alcanceOptions, zonaOptions, tipoTerrenoOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Si tiene proyectoId, es para guardar en BD
      if (proyectoId !== undefined) {
        let ufId: number | undefined
        
        if (unidad && 'id' in unidad) {
          await api.updateUnidadFuncional(unidad.id, formData as Partial<UnidadFuncional>)
          ufId = unidad.id
        } else {
          const newUf = await api.createUnidadFuncional(formData as Omit<UnidadFuncional, "id">)
          ufId = newUf.id
        }
        
        // Upload geometry if file was selected
        if (geometryChanged && selectedFile && ufId) {
          await uploadGeometry(ufId)
        }
        
        onSave()
      } else {
        // Si no tiene proyectoId, solo retorna los datos (para predicción)
        onSave(formData)
      }
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

            {unidad && 'id' in unidad && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geometría</label>
                <input
                  type="file"
                  id="geometry-upload"
                  accept=".kml,.geojson,.json,.shp,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadingGeometry}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('geometry-upload')?.click()}
                    disabled={uploadingGeometry}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {selectedFile ? selectedFile.name : (hasGeometry ? 'Cambiar' : 'Seleccionar')}
                  </button>
                  {hasGeometry && (
                    <button
                      type="button"
                      onClick={() => deleteGeometry((unidad as any).id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedFile ? (
                    <span className="text-blue-600">Archivo seleccionado. Se cargará al guardar.</span>
                  ) : (
                    'Formatos: KML, GeoJSON, Shapefile (ZIP)'
                  )}
                </p>
              </div>
            )}

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
