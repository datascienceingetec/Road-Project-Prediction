"use client"

import type React from "react"

import { useSettings } from "@/contexts/settings-context"
import { SidebarNav } from "@/navigation/components/sidebar-nav"
import { TopNav } from "@/navigation/components/top-nav"

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
