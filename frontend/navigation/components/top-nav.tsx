"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Logo from "@/components/logo"
import { allNavItems } from "@/navigation"
import type { NavItem } from "@/navigation"

interface NavLinkProps {
  item: NavItem
  isActive: boolean
}

/**
 * Componente individual de enlace de navegación
 */
function NavLink({ item, isActive }: NavLinkProps) {
  // Si es el item de configuración, renderizar el icono
  if (item.href === "/configuracion") {
    return (
      <Link
        href={item.href}
        className={cn(
          "transition-colors",
          isActive ? "text-white" : "text-gray-300 hover:text-white"
        )}
        title={item.description}
      >
        <span className="material-symbols-outlined ml-2 h-5 w-5">
          {item.icon}
        </span>
      </Link>
    )
  }

  // Items de navegación regulares
  return (
    <Link
      href={item.href}
      className={cn(
        "text-sm font-medium leading-normal transition-colors",
        isActive ? "text-white font-semibold" : "text-gray-300 hover:text-white"
      )}
      title={item.description}
    >
      {item.label}
    </Link>
  )
}

/**
 * Barra de navegación horizontal superior
 *
 * Características:
 * - Navegación horizontal en desktop
 * - Items dinámicos desde configuración centralizada
 * - Detección automática de ruta activa
 * - Logo siempre visible
 */
export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between whitespace-nowrap bg-primary-dark px-6 py-3 shadow-md sticky top-0 z-50">
      <Logo variant="full" />
      <div className="flex flex-1 justify-end gap-4">
        <nav className="hidden md:flex items-center gap-8">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive}
              />
            )
          })}
        </nav>
      </div>
    </header>
  )
}
