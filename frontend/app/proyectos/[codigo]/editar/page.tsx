"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api, type Proyecto } from "@/lib/api"
import ProjectForm, { type ProjectFormData } from "@/components/project-form"
import { toast } from "sonner"

export default function EditarProyectoPage() {
  const params = useParams()
  const router = useRouter()
  const codigo = params.codigo as string

  const [loading, setLoading] = useState(true)
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)

  useEffect(() => {
    loadProyecto()
  }, [codigo])

  const loadProyecto = async () => {
    setLoading(true)
    try {
      const data = await api.getProyecto(codigo)
      setProyecto(data)
    } catch (error) {
      console.error("Error loading project:", error)
      toast.error("Error al cargar el proyecto", {
        description: error instanceof Error ? error.message : "Error desconocido"
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await api.updateProyecto(codigo, data as any)
      toast.success("Proyecto actualizado exitosamente")
      router.push(`/proyectos/${codigo}`)
    } catch (error) {
      console.error("Error updating project:", error)
      toast.error("Error al actualizar el proyecto", {
        description: error instanceof Error ? error.message : "Error desconocido"
      })
      throw error
    }
  }

  const handleCancel = () => {
    router.push(`/proyectos/${codigo}`)
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Proyecto no encontrado</p>
          <Link href="/proyectos" className="mt-4 inline-block text-primary hover:underline">
            Volver a proyectos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProjectForm
      mode="edit"
      initialData={proyecto}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      breadcrumbs={[
        { href: "/proyectos", label: "Proyectos" },
        { href: `/proyectos/${codigo}`, label: proyecto.nombre },
        { href: "#", label: "Editar" },
      ]}
    />
  )
}
