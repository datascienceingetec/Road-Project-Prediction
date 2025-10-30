"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api, type Proyecto, type Fase } from "@/lib/api"

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [faseFilter, setFaseFilter] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const filteredProyectos = proyectos.filter((proyecto) => {
    const matchesSearch =
      proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proyecto.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFase = faseFilter === null || proyecto.fase_id === faseFilter
    return matchesSearch && matchesFase
  })

  const totalPages = Math.ceil(filteredProyectos.length / itemsPerPage)
  const paginatedProyectos = filteredProyectos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getFaseBadge = (faseNombre?: string) => {
    if (!faseNombre) return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100"
    
    if (faseNombre.includes("Fase I") || faseNombre.includes("I")) {
      return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"
    }
    if (faseNombre.includes("Fase II") || faseNombre.includes("II")) {
      return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400"
    }
    if (faseNombre.includes("Fase III") || faseNombre.includes("III")) {
      return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-500/10 dark:text-green-400"
    }
    return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100"
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de eliminar este proyecto?")) {
      await api.deleteProyecto(id)
      loadData()
    }
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

        {/* Búsqueda y Filtros */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:max-w-md">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full shadow-sm bg-white dark:bg-[#1e293b]">
                <div className="text-gray-400 flex border-none items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-200 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-transparent h-full placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  placeholder="Buscar por nombre, código o ubicación"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </label>
          </div>
          <div className="flex gap-2 p-1 overflow-x-auto">
            <button
              onClick={() => {
                setFaseFilter(null)
                setCurrentPage(1)
              }}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-semibold ${
                faseFilter === null
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
              }`}
            >
              Todas
            </button>
            {fases.map((fase) => (
              <button
                key={fase.id}
                onClick={() => {
                  setFaseFilter(fase.id)
                  setCurrentPage(1)
                }}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-semibold ${
                  faseFilter === fase.id
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
                }`}
              >
                {fase.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="w-full">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] shadow-sm">
            <table className="flex-1">
              <thead>
                <tr className="bg-[#071d49]">
                  <th className="px-4 py-3 text-left text-white/90 text-sm font-semibold leading-normal">
                    Nombre & Código
                  </th>
                  <th className="px-4 py-3 text-left text-white/90 text-sm font-semibold leading-normal">Ubicación</th>
                  <th className="px-4 py-3 text-left text-white/90 w-48 text-sm font-semibold leading-normal">Fase</th>
                  <th className="px-4 py-3 text-left text-white/90 text-sm font-semibold leading-normal">
                    Longitud (km)
                  </th>
                  <th className="px-4 py-3 text-left text-white/90 text-sm font-semibold leading-normal">Año Inicio</th>
                  <th className="px-4 py-3 text-left text-white/90 w-28 text-sm font-semibold leading-normal">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedProyectos.map((proyecto) => (
                  <tr key={proyecto.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="h-[72px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal">
                      <Link href={`/proyectos/${proyecto.codigo}`} className="hover:text-primary">
                        {proyecto.nombre}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">Código: {proyecto.codigo}</p>
                    </td>
                    <td className="h-[72px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                      {proyecto.ubicacion}
                    </td>
                    <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                      <span className={getFaseBadge(proyecto.fase?.nombre)}>{proyecto.fase?.nombre || "Sin fase"}</span>
                    </td>
                    <td className="h-[72px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                      {proyecto.longitud.toFixed(2)}
                    </td>
                    <td className="h-[72px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                      {proyecto.anio_inicio}
                    </td>
                    <td className="h-[72px] px-4 py-2 text-sm font-bold leading-normal tracking-[0.015em]">
                      <div className="flex items-center gap-4">
                        <Link href={`/proyectos/${proyecto.codigo}/editar`}>
                          <button className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(proyecto.id)}
                          className="text-gray-500 hover:text-accent dark:text-gray-400 dark:hover:text-accent transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Controles de Paginación */}
        <div className="flex items-center justify-between pt-4">
          <button
            className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] px-4 h-10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <span className="material-symbols-outlined">chevron_left</span>
            Anterior
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                  currentPage === page
                    ? "bg-primary text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {page}
              </button>
            ))}
            {totalPages > 5 && <span className="text-gray-600 dark:text-gray-400">...</span>}
          </div>
          <button
            className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] px-4 h-10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </main>
  )
}
