// API que se conecta al backend Flask
// Con fallback automático a datos mock si la API real falla

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// API falsa que simula el backend Flask
// Fácil de reemplazar con llamadas API reales más adelante

export interface Proyecto {
  id: number
  nombre: string
  codigo: string
  num_ufs: number
  longitud: number
  anio_inicio: number
  duracion: number | null
  fase: string
  ubicacion: string
  costo: number
  lat_inicio: number | null
  lng_inicio: number | null
  lat_fin: number | null
  lng_fin: number | null
  created_at: string
}

export interface UnidadFuncional {
  id: number
  codigo: string
  unidad_funcional: number
  longitud_km: number
  puentes_vehiculares_und: number
  puentes_vehiculares_mt2: number
  puentes_peatonales_und: number
  puentes_peatonales_mt2: number
  tuneles_und: number
  tuneles_km: number
  alcance: string
  zona: string
  tipo_terreno: string
}

export interface ItemFaseI {
  id: number
  codigo: string
  transporte: number
  diseno_geometrico: number
  prefactibilidad_tuneles: number
  geologia: number
  geotecnia: number
  hidrologia_hidraulica: number
  ambiental_social: number
  predial: number
  riesgos_sostenibilidad: number
  evaluacion_economica: number
  socioeconomica_financiera: number
  estructuras: number
  direccion_coordinacion: number
}

export interface ItemFaseII {
  id: number
  codigo: string
  transporte: number
  topografia: number
  geologia: number
  taludes: number
  hidrologia_hidraulica: number
  estructuras: number
  tuneles: number
  pavimento: number
  predial: number
  ambiental_social: number
  costos_presupuestos: number
  socioeconomica: number
  direccion_coordinacion: number
}

export interface ItemFaseIII {
  id: number
  codigo: string
  transporte: number
  informacion_geografica: number
  trazado_diseno_geometrico: number
  seguridad_vial: number
  sistemas_inteligentes: number
  geologia: number
  hidrogeologia: number
  suelos: number
  taludes: number
  pavimento: number
  socavacion: number
  estructuras: number
  tuneles: number
  urbanismo_paisajismo: number
  predial: number
  impacto_ambiental: number
  cantidades: number
  evaluacion_socioeconomica: number
  otros_manejo_redes: number
  direccion_coordinacion: number
}

export type ItemFase = ItemFaseI | ItemFaseII | ItemFaseIII

export interface PredictionRequest {
  longitud: number
  num_ufs: number
  fase: string
  ubicacion: string
  tipo_terreno?: string
}

export interface PredictionResponse {
  costo_estimado: number
  costo_por_km: number
  confianza: number
}

// Datos de ejemplo basados en las respuestas reales
const mockProyectos: Proyecto[] = [
  {
    id: 1,
    anio_inicio: 2010,
    codigo: "6935",
    costo: 1238647591,
    created_at: "2025-01-21 16:17:43",
    duracion: 36,
    fase: "Fase II - Factibilidad",
    lat_fin: 6.2442,
    lat_inicio: 6.2442,
    lng_fin: -75.5812,
    lng_inicio: -75.5812,
    longitud: 206.1,
    nombre: "Autopista del Norte",
    num_ufs: 7,
    ubicacion: "Rural",
  },
  {
    id: 2,
    anio_inicio: 2015,
    codigo: "7821",
    costo: 2450000000,
    created_at: "2025-01-20 10:30:15",
    duracion: 48,
    fase: "Fase III - Diseños a detalle",
    lat_fin: 4.711,
    lat_inicio: 4.711,
    lng_fin: -74.0721,
    lng_inicio: -74.0721,
    longitud: 125.5,
    nombre: "Vía Bogotá - Villavicencio",
    num_ufs: 5,
    ubicacion: "Montañoso",
  },
  {
    id: 3,
    anio_inicio: 2018,
    codigo: "8934",
    costo: 890000000,
    created_at: "2025-01-19 14:22:30",
    duracion: 24,
    fase: "Fase I - Prefactibilidad",
    lat_fin: 3.4516,
    lat_inicio: 3.4516,
    lng_fin: -76.532,
    lng_inicio: -76.532,
    longitud: 78.3,
    nombre: "Corredor Cali - Buenaventura",
    num_ufs: 4,
    ubicacion: "Montañoso",
  },
  {
    id: 4,
    anio_inicio: 2020,
    codigo: "9102",
    costo: 1560000000,
    created_at: "2025-01-18 09:15:45",
    duracion: 30,
    fase: "Fase II - Factibilidad",
    lat_fin: 10.391,
    lat_inicio: 10.391,
    lng_fin: -75.4794,
    lng_inicio: -75.4794,
    longitud: 156.8,
    nombre: "Transversal de las Américas",
    num_ufs: 6,
    ubicacion: "Plano",
  },
  {
    id: 5,
    anio_inicio: 2019,
    codigo: "8567",
    costo: 3200000000,
    created_at: "2025-01-17 11:45:20",
    duracion: 60,
    fase: "Fase III - Diseños a detalle",
    lat_fin: 7.1193,
    lat_inicio: 7.1193,
    lng_fin: -73.1227,
    lng_inicio: -73.1227,
    longitud: 245.2,
    nombre: "Autopista al Mar 2",
    num_ufs: 9,
    ubicacion: "Montañoso",
  },
]

