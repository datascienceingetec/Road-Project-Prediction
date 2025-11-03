"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api, type Proyecto } from "@/lib/api"
import ProjectForm, { type ProjectFormData } from "@/components/project-form"

export default function EditarProyectoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)

  useEffect(() => {
    loadProyecto()
  }, [id])

  const loadProyecto = async () => {
    setLoading(true)
    try {
      const data = await api.getProyecto(id)
      setProyecto(data)
    } catch (error) {
      console.error("Error loading project:", error)
      alert("Error al cargar el proyecto")
    }
    setLoading(false)
  }

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await api.updateProyecto(id, data as any)
      alert("Proyecto actualizado exitosamente")
      router.push(`/proyectos/${id}`)
    } catch (error) {
      console.error("Error updating project:", error)
      alert("Error al actualizar el proyecto")
      throw error
    }
  }

  const handleCancel = () => {
    router.push(`/proyectos/${id}`)
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
        { href: `/proyectos/${id}`, label: proyecto.nombre },
        { href: "#", label: "Editar" },
      ]}
    />
  )
}
