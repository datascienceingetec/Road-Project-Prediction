"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { api, type Proyecto, type UnidadFuncional, type CostoItem } from "@/lib/api"
import { FunctionalUnitCard } from "@/components/functional-unit-card"
import { InteractiveProjectMap, GeometryUploadModal } from "@/components/geometry"
import { EditFunctionalUnitModal } from "@/components/edit-functional-unit-modal"
import { EditCostosModal } from "@/components/edit-costos-modal"
import { Upload } from "lucide-react"
import { toast } from "sonner"

export default function ProjectDetailPage() {
  const params = useParams()
  const codigo = params.codigo as string
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [unidades, setUnidades] = useState<UnidadFuncional[]>([])
  const [faseItems, setFaseItems] = useState<CostoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"unidades" | "costos">("unidades")
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(null)
  const [editingUnit, setEditingUnit] = useState<UnidadFuncional | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCostosModalOpen, setIsCostosModalOpen] = useState(false)
  const [isGeometryModalOpen, setIsGeometryModalOpen] = useState(false)
  const [mapRefreshKey, setMapRefreshKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [codigo])

  const loadData = async () => {
    setLoading(true)
    const proyectoData = await api.getProyecto(codigo)
    setProyecto(proyectoData)

    if (proyectoData) {
      const unidadesData = await api.getUnidadesFuncionales(codigo)
      setUnidades(unidadesData)

      if (proyectoData.fase_id) {
        const faseItemsConCostos = await api.getCostos(codigo)
        setFaseItems(faseItemsConCostos)
      }


    }

    setLoading(false)
  }

  const handleEditUnit = (unidad: UnidadFuncional) => {
    setEditingUnit(unidad)
    setIsModalOpen(true)
  }

  const handleDeleteUnit = (unidad: UnidadFuncional) => {
    toast("¿Está seguro de eliminar esta unidad funcional?", {
      description: "Esta acción no se puede deshacer",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await api.deleteUnidadFuncional(unidad.id)
            toast.success("Unidad funcional eliminada exitosamente")
            loadData()
          } catch (error) {
            toast.error("Error al eliminar la unidad funcional", {
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

  const handleSaveUnit = () => {
    loadData()
  }

  const handleDeleteUnitGeometry = () => {
    setMapRefreshKey(prev => prev + 1)
  }

  const handleGeometryUploadSuccess = () => {
    setMapRefreshKey(prev => prev + 1)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Proyecto no encontrado</h2>
          <p className="text-gray-500">El proyecto que busca no existe.</p>
          <Link href="/proyectos">
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Volver a Proyectos</button>
          </Link>
        </div>
      </div>
    )
  }

  // Get selected unit ID for map highlighting
  const selectedUnitId = selectedUnitIndex !== null ? unidades[selectedUnitIndex]?.id : null

  return (
    <main className="flex-grow p-6 lg:p-10 space-y-6">
      {/* Breadcrumbs & Encabezado */}
      <section>
        <div className="flex flex-wrap gap-2 mb-4">
          <Link className="text-gray-500 text-sm font-medium leading-normal hover:text-primary" href="/">
            Inicio
          </Link>
          <span className="text-gray-500 text-sm font-medium leading-normal">/</span>
          <Link className="text-gray-500 text-sm font-medium leading-normal hover:text-primary" href="/proyectos">
            Proyectos
          </Link>
          <span className="text-gray-500 text-sm font-medium leading-normal">/</span>
          <span className="text-[#111418] text-sm font-medium leading-normal">{proyecto.nombre}</span>
        </div>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex min-w-72 flex-col gap-2">
            <p className="text-[#111418] text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
              {proyecto.nombre}
            </p>
            <p className="text-gray-500 text-base font-normal leading-normal">
              Código: {proyecto.codigo} | {proyecto.ubicacion}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-start pt-2">
            <button 
              onClick={() => setIsGeometryModalOpen(true)}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f8f9fa] border border-[#dee2e6] text-[#111418] text-sm font-bold leading-normal hover:bg-gray-100 transition-colors gap-2">
              <Upload className="h-4 w-4" />
              <span className="truncate">Cargar Geometría</span>
            </button>
            <button 
                onClick={() => {
                  setEditingUnit(null)
                  setIsModalOpen(true)
                }}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal hover:bg-primary/90 transition-colors">
              <span className="truncate">Nueva Unidad Funcional</span>
            </button>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="flex flex-col gap-2 rounded-lg p-4 border border-[#dee2e6] bg-white">
          <p className="text-gray-500 text-sm font-medium leading-normal">Código</p>
          <p className="text-[#111418] tracking-light text-xl font-bold leading-tight">{proyecto.codigo}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-4 border border-[#dee2e6] bg-white">
          <p className="text-gray-500 text-sm font-medium leading-normal">Fase</p>
          <p className="text-[#111418] tracking-light text-base font-bold leading-tight">{proyecto.fase?.nombre || "Sin fase"}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-4 border border-[#dee2e6] bg-white">
          <p className="text-gray-500 text-sm font-medium leading-normal">Año Inicio</p>
          <p className="text-[#111418] tracking-light text-xl font-bold leading-tight">{proyecto.anio_inicio}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-4 border border-[#dee2e6] bg-white">
          <p className="text-gray-500 text-sm font-medium leading-normal">Duración (años)</p>
          <p className="text-[#111418] tracking-light text-xl font-bold leading-tight">{proyecto.duracion}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-4 border border-[#dee2e6] bg-white">
          <p className="text-gray-500 text-sm font-medium leading-normal">Longitud Total (km)</p>
          <p className="text-[#111418] tracking-light text-xl font-bold leading-tight">
            {proyecto.longitud.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-4 border border-[#dee2e6] bg-white">
          <p className="text-gray-500 text-sm font-medium leading-normal">Costo Total</p>
          <p className="text-[#111418] tracking-light text-xl font-bold leading-tight">
            {formatCurrency(proyecto.costo_total)}
          </p>
        </div>
      </section>

      {/* Grid Principal: Mapa + Paneles de Datos */}
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[720px]">
        {/* Panel Izquierdo: Mapa Interactivo */}
        <div className="xl:col-span-3 bg-white rounded-lg border border-[#dee2e6] overflow-hidden relative">
          <InteractiveProjectMap
            key={mapRefreshKey}
            projectCode={codigo}
            selectedUnitId={selectedUnitId}
            onUnitSelect={(id) => {
              const index = unidades.findIndex(u => u.id === id)
              setSelectedUnitIndex(index !== -1 ? index : null)
            }}
            center={proyecto.lat_inicio && proyecto.lng_inicio ? 
              { lat: proyecto.lat_inicio, lng: proyecto.lng_inicio } : 
              { lat: 4.5709, lng: -74.2973 }
            }
            zoom={12}
            className="w-full h-full"
          />
        </div>

        {/* Panel Derecho: Tabs de Datos */}
        <div className="xl:col-span-2 flex flex-col bg-white rounded-lg border border-[#dee2e6] overflow-hidden">
          {/* Navegación de Tabs */}
          <div className="flex border-b border-[#dee2e6] px-2">
            <button
              onClick={() => setActiveTab("unidades")}
              className={`flex-1 py-3 px-4 text-sm font-bold ${
                activeTab === "unidades" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Unidades Funcionales
            </button>
            <button
              onClick={() => setActiveTab("costos")}
              className={`flex-1 py-3 px-4 text-sm font-bold ${
                activeTab === "costos" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Desglose de Costos
            </button>
          </div>

          {/* Contenido de Tabs */}
          <div className="flex-grow overflow-y-auto">
            {activeTab === "unidades" && (
              <div className="divide-y divide-[#dee2e6] space-y-4 p-4">
                {unidades.map((unidad, index) => (
                  <FunctionalUnitCard
                    key={unidad.id}
                    unidad={unidad}
                    isSelected={selectedUnitIndex === index}
                    onClick={() => setSelectedUnitIndex(index === selectedUnitIndex ? null : index)}
                    onEdit={() => handleEditUnit(unidad)}
                    onDelete={() => handleDeleteUnit(unidad)}
                  />
                ))}
                {unidades.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No hay unidades funcionales registradas</p>
                    <button
                      onClick={() => {
                        setEditingUnit(null)
                        setIsModalOpen(true)
                      }}
                      className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Agregar Unidad Funcional
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "costos" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Items de la Fase</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{proyecto.fase?.nombre}</p>
                  </div>
                  <button
                    onClick={() => setIsCostosModalOpen(true)}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar Costos
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {faseItems.length > 0 ? (
                    faseItems.map((item) => {
                      const isParent = item.has_children || false
                      const valor = item.valor || 0
                      
                      return (
                        <div 
                          key={item.fase_item_requerido_id} 
                          className="flex justify-between items-center py-2 border-b border-gray-100"
                        >
                          <span className={`text-sm font-medium ${isParent ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>
                            {item.descripcion || item.item_tipo?.nombre || "Item desconocido"}
                          </span>
                          <span className={`text-sm font-bold ${isParent ? 'text-blue-900' : 'text-gray-900'}`}>
                            {formatCurrency(valor)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>No hay items definidos para esta fase</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <EditFunctionalUnitModal
        unidad={editingUnit}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingUnit(null)
        }}
        onSave={handleSaveUnit}
        onDeleteGeometry={handleDeleteUnitGeometry}
        proyectoId={proyecto.id}
      />

      <EditCostosModal
        isOpen={isCostosModalOpen}
        onClose={() => setIsCostosModalOpen(false)}
        onSave={loadData}
        codigoProyecto={codigo}
        faseItems={faseItems}
      />

      <GeometryUploadModal
        open={isGeometryModalOpen}
        onOpenChange={setIsGeometryModalOpen}
        projectCode={codigo}
        onUploadSuccess={handleGeometryUploadSuccess}
      />
    </main>
  )
}