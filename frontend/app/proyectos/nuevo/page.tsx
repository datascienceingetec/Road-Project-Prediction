"use client"

import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import ProjectForm, { type ProjectFormData } from "@/components/project-form"

export default function NuevoProyectoPage() {
  const router = useRouter()

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const newProyecto = await api.createProyecto(data as any)
      alert("Proyecto creado exitosamente")
      router.push(`/proyectos/${newProyecto.codigo}`)
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Error al crear el proyecto")
      throw error
    }
  }

  const handleCancel = () => {
    router.push("/proyectos")
  }

  return (
    <ProjectForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      breadcrumbs={[
        { href: "/proyectos", label: "Proyectos" },
        { href: "#", label: "Nuevo Proyecto" },
      ]}
    />
  )
}
