import Link from "next/link"
import { Settings } from "lucide-react"

export function TopNav() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap bg-primary-dark px-6 py-3 shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-4 text-white">
        <div className="size-6">
          <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">INGETEC</h2>
      </div>
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
