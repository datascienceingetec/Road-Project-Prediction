"use client"

import type React from "react"
import { useSettings } from "@/contexts/settings-context"
import { SidebarNav, TopNav } from "@/navigation/components"

/**
 * Layout principal de la aplicación
 *
 * Alterna dinámicamente entre dos modos de navegación:
 * - Sidebar (navegación vertical lateral)
 * - TopNav (navegación horizontal superior)
 *
 * El modo se controla desde el SettingsContext
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const { useSidebar } = useSettings()

  if (useSidebar) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}
