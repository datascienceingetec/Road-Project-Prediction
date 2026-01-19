"use client"

import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import ProjectForm, { type ProjectFormData } from "@/components/project-form"
import { toast } from "sonner"

export default function NuevoProyectoPage() {
  const router = useRouter()

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const newProyecto = await api.createProyecto(data as any)
      toast.success("Proyecto creado exitosamente")
      router.push(`/proyectos/${newProyecto.codigo}`)
    } catch (error) {
      console.error("Error creating project:", error)
      if (error instanceof Error && error.message.includes("409")) {
        toast.error("Error al crear el proyecto", {
          description: "El código del proyecto ya existe"
        })
        return
      }
      toast.error("Error al crear el proyecto", {
        description: error instanceof Error ? error.message : "Error desconocido"
      })
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
