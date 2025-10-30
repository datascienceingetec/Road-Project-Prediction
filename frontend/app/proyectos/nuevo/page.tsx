"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api, type Fase, type EnumOption } from "@/lib/api"

export default function NuevoProyectoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fases, setFases] = useState<Fase[]>([])
  const [zonaOptions, setZonaOptions] = useState<EnumOption[]>([])
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    longitud: 0,
    anio_inicio: new Date().getFullYear(),
    duracion: 0,
    fase_id: 0,
    ubicacion: "",
    lat_inicio: 0,
    lng_inicio: 0,
    lat_fin: 0,
    lng_fin: 0,
  })

  useEffect(() => {
    const loadOptions = async () => {
      const [fasesData, zonaData] = await Promise.all([
        api.getFases(),
        api.getZonaOptions(),
      ])
      setFases(fasesData)
      setZonaOptions(zonaData)
      if (fasesData.length > 0) {
        setFormData(prev => ({ ...prev, fase_id: fasesData[0].id }))
      }
      if (zonaData.length > 0) {
        setFormData(prev => ({ ...prev, ubicacion: zonaData[0].value }))
      }
    }
    loadOptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const newProyecto = await api.createProyecto(formData as any)
      alert("Proyecto creado exitosamente")
      router.push(`/proyectos/${newProyecto.codigo}`)
    } catch (error) {
      console.error("[v0] Error creating project:", error)
      alert("Error al crear el proyecto")
    }

    setSaving(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/proyectos" className="hover:text-primary">
            Proyectos
          </Link>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="text-gray-900 dark:text-white">Nuevo Proyecto</span>
        </nav>

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071d49] dark:text-white mb-2">Crear Nuevo Proyecto</h1>
          <p className="text-gray-500 dark:text-gray-400">Ingrese la información del nuevo proyecto vial</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Información General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Autopista del Norte"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código *</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 6935"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fase *</label>
                <select
                  name="fase_id"
                  value={formData.fase_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccione una fase...</option>
                  {fases.map((fase) => (
                    <option key={fase.id} value={fase.id}>
                      {fase.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zona *</label>
                <select
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccione una zona...</option>
                  {zonaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Características Técnicas */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Características Técnicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitud (km) *
                </label>
                <input
                  type="number"
                  name="longitud"
                  value={formData.longitud}
                  onChange={handleChange}
                  step="0.1"
                  required
                  placeholder="0.0"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Cronograma */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cronograma</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Año de Inicio *
                </label>
                <input
                  type="number"
                  name="anio_inicio"
                  value={formData.anio_inicio}
                  onChange={handleChange}
                  required
                  min="2000"
                  max="2100"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duración (meses)
                </label>
                <input
                  type="number"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Coordenadas Geográficas */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Coordenadas Geográficas (Opcional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Punto de Inicio</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Latitud</label>
                    <input
                      type="number"
                      name="lat_inicio"
                      value={formData.lat_inicio}
                      onChange={handleChange}
                      step="0.0001"
                      placeholder="0.0000"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Longitud</label>
                    <input
                      type="number"
                      name="lng_inicio"
                      value={formData.lng_inicio}
                      onChange={handleChange}
                      step="0.0001"
                      placeholder="0.0000"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Punto Final</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Latitud</label>
                    <input
                      type="number"
                      name="lat_fin"
                      value={formData.lat_fin}
                      onChange={handleChange}
                      step="0.0001"
                      placeholder="0.0000"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Longitud</label>
                    <input
                      type="number"
                      name="lng_fin"
                      value={formData.lng_fin}
                      onChange={handleChange}
                      step="0.0001"
                      placeholder="0.0000"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <Link href="/proyectos">
              <button
                type="button"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">add</span>
                  Crear Proyecto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
