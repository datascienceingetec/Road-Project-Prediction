/**
 * Sistema de colores consistente y dinámico para gráficos.
 * 
 * Asigna colores únicos y estables a cada "alcance" y guarda la asignación
 * en memoria (y en localStorage) para mantener consistencia entre sesiones.
 * 
 * Si se agotan los colores disponibles en la paleta, se usa un hash FNV-1a
 * como mecanismo de respaldo para garantizar asignaciones consistentes.
 */

/**
 * Paleta base de colores de alta diferenciación visual.
 * Puedes agregar o modificar colores según la identidad del proyecto.
 */
const BASE_COLORS = [
  "#1f77b4", // Azul
  "#ff7f0e", // Naranja
  "#2ca02c", // Verde
  "#d62728", // Rojo
  "#9467bd", // Púrpura
  "#8c564b", // Marrón
  "#e377c2", // Rosa
  "#7f7f7f", // Gris
  "#17becf", // Cian
  "#bcbd22", // Amarillo oliva
]

/**
 * Cache global en memoria para recordar asignaciones de color previas.
 */
const alcanceColorCache: Record<string, string> = {}

/**
 * Inicializa el cache desde localStorage (si existe).
 */
function loadCacheFromStorage(): void {
  try {
    const saved = localStorage.getItem("alcanceColorCache")
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(alcanceColorCache, parsed)
    }
  } catch (err) {
    console.warn("No se pudo cargar el cache de colores desde localStorage:", err)
  }
}

/**
 * Guarda el cache actual de colores en localStorage.
 */
function saveCacheToStorage(): void {
  try {
    localStorage.setItem("alcanceColorCache", JSON.stringify(alcanceColorCache))
  } catch (err) {
    console.warn("No se pudo guardar el cache de colores en localStorage:", err)
  }
}

/**
 * Genera un hash numérico a partir de una cadena usando FNV-1a.
 * Ofrece una buena distribución y consistencia entre sesiones.
 * 
 * @param str - Cadena de texto a hashear
 * @returns Número hash positivo de 32 bits
 */
function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash *= 16777619
    hash >>>= 0 // Forzar a 32 bits sin signo
  }
  return hash
}

/**
 * Obtiene un color consistente y único para un alcance.
 * 
 * - Si el alcance ya tiene un color asignado, lo devuelve.
 * - Si no, asigna el siguiente color libre de la paleta.
 * - Si no quedan colores libres, usa el hash FNV-1a como fallback.
 * 
 * @param alcance - Nombre del alcance
 * @returns Código hexadecimal del color asignado
 */
export function getAlcanceColor(alcance: string): string {
  if (!alcance || alcance.trim() === "" || alcance === "Sin especificar") {
    return "#aaaaaa" // Gris neutro
  }

  const normalized = alcance.trim().toLowerCase()

  // Si ya existe en cache, devolver el mismo color
  if (alcanceColorCache[normalized]) {
    return alcanceColorCache[normalized]
  }

  // Buscar colores disponibles
  const usedColors = Object.values(alcanceColorCache)
  const availableColors = BASE_COLORS.filter(c => !usedColors.includes(c))

  let assignedColor: string

  if (availableColors.length > 0) {
    // Asignar el siguiente color libre
    assignedColor = availableColors[0]
  } else {
    // Fallback con hash cuando se acaban los colores base
    const hash = hashString(normalized)
    assignedColor = BASE_COLORS[hash % BASE_COLORS.length]
  }

  // Guardar en cache y persistir
  alcanceColorCache[normalized] = assignedColor
  saveCacheToStorage()

  return assignedColor
}

/**
 * Genera un mapa de colores para una lista de alcances únicos.
 * Mantiene la consistencia de colores asignados previamente.
 * 
 * @param alcances - Lista de nombres de alcance únicos
 * @returns Objeto con alcance como key y color como value
 */
export function generateAlcanceColorMap(alcances: string[]): Record<string, string> {
  const colorMap: Record<string, string> = {}
  loadCacheFromStorage()

  alcances.forEach(alcance => {
    colorMap[alcance] = getAlcanceColor(alcance)
  })

  return colorMap
}

/**
 * Obtiene una lista de colores en el mismo orden de los alcances.
 * 
 * @param alcances - Lista ordenada de alcances
 * @returns Array de colores hexadecimales
 */
export function getAlcanceColors(alcances: string[]): string[] {
  loadCacheFromStorage()
  return alcances.map(alcance => getAlcanceColor(alcance))
}