const mockUnidadesFuncionales: UnidadFuncional[] = [
  {
    alcance: "Construcción",
    codigo: "6935",
    id: 1,
    longitud_km: 26.2,
    puentes_peatonales_mt2: 0,
    puentes_peatonales_und: 0,
    puentes_vehiculares_mt2: 4138,
    puentes_vehiculares_und: 14,
    tipo_terreno: "Plano",
    tuneles_km: 0,
    tuneles_und: 0,
    unidad_funcional: 1,
    zona: "Rural",
  },
  {
    alcance: "Construcción",
    codigo: "6935",
    id: 2,
    longitud_km: 32.5,
    puentes_peatonales_mt2: 250,
    puentes_peatonales_und: 2,
    puentes_vehiculares_mt2: 5200,
    puentes_vehiculares_und: 18,
    tipo_terreno: "Ondulado",
    tuneles_km: 0,
    tuneles_und: 0,
    unidad_funcional: 2,
    zona: "Rural",
  },
  {
    alcance: "Mejoramiento",
    codigo: "6935",
    id: 3,
    longitud_km: 28.8,
    puentes_peatonales_mt2: 0,
    puentes_peatonales_und: 0,
    puentes_vehiculares_mt2: 3850,
    puentes_vehiculares_und: 12,
    tipo_terreno: "Plano",
    tuneles_km: 0,
    tuneles_und: 0,
    unidad_funcional: 3,
    zona: "Rural",
  },
]

const mockItemsFaseII: ItemFaseII[] = [
  {
    ambiental_social: 302592911,
    codigo: "6935",
    costos_presupuestos: 46610370,
    direccion_coordinacion: 95956539,
    estructuras: 5761233,
    geologia: 61532307,
    hidrologia_hidraulica: 0,
    id: 1,
    pavimento: 25858300,
    predial: 122586050,
    socioeconomica: 0,
    taludes: 139616991,
    topografia: 185525170,
    transporte: 0,
    tuneles: 252607720,
  },
]

// Simular delay de API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.log("[v0] API Error:", error)
    return null
  }
}

