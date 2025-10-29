import Link from "next/link"
import { Settings } from "lucide-react"
import Logo from "@/components/logo"

export function TopNav() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap bg-primary-dark px-6 py-3 shadow-md sticky top-0 z-50">
      <Logo variant="full"/>
      <div className="flex flex-1 justify-end gap-4">
        <div className="hidden md:flex items-center gap-8">
          <Link
            className="text-gray-300 hover:text-white text-sm font-medium leading-normal transition-colors"
            href="/"
          >
            Dashboard
          </Link>
          <Link
            className="text-gray-300 hover:text-white text-sm font-medium leading-normal transition-colors"
            href="/proyectos"
          >
            Proyectos
          </Link>
          <Link
            className="text-gray-300 hover:text-white text-sm font-medium leading-normal transition-colors"
            href="/prediccion"
          >
            Nueva Predicción
          </Link>
          <Link
            className="text-gray-300 hover:text-white text-sm font-medium leading-normal transition-colors"
            href="/reportes"
          >
            Reportes
          </Link>
          <Link
            className="text-gray-300 hover:text-white transition-colors"
            href="/configuracion"
          >
            <Settings className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
