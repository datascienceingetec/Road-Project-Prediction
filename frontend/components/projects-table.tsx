"use client"

import { useState } from "react"
import Link from "next/link"
import { type Proyecto, type Fase } from "@/lib/api"
import { SearchBar } from "./search-bar"
import { PhaseFilters } from "./phase-filters"
import { Pagination } from "./pagination"

interface ProjectsTableProps {
  proyectos: Proyecto[]
  fases?: Fase[]
  showActions?: boolean
  showSearch?: boolean
  showFilters?: boolean
  showPagination?: boolean
  itemsPerPage?: number
  onDelete?: (id: number) => void
  onRowClick?: (proyecto: Proyecto) => void
  selectedProjectId?: number
}

export function ProjectsTable({
  proyectos,
  fases = [],
  showActions = false,
  showSearch = false,
  showFilters = false,
  showPagination = false,
  itemsPerPage = 10,
  onDelete,
  onRowClick,
  selectedProjectId,
}: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [faseFilter, setFaseFilter] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter logic
  const normalize = (str: string) =>
    str ? str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : ''

  const normalizedSearch = normalize(searchTerm)

  const filteredProyectos = proyectos.filter((p) => {
    const nombre = normalize(p.nombre)
    const codigo = normalize(p.codigo)
    const ubicacion = normalize(p.ubicacion)

    const matchesSearch = !normalizedSearch || 
      [nombre, codigo, ubicacion].some(field => field.includes(normalizedSearch))

    const matchesFase = faseFilter == null || p.fase_id === faseFilter

    return matchesSearch && matchesFase
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProyectos.length / itemsPerPage)
  const paginatedProyectos = showPagination
    ? filteredProyectos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredProyectos

  // TODO: Replace with dynamic colors
  const getFaseBadge = (faseNombre?: string) => {
    if (!faseNombre) {
      return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100"
    }
    if (faseNombre.includes("Fase III") || faseNombre.includes("III")) {
      return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-500/10 dark:text-green-400"
    }
    if (faseNombre.includes("Fase II") || faseNombre.includes("II")) {
      return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400"
    }
    if (faseNombre.includes("Fase I") || faseNombre.includes("I")) {
      return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"
    }
    return "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100"
  }

  return (
    <div className="w-full">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          {showSearch && (
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre, código o ubicación"
            />
          )}
          {showFilters && (
            <PhaseFilters
              fases={fases}
              selectedFaseId={faseFilter}
              onFilterChange={(faseId) => {
                setFaseFilter(faseId)
                setCurrentPage(1)
              }}
            />
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] shadow-sm">
        <table className="flex-1">
          <thead>
            <tr className="bg-[#071d49]">
              <th className="px-4 py-3 text-left text-white/90 text-sm font-semibold leading-normal">
                Nombre & Código
              </th>
              <th className="px-4 py-3 text-left text-white/90 text-sm font-semibold leading-normal">
                Ubicación
              </th>
              <th className="px-4 py-3 text-left text-white/90 w-48 text-sm font-semibold leading-normal">
                Fase
              </th>
              <th className="px-4 py-3 text-right text-white/90 text-sm font-semibold leading-normal">
                Unidades Funcionales
              </th>
              <th className="px-4 py-3 text-right text-white/90 text-sm font-semibold leading-normal">
                Longitud (km)
              </th>
              <th className="px-4 py-3 text-right text-white/90 text-sm font-semibold leading-normal">
                Año Inicio
              </th>
              {showActions && (
                <th className="px-4 py-3 text-left text-white/90 w-28 text-sm font-semibold leading-normal">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedProyectos.map((proyecto) => (
              <tr
                key={proyecto.id}
                className={`hover:bg-gray-50 dark:hover:bg-white/5 ${
                  onRowClick ? "cursor-pointer" : ""
                } ${selectedProjectId === proyecto.id ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}
                onClick={() => onRowClick?.(proyecto)}
              >
                <td className="h-[72px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal">
                  <Link
                    href={`/proyectos/${proyecto.codigo}`}
                    className="hover:text-primary hover:underline"
                    onClick={(e) => onRowClick && e.stopPropagation()}
                  >
                    {proyecto.nombre}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                    Código: {proyecto.codigo}
                  </p>
                </td>
                <td className="h-[72px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                  {proyecto.ubicacion}
                </td>
                <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                  <span className={getFaseBadge(proyecto.fase?.nombre)}>
                    {proyecto.fase?.nombre || "Sin fase"}
                  </span>
                </td>
                <td className="h-[72px] px-4 py-2 text-right text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                  {proyecto.num_unidades_funcionales}
                </td>
                <td className="h-[72px] px-4 py-2 text-right text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                  {proyecto.longitud.toFixed(2)}
                </td>
                <td className="h-[72px] px-4 py-2 text-right text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                  {proyecto.anio_inicio}
                </td>
                {showActions && (
                  <td className="h-[72px] px-4 py-2 text-sm font-bold leading-normal tracking-[0.015em]">
                    <div className="flex items-center gap-4">
                      <Link href={`/proyectos/${proyecto.codigo}/editar`}>
                        <button className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete?.(proyecto.id)
                        }}
                        className="text-gray-500 hover:text-accent dark:text-gray-400 dark:hover:text-accent transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
