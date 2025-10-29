"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings-context"
import Logo from "@/components/logo"

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/proyectos",
    label: "Proyectos",
    icon: "folder",
  },
  {
    href: "/prediccion",
    label: "Nueva Predicción",
    icon: "add_circle",
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: "bar_chart",
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed } = useSettings()

  return (
    <aside
      className={cn(
        "flex flex-col bg-primary-dark text-white flex-shrink-0 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
                <Logo variant="full"/>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              <span className="material-symbols-outlined text-gray-300">
                {sidebarCollapsed ? "chevron_right" : "chevron_left"}
              </span>
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
                    isActive ? "bg-primary text-white" : "text-gray-300 hover:bg-white/10",
                    sidebarCollapsed && "justify-center",
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={cn("material-symbols-outlined", isActive && "fill")}>{item.icon}</span>
                  {!sidebarCollapsed && (
                    <p className={cn("text-sm leading-normal", isActive ? "font-semibold" : "font-medium")}>
                      {item.label}
                    </p>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/configuracion"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors duration-200",
              sidebarCollapsed && "justify-center",
            )}
            title={sidebarCollapsed ? "Configuración" : undefined}
          >
            <span className="material-symbols-outlined text-gray-300">settings</span>
            {!sidebarCollapsed && <p className="text-gray-300 text-sm font-medium leading-normal">Configuración</p>}
          </Link>
        </div>
      </div>
    </aside>
  )
}
