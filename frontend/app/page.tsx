"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { api, formatCurrency, formatNumber, type Proyecto } from "@/lib/api"
import { GoogleMap } from "@/components/google-map"

// Default map center (Colombia)
const DEFAULT_CENTER = { lat: 4.5709, lng: -74.2973 }
const DEFAULT_ZOOM = 6

const coordsCache = new Map<string, { lat: number; lng: number }>()

export default function DashboardPage() {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProjects = async () => {
    try {
      const data = await api.getProyectos()
      setProjects(data)
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function getCoords(searchTerm: string) {
    const key = searchTerm.trim().toLowerCase()
  
    if (coordsCache.has(key)) {
      console.log("✅ Using cached coordinates for:", key)
      return coordsCache.get(key)!
    }
  
    console.log("🌍 Fetching coordinates from internal API for:", key)
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchTerm)}`)
    if (!res.ok) {
      console.warn("Geocode API error:", res.status)
      return null
    }
  
    const data = await res.json()
    if (data.lat && data.lng) {
      coordsCache.set(key, data)
      return data
    }
  
    console.warn("No location found for:", searchTerm)
    return null
  }
  
  const handleProjectClick = (project: Proyecto) => {
    if (project.id === selectedProject?.id) {
      setSelectedProject(null)
      return
    }
    
    if (project.lat_inicio && project.lng_inicio) {
      setSelectedProject(project)
      return
    }

    getCoords(project.ubicacion).then((coords) => {
      if (coords) {
        setSelectedProject({
          ...project,
          lat_inicio: coords.lat,
          lng_inicio: coords.lng,
        })
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  const mapCenter =
    selectedProject?.lat_inicio && selectedProject?.lng_inicio
      ? { lat: selectedProject.lat_inicio, lng: selectedProject.lng_inicio }
      : DEFAULT_CENTER

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proyectos Viales
          </h1>
          <p className="text-gray-600">
            Seleccione un proyecto para ver su ubicación en el mapa
          </p>
        </div>

        {/* 🗺️ Map */}
        <div className="mb-8 h-96 rounded-lg overflow-hidden shadow-md">
          <GoogleMap
            center={mapCenter}
            zoom={selectedProject ? 12 : DEFAULT_ZOOM}
            className="w-full h-full"
            markers={
              selectedProject?.lat_inicio && selectedProject?.lng_inicio
                ? [
                    {
                      lat: selectedProject.lat_inicio,
                      lng: selectedProject.lng_inicio,
                      title: selectedProject.nombre,
                      color: "accent",
                    },
                  ]
                : []
            }
          />
        </div>

        {/* 📋 Projects table */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900 text-lg font-semibold">Proyectos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700">Código</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Fase</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Longitud</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedProject?.id === project.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleProjectClick(project)}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/proyectos/${project.codigo}`}
                        className="font-medium text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.codigo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {project.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          project.fase?.nombre?.includes("Fase I")
                            ? "bg-yellow-100 text-yellow-800"
                            : project.fase?.nombre?.includes("Fase II")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {project.fase?.nombre || "Sin fase"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatNumber(project.longitud)} km
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {project.ubicacion || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
