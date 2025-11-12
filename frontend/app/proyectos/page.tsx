"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api, type Proyecto, type Fase } from "@/lib/api"
import { ProjectsTable } from "@/components/projects-table"
import { toast } from "sonner"

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [proyectosData, fasesData] = await Promise.all([
      api.getProyectos(),
      api.getFases(),
    ])
    setProyectos(proyectosData)
    setFases(fasesData)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    toast("¿Está seguro de eliminar este proyecto?", {
      description: "Esta acción no se puede deshacer",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await api.deleteProyecto(id)
            toast.success("Proyecto eliminado exitosamente")
            loadData()
          } catch (error) {
            toast.error("Error al eliminar el proyecto", {
              description: error instanceof Error ? error.message : "Error desconocido"
            })
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Encabezado de página */}
        <div className="flex flex-wrap justify-between gap-4 items-center">
          <div className="flex min-w-72 flex-col gap-1">
            <p className="text-[#071d49] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              Gestión de Proyectos
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
              Administre, visualice y prediga costos de proyectos viales.
            </p>
          </div>
          <Link href="/proyectos/nuevo">
            <button className="flex items-center gap-2 rounded-lg bg-primary px-6 h-12 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined">add</span>
              Nuevo Proyecto
            </button>
          </Link>
        </div>

        {/* Tabla con búsqueda, filtros y paginación */}
        <ProjectsTable
          proyectos={proyectos}
          fases={fases}
          showActions={true}
          showSearch={true}
          showFilters={true}
          showPagination={true}
          itemsPerPage={10}
          onDelete={handleDelete}
        />
      </div>
    </main>
  )
}
