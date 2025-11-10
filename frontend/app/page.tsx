"use client"

import { useEffect, useState } from "react"
import { api, type Proyecto, type Fase } from "@/lib/api"
import { InteractiveProjectMap } from "@/components/geometry"
import { ProjectsTable } from "@/components/projects-table"

// Default map center (Colombia)
const DEFAULT_CENTER = { lat: 4.5709, lng: -74.2973 }
const DEFAULT_ZOOM = 6

const coordsCache = new Map<string, { lat: number; lng: number }>()

export default function HomePage() {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProjects = async () => {
    try {
      const [proyectosData, fasesData] = await Promise.all([
        api.getProyectos(),
        api.getFases(),
      ])
      setProjects(proyectosData)
      setFases(fasesData)
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
  
  const handleProjectClick = async (project: Proyecto) => {
    if (project.id === selectedProject?.id) {
      setSelectedProject(null)
      return
    }
    
    if (project.lat_inicio && project.lng_inicio) {
      setSelectedProject(project)
      return
    }

    const coords = await getCoords(project.ubicacion)
    if (coords) {
      await api.updateProyecto(project.codigo, { lat_inicio: coords.lat, lng_inicio: coords.lng })
      setSelectedProject({
        ...project,
          lat_inicio: coords.lat,
          lng_inicio: coords.lng,
        })
    }
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
        <div className="mb-8 h-[500px] rounded-lg overflow-hidden shadow-md">
          <InteractiveProjectMap
            projectCode={selectedProject?.codigo}
            center={mapCenter}
            zoom={selectedProject ? 12 : DEFAULT_ZOOM}
            className="w-full h-full"
          />
        </div>

        {/* 📋 Projects table */}
        <ProjectsTable
          proyectos={projects}
          fases={fases}
          showActions={false}
          showSearch={true}
          showFilters={true}
          showPagination={true}
          itemsPerPage={5}
          onRowClick={handleProjectClick}
          selectedProjectId={selectedProject?.id}
        />
      </main>
    </div>
  )
}
