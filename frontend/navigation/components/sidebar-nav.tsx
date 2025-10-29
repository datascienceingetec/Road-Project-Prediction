"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"
import Logo from "@/components/logo"
import { mainNavItems, secondaryNavItems } from "@/navigation"
import type { NavItem } from "@/navigation"

interface NavLinkProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
}

/**
 * Componente individual de enlace de navegación
 */
function NavLink({ item, isActive, isCollapsed }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
        isActive ? "bg-primary text-white" : "text-gray-300 hover:bg-white/10",
        isCollapsed && "justify-center",
      )}
      title={isCollapsed ? item.label : item.description}
    >
      <span className={cn("material-symbols-outlined", isActive && "fill")}>
        {item.icon}
      </span>
      {!isCollapsed && (
        <p className={cn("text-sm leading-normal", isActive ? "font-semibold" : "font-medium")}>
          {item.label}
        </p>
      )}
    </Link>
  )
}

/**
 * Barra de navegación lateral vertical
 *
 * Características:
 * - Colapsable (256px expandido → 64px colapsado)
 * - Items dinámicos desde configuración centralizada
 * - Detección automática de ruta activa
 * - Logo visible solo cuando está expandido
 */
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
        {/* Navegación principal */}
        <div className="flex flex-col gap-6">
          {/* Header con logo y botón de colapsar */}
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && <Logo variant="full" />}
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

          {/* Items de navegación principal */}
          <nav className="flex flex-col gap-2">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  isCollapsed={sidebarCollapsed}
                />
              )
            })}
          </nav>
        </div>

        {/* Navegación secundaria (footer) */}
        <div className="flex flex-col gap-2">
          {secondaryNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive}
                isCollapsed={sidebarCollapsed}
              />
            )
          })}
        </div>
      </div>
    </aside>
  )
}