// Funciones de la API con fallback automático
export const api = {
  // Proyectos
  async getProyectos(): Promise<Proyecto[]> {
    try {
      const data = await fetchAPI("/proyectos")
      if (data) return data
    } catch (error) {
      console.log("[v0] Usando datos mock para getProyectos")
    }
    await delay(500)
    return [...mockProyectos]
  },

  async getProyecto(codigo: string): Promise<Proyecto | null> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}`)
      if (data) {
        // TODO: quitar despues de pruebas
        data.lat_inicio = 6.2442
        data.lng_inicio = -75.5812
        data.lat_fin = 6.2442
        data.lng_fin = -75.5812
        return data
      }
    } catch (error) {
      console.log("[v0] Usando datos mock para getProyecto")
    }
    await delay(300)
    return mockProyectos.find((p) => p.codigo === codigo) || null
  },

  async createProyecto(proyecto: Omit<Proyecto, "id" | "created_at">): Promise<Proyecto> {
    try {
      const data = await fetchAPI("/proyectos", {
        method: "POST",
        body: JSON.stringify(proyecto),
      })
      if (data) return data
    } catch (error) {
      console.log("[v0] Usando datos mock para createProyecto")
    }
    await delay(500)
    const newProyecto: Proyecto = {
      ...proyecto,
      id: Math.max(...mockProyectos.map((p) => p.id)) + 1,
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    }
    mockProyectos.push(newProyecto)
    return newProyecto
  },

  async updateProyecto(codigo: string, proyecto: Partial<Proyecto>): Promise<Proyecto | null> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}`, {
        method: "PUT",
        body: JSON.stringify(proyecto),
      })
      if (data) return data
    } catch (error) {
      console.log("[v0] Usando datos mock para updateProyecto")
    }
    await delay(500)
    const index = mockProyectos.findIndex((p) => p.codigo === codigo)
    if (index === -1) return null
    mockProyectos[index] = { ...mockProyectos[index], ...proyecto }
    return mockProyectos[index]
  },

  async deleteProyecto(id: number): Promise<boolean> {
    try {
      const data = await fetchAPI(`/proyectos/${id}`, {
        method: "DELETE",
      })
      if (data !== null) return true
    } catch (error) {
      console.log("[v0] Usando datos mock para deleteProyecto")
    }
    await delay(500)
    const index = mockProyectos.findIndex((p) => p.id === id)
    if (index === -1) return false
    mockProyectos.splice(index, 1)
    return true
  },

  // Unidades Funcionales
  async getUnidadesFuncionales(codigo: string): Promise<UnidadFuncional[]> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}/unidades-funcionales`)
      if (data) return data
    } catch (error) {
      console.log("[v0] Usando datos mock para getUnidadesFuncionales")
    }
    await delay(300)
    return mockUnidadesFuncionales.filter((u) => u.codigo === codigo)
  },

  async createUnidadFuncional(uf: Omit<UnidadFuncional, "id">): Promise<UnidadFuncional> {
    try {
      const data = await fetchAPI(`/proyectos/${uf.codigo}/unidades-funcionales`, {
        method: "POST",
        body: JSON.stringify(uf),
      })
      if (data) return data
    } catch (error) {
      console.log("[v0] Usando datos mock para createUnidadFuncional")
    }
    await delay(400)
    const newUF: UnidadFuncional = {
      ...uf,
      id: Math.max(...mockUnidadesFuncionales.map((u) => u.id)) + 1,
    }
    mockUnidadesFuncionales.push(newUF)
    return newUF
  },

  async deleteUnidadFuncional(codigo: string, id: number): Promise<boolean> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}/unidades-funcionales/${id}`, {
        method: "DELETE",
      })
      if (data !== null) return true
    } catch (error) {
      console.log("[v0] Usando datos mock para deleteUnidadFuncional")
    }
    await delay(300)
    const index = mockUnidadesFuncionales.findIndex((u) => u.id === id)
    if (index === -1) return false
    mockUnidadesFuncionales.splice(index, 1)
    return true
  },

  // Items por Fase
  async getItems(codigo: string, fase: string): Promise<ItemFase | null> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}/items?fase=${fase}`)
      if (data) return data
    } catch (error) {
      console.log("[v0] Usando datos mock para getItems")
    }
    await delay(300)
    if (fase === "fase_ii") {
      return mockItemsFaseII.find((i) => i.codigo === codigo) || null
    }
    return null
  },

  async createOrUpdateItems(codigo: string, fase: string, items: Partial<ItemFase>): Promise<ItemFase> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}/items?fase=${fase}`, {
        method: "POST",
        body: JSON.stringify(items),
      })
      if (data) return data
    } catch (error) {
      console.log("[v0] Usando datos mock para createOrUpdateItems")
    }
    await delay(400)
    const newItem: any = {
      id: 1,
      codigo,
      ...items,
    }
    return newItem
  },

  // Predicción
  async getPrediction(data: PredictionRequest): Promise<PredictionResponse> {
    try {
      const result = await fetchAPI("/prediccion", {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (result) return result
    } catch (error) {
      console.log("[v0] Usando datos mock para getPrediction")
    }
    await delay(800)
    const baseCostPerKm = 6000000
    let multiplier = 1.0

    if (data.ubicacion === "Montañoso") multiplier *= 1.8
    else if (data.ubicacion === "Ondulado") multiplier *= 1.3

    if (data.fase.includes("Fase II")) multiplier *= 1.5
    else if (data.fase.includes("Fase III")) multiplier *= 2.2

    multiplier *= 1 + data.num_ufs * 0.05

    const costoEstimado = Math.round(baseCostPerKm * data.longitud * multiplier)
    const costoPorKm = Math.round(costoEstimado / data.longitud)

    return {
      costo_estimado: costoEstimado,
      costo_por_km: costoPorKm,
      confianza: 0.85,
    }
  },

  async predictCosto(data: PredictionRequest): Promise<PredictionResponse> {
    return this.getPrediction(data)
  },

  // Estadísticas para el dashboard
  async getEstadisticas() {
    try {
      // Intentar obtener proyectos de la API real
      const proyectos = await fetchAPI("/proyectos")
      if (proyectos) {
        const totalProyectos = proyectos.length
        const inversionTotal = proyectos.reduce((sum: number, p: Proyecto) => sum + p.costo, 0)
        const kmTotales = proyectos.reduce((sum: number, p: Proyecto) => sum + p.longitud, 0)

        const fases = proyectos.reduce(
          (acc: Record<string, number>, p: Proyecto) => {
            acc[p.fase] = (acc[p.fase] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        const inversionPorMes = [
          { mes: "Ene", inversion: inversionTotal * 0.1 },
          { mes: "Feb", inversion: inversionTotal * 0.2 },
          { mes: "Mar", inversion: inversionTotal * 0.35 },
          { mes: "Abr", inversion: inversionTotal * 0.5 },
          { mes: "May", inversion: inversionTotal * 0.7 },
          { mes: "Jun", inversion: inversionTotal * 0.85 },
          { mes: "Jul", inversion: inversionTotal },
        ]

        return {
          totalProyectos,
          inversionTotal,
          kmTotales,
          distribucionFase: fases,
          inversionPorMes,
          proyectosRecientes: proyectos.slice(0, 5),
        }
      }
    } catch (error) {
      console.log("[v0] Usando datos mock para getEstadisticas")
    }

    await delay(400)
    const totalProyectos = mockProyectos.length
    const inversionTotal = mockProyectos.reduce((sum, p) => sum + p.costo, 0)
    const kmTotales = mockProyectos.reduce((sum, p) => sum + p.longitud, 0)

    const fases = mockProyectos.reduce(
      (acc, p) => {
        acc[p.fase] = (acc[p.fase] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const inversionPorMes = [
      { mes: "Ene", inversion: inversionTotal * 0.1 },
      { mes: "Feb", inversion: inversionTotal * 0.2 },
      { mes: "Mar", inversion: inversionTotal * 0.35 },
      { mes: "Abr", inversion: inversionTotal * 0.5 },
      { mes: "May", inversion: inversionTotal * 0.7 },
      { mes: "Jun", inversion: inversionTotal * 0.85 },
      { mes: "Jul", inversion: inversionTotal },
    ]

    return {
      totalProyectos,
      inversionTotal,
      kmTotales,
      distribucionFase: fases,
      inversionPorMes,
      proyectosRecientes: mockProyectos.slice(0, 5),
    }
  },
}

// Helper para formatear moneda
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper para formatear números
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}
