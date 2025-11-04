// API que se conecta al backend Flask
// Con fallback automático a datos mock si la API real falla

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// API falsa que simula el backend Flask
// Fácil de reemplazar con llamadas API reales más adelante

export interface Fase {
  id: number
  nombre: string
  descripcion: string | null
}

export interface Proyecto {
  id: number
  nombre: string
  codigo: string
  longitud: number
  anio_inicio: number
  duracion: number | null
  fase_id: number
  fase: Fase | null
  ubicacion: string
  lat_inicio: number | null
  lng_inicio: number | null
  lat_fin: number | null
  lng_fin: number | null
  costo?: number
  status?: string
  created_at: string
}

export interface UnidadFuncional {
  id: number
  proyecto_id: number
  numero: number
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

export interface ItemTipo {
  id: number
  nombre: string
  descripcion: string | null
}

export interface CostoItem {
  id: number
  proyecto_id: number
  item_tipo_id: number
  valor: number
  item_tipo: ItemTipo | null
}

export interface FaseItemRequerido {
  id: number
  fase_id: number
  item_tipo_id: number
  obligatorio: boolean
  descripcion: string | null
  fase: Fase | null
  item_tipo: ItemTipo | null
}

export interface EnumOption {
  value: string
  label: string
}

export interface EnumsCatalog {
  alcance: EnumOption[]
  zona: EnumOption[]
  tipo_terreno: EnumOption[]
  status: EnumOption[]
}

export interface PredictionRequest {
  longitud: number
  num_ufs: number
  fase: string
  ubicacion: string
  tipo_terreno?: string
  unidades_funcionales?: Array<{
    numero: number
    longitud_km: number
    alcance: string
    zona: string
    tipo_terreno: string
    puentes_vehiculares_und: number
    puentes_vehiculares_mt2: number
    puentes_peatonales_und: number
    puentes_peatonales_mt2: number
    tuneles_und: number
    tuneles_km: number
  }>
}

export interface PredictionResponse {
  costo_estimado: number
  costo_por_km: number
  confianza: number
  items?: Array<{
    item: string
    causacion_estimada: number
  }>
}

export interface Scenario {
  id: string
  nombre: string
  proyecto_nombre: string
  fase: string
  ubicacion: string
  costo_total: number
  fecha_creacion: string
  num_ufs: number
  unidades_funcionales?: any[]
  items?: any[]
}

// Datos de ejemplo basados en las respuestas reales
const mockProyectos: Proyecto[] = [
  {
    id: 1,
    anio_inicio: 2010,
    codigo: "6935",
    created_at: "2025-01-21 16:17:43",
    duracion: 36,
    fase_id: 2,
    fase: { id: 2, nombre: "Fase II - Factibilidad", descripcion: null },
    lat_fin: 6.2442,
    lat_inicio: 6.2442,
    lng_fin: -75.5812,
    lng_inicio: -75.5812,
    longitud: 206.1,
    nombre: "Autopista del Norte",
    ubicacion: "Rural",
  },
  {
    id: 2,
    anio_inicio: 2015,
    codigo: "7821",
    created_at: "2025-01-20 10:30:15",
    duracion: 48,
    fase_id: 3,
    fase: { id: 3, nombre: "Fase III - Diseños a detalle", descripcion: null },
    lat_fin: 4.711,
    lat_inicio: 4.711,
    lng_fin: -74.0721,
    lng_inicio: -74.0721,
    longitud: 125.5,
    nombre: "Vía Bogotá - Villavicencio",
    ubicacion: "Montañoso",
  },
  {
    id: 3,
    anio_inicio: 2018,
    codigo: "8934",
    created_at: "2025-01-19 14:22:30",
    duracion: 24,
    fase_id: 1,
    fase: { id: 1, nombre: "Fase I - Prefactibilidad", descripcion: null },
    lat_fin: 3.4516,
    lat_inicio: 3.4516,
    lng_fin: -76.532,
    lng_inicio: -76.532,
    longitud: 78.3,
    nombre: "Corredor Cali - Buenaventura",
    ubicacion: "Montañoso",
  },
  {
    id: 4,
    anio_inicio: 2020,
    codigo: "9102",
    created_at: "2025-01-18 09:15:45",
    duracion: 30,
    fase_id: 2,
    fase: { id: 2, nombre: "Fase II - Factibilidad", descripcion: null },
    lat_fin: 10.391,
    lat_inicio: 10.391,
    lng_fin: -75.4794,
    lng_inicio: -75.4794,
    longitud: 156.8,
    nombre: "Transversal de las Américas",
    ubicacion: "Plano",
  },
  {
    id: 5,
    anio_inicio: 2019,
    codigo: "8567",
    created_at: "2025-01-17 11:45:20",
    duracion: 60,
    fase_id: 3,
    fase: { id: 3, nombre: "Fase III - Diseños a detalle", descripcion: null },
    lat_fin: 7.1193,
    lat_inicio: 7.1193,
    lng_fin: -73.1227,
    lng_inicio: -73.1227,
    longitud: 245.2,
    nombre: "Autopista al Mar 2",
    ubicacion: "Montañoso",
  },
]

const mockUnidadesFuncionales: UnidadFuncional[] = [
  {
    alcance: "Construcción",
    proyecto_id: 1,
    id: 1,
    longitud_km: 26.2,
    puentes_peatonales_mt2: 0,
    puentes_peatonales_und: 0,
    puentes_vehiculares_mt2: 4138,
    puentes_vehiculares_und: 14,
    tipo_terreno: "Plano",
    tuneles_km: 0,
    tuneles_und: 0,
    numero: 1,
    zona: "Rural",
  },
  {
    alcance: "Construcción",
    proyecto_id: 1,
    id: 2,
    longitud_km: 32.5,
    puentes_peatonales_mt2: 250,
    puentes_peatonales_und: 2,
    puentes_vehiculares_mt2: 5200,
    puentes_vehiculares_und: 18,
    tipo_terreno: "Ondulado",
    tuneles_km: 0,
    tuneles_und: 0,
    numero: 2,
    zona: "Rural",
  },
  {
    alcance: "Mejoramiento",
    proyecto_id: 1,
    id: 3,
    longitud_km: 28.8,
    puentes_peatonales_mt2: 0,
    puentes_peatonales_und: 0,
    puentes_vehiculares_mt2: 3850,
    puentes_vehiculares_und: 12,
    tipo_terreno: "Plano",
    tuneles_km: 0,
    tuneles_und: 0,
    numero: 3,
    zona: "Rural",
  },
]

const mockCostos: CostoItem[] = [
  { id: 1, proyecto_id: 1, item_tipo_id: 1, valor: 302592911, item_tipo: { id: 1, nombre: "Ambiental Social", descripcion: null } },
  { id: 2, proyecto_id: 1, item_tipo_id: 2, valor: 46610370, item_tipo: { id: 2, nombre: "Costos Presupuestos", descripcion: null } },
  { id: 3, proyecto_id: 1, item_tipo_id: 3, valor: 95956539, item_tipo: { id: 3, nombre: "Dirección Coordinación", descripcion: null } },
  { id: 4, proyecto_id: 1, item_tipo_id: 4, valor: 5761233, item_tipo: { id: 4, nombre: "Estructuras", descripcion: null } },
  { id: 5, proyecto_id: 1, item_tipo_id: 5, valor: 61532307, item_tipo: { id: 5, nombre: "Geología", descripcion: null } },
  { id: 6, proyecto_id: 1, item_tipo_id: 6, valor: 25858300, item_tipo: { id: 6, nombre: "Pavimento", descripcion: null } },
  { id: 7, proyecto_id: 1, item_tipo_id: 7, valor: 122586050, item_tipo: { id: 7, nombre: "Predial", descripcion: null } },
  { id: 8, proyecto_id: 1, item_tipo_id: 8, valor: 139616991, item_tipo: { id: 8, nombre: "Taludes", descripcion: null } },
  { id: 9, proyecto_id: 1, item_tipo_id: 9, valor: 185525170, item_tipo: { id: 9, nombre: "Topografía", descripcion: null } },
  { id: 10, proyecto_id: 1, item_tipo_id: 10, valor: 252607720, item_tipo: { id: 10, nombre: "Túneles", descripcion: null } },
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
    console.log("API Error:", error)
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
      console.log("Usando datos mock para getProyectos")
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
      console.log("Usando datos mock para getProyecto")
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
      console.log("Usando datos mock para createProyecto")
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
      console.log("Usando datos mock para updateProyecto")
    }
    await delay(500)
    const index = mockProyectos.findIndex((p) => p.codigo === codigo)
    if (index === -1) return null
    mockProyectos[index] = { ...mockProyectos[index], ...proyecto }
    return mockProyectos[index]
  },

  async changeStatusProyecto(id: number, status: "active" | "inactive"): Promise<boolean> {
    try {
      const proyecto = mockProyectos.find((p) => p.id === id)
      if (!proyecto) return false
      const data = await fetchAPI(`/proyectos/${proyecto.codigo}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      if (data) return true
    } catch (error) {
      console.log("Usando datos mock para changeStatusProyecto")
    }
    await delay(500)
    const index = mockProyectos.findIndex((p) => p.id === id)
    if (index === -1) return false
    mockProyectos[index].status = status
    return true
  },
  
  async deleteProyecto(id: number): Promise<boolean> {
    try {
      const data = await fetchAPI(`/proyectos/${id}`, {
        method: "DELETE",
      })
      if (data !== null) return true
    } catch (error) {
      console.log("Usando datos mock para deleteProyecto")
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
      console.log("Usando datos mock para getUnidadesFuncionales")
    }
    await delay(300)
    const proyecto = mockProyectos.find((p) => p.codigo === codigo)
    return proyecto ? mockUnidadesFuncionales.filter((u) => u.proyecto_id === proyecto.id) : []
  },

  async createUnidadFuncional(codigo: string, uf: Omit<UnidadFuncional, "id" | "proyecto_id">): Promise<UnidadFuncional> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}/unidades-funcionales`, {
        method: "POST",
        body: JSON.stringify(uf),
      })
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para createUnidadFuncional")
    }
    await delay(400)
    const proyecto = mockProyectos.find((p) => p.codigo === codigo)
    if (!proyecto) throw new Error("Proyecto no encontrado")
    const newUF: UnidadFuncional = {
      ...uf,
      proyecto_id: proyecto.id,
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
      console.log("Usando datos mock para deleteUnidadFuncional")
    }
    await delay(300)
    const index = mockUnidadesFuncionales.findIndex((u) => u.id === id)
    if (index === -1) return false
    mockUnidadesFuncionales.splice(index, 1)
    return true
  },

  // Costos (Items)
  async getCostos(codigo: string): Promise<CostoItem[]> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}/costos`)
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getCostos")
    }
    await delay(300)
    const proyecto = mockProyectos.find((p) => p.codigo === codigo)
    return proyecto ? mockCostos.filter((c) => c.proyecto_id === proyecto.id) : []
  },

  async createOrUpdateCostos(codigo: string, costos: Array<{ item_tipo_id: number; valor: number }>): Promise<{ created: number; updated: number }> {
    try {
      const data = await fetchAPI(`/proyectos/${codigo}/costos`, {
        method: "POST",
        body: JSON.stringify({ costos }),
      })
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para createOrUpdateCostos")
    }
    await delay(400)
    return { created: costos.length, updated: 0 }
  },

  // Fases
  async getFases(): Promise<Fase[]> {
    try {
      const data = await fetchAPI("/fases")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getFases")
    }
    await delay(300)
    return [
      { id: 1, nombre: "Fase I - Prefactibilidad", descripcion: null },
      { id: 2, nombre: "Fase II - Factibilidad", descripcion: null },
      { id: 3, nombre: "Fase III - Diseños a detalle", descripcion: null },
    ]
  },

  async getFaseItems(faseId: number): Promise<FaseItemRequerido[]> {
    try {
      const data = await fetchAPI(`/fases/${faseId}/items`)
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getFaseItems")
    }
    await delay(300)
    return []
  },

  // Items Tipo
  async getItemsTipo(): Promise<ItemTipo[]> {
    try {
      const data = await fetchAPI("/items")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getItemsTipo")
    }
    await delay(300)
    return [
      { id: 1, nombre: "Ambiental Social", descripcion: null },
      { id: 2, nombre: "Costos Presupuestos", descripcion: null },
      { id: 3, nombre: "Dirección Coordinación", descripcion: null },
      { id: 4, nombre: "Estructuras", descripcion: null },
      { id: 5, nombre: "Geología", descripcion: null },
      { id: 6, nombre: "Pavimento", descripcion: null },
      { id: 7, nombre: "Predial", descripcion: null },
      { id: 8, nombre: "Taludes", descripcion: null },
      { id: 9, nombre: "Topografía", descripcion: null },
      { id: 10, nombre: "Túneles", descripcion: null },
    ]
  },

  // Enums
  async getEnums(): Promise<EnumsCatalog> {
    try {
      const data = await fetchAPI("/enums")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getEnums")
    }
    await delay(300)
    return {
      alcance: [
        { value: "Nuevo", label: "Nuevo" },
        { value: "Segunda calzada", label: "Segunda calzada" },
        { value: "Mejoramiento", label: "Mejoramiento" },
        { value: "Rehabilitación", label: "Rehabilitación" },
        { value: "Puesta a punto", label: "Puesta a punto" },
        { value: "Construcción", label: "Construcción" },
        { value: "Operación y mantenimiento", label: "Operación y mantenimiento" },
      ],
      zona: [
        { value: "Urbano", label: "Urbano" },
        { value: "Rural", label: "Rural" },
      ],
      tipo_terreno: [
        { value: "Plano", label: "Plano" },
        { value: "Ondulado", label: "Ondulado" },
        { value: "Montañoso", label: "Montañoso" },
        { value: "Escarpado", label: "Escarpado" },
      ],
      status: [
        { value: "active", label: "Activo" },
        { value: "inactive", label: "Inactivo" },
      ],
    }
  },

  async getAlcanceOptions(): Promise<EnumOption[]> {
    try {
      const data = await fetchAPI("/enums/alcance")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getAlcanceOptions")
    }
    await delay(300)
    return [
      { value: "Nuevo", label: "Nuevo" },
      { value: "Segunda calzada", label: "Segunda calzada" },
      { value: "Mejoramiento", label: "Mejoramiento" },
      { value: "Rehabilitación", label: "Rehabilitación" },
      { value: "Puesta a punto", label: "Puesta a punto" },
      { value: "Construcción", label: "Construcción" },
    ]
  },

  async getStatusOptions(): Promise<EnumOption[]> {
    try {
      const data = await fetchAPI("/enums/status")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getStatusOptions")
    }
    await delay(300)
    return [
      { value: "active", label: "Activo" },
      { value: "inactive", label: "Inactivo" },
    ]
  },

  async getZonaOptions(): Promise<EnumOption[]> {
    try {
      const data = await fetchAPI("/enums/zona")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getZonaOptions")
    }
    await delay(300)
    return [
      { value: "Urbano", label: "Urbano" },
      { value: "Rural", label: "Rural" },
    ]
  },

  async getTipoTerrenoOptions(): Promise<EnumOption[]> {
    try {
      const data = await fetchAPI("/enums/tipo-terreno")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getTipoTerrenoOptions")
    }
    await delay(300)
    return [
      { value: "Plano", label: "Plano" },
      { value: "Ondulado", label: "Ondulado" },
      { value: "Montañoso", label: "Montañoso" },
      { value: "Escarpado", label: "Escarpado" },
    ]
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
      console.log("Usando datos mock para getPrediction")
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

    // Generate mock items based on fase
    const itemsBase = [
      "Ambiental Social",
      "Costos Presupuestos",
      "Dirección Coordinación",
      "Estructuras",
      "Geología",
      "Pavimento",
      "Predial",
      "Taludes",
      "Topografía",
      "Túneles",
    ]

    const items = itemsBase.map((item) => ({
      item,
      causacion_estimada: Math.round(costoEstimado * (0.05 + Math.random() * 0.15)),
    }))

    return {
      costo_estimado: costoEstimado,
      costo_por_km: costoPorKm,
      confianza: 0.85,
      items,
    }
  },

  async predictCosto(data: PredictionRequest): Promise<PredictionResponse> {
    return this.getPrediction(data)
  },

  // Scenarios
  async getScenarios(): Promise<Scenario[]> {
    try {
      const data = await fetchAPI("/scenarios")
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para getScenarios")
    }
    await delay(300)
    // Return from localStorage if available
    const stored = localStorage.getItem("prediction_scenarios")
    return stored ? JSON.parse(stored) : []
  },

  async saveScenario(scenario: Omit<Scenario, "id" | "fecha_creacion">): Promise<Scenario> {
    try {
      const data = await fetchAPI("/scenarios", {
        method: "POST",
        body: JSON.stringify(scenario),
      })
      if (data) return data
    } catch (error) {
      console.log("Usando datos mock para saveScenario")
    }
    await delay(300)
    // Save to localStorage
    const newScenario: Scenario = {
      ...scenario,
      id: `scenario_${Date.now()}`,
      fecha_creacion: new Date().toISOString(),
    }
    const stored = localStorage.getItem("prediction_scenarios")
    const scenarios: Scenario[] = stored ? JSON.parse(stored) : []
    scenarios.push(newScenario)
    localStorage.setItem("prediction_scenarios", JSON.stringify(scenarios))
    return newScenario
  },

  async deleteScenario(scenarioId: string): Promise<boolean> {
    try {
      const data = await fetchAPI(`/scenarios/${scenarioId}`, {
        method: "DELETE",
      })
      if (data) return true
    } catch (error) {
      console.log("Usando datos mock para deleteScenario")
    }
    await delay(300)
    // Delete from localStorage
    const stored = localStorage.getItem("prediction_scenarios")
    if (stored) {
      const scenarios: Scenario[] = JSON.parse(stored)
      const filtered = scenarios.filter((s) => s.id !== scenarioId)
      localStorage.setItem("prediction_scenarios", JSON.stringify(filtered))
    }
    return true
  },

  // Charts endpoints
  async getValorPresenteCausacion(faseId?: number, alcance?: string, presentYear: number = 2025) {
    try {
      const params = new URLSearchParams()
      if (faseId) params.append('fase_id', faseId.toString())
      if (alcance) params.append('alcance', alcance)
      params.append('present_year', presentYear.toString())
      
      const data = await fetchAPI(`/charts/valor-presente-causacion?${params.toString()}`)
      if (data) return data
    } catch (error) {
      console.log("Error fetching valor presente causacion:", error)
    }
    return null
  },

  async getCausacionPorKm(faseId?: number, alcance?: string, presentYear: number = 2025) {
    try {
      const params = new URLSearchParams()
      if (faseId) params.append('fase_id', faseId.toString())
      if (alcance) params.append('alcance', alcance)
      params.append('present_year', presentYear.toString())
      
      const data = await fetchAPI(`/charts/causacion-por-km?${params.toString()}`)
      if (data) return data
    } catch (error) {
      console.log("Error fetching causacion por km:", error)
    }
    return null
  },

  // Estadísticas para el dashboard
  async getEstadisticas() {
    try {
      // Intentar obtener proyectos de la API real
      const proyectos = await fetchAPI("/proyectos")
      if (proyectos) {
        const totalProyectos = proyectos.length
        // Note: costo is now calculated from costos relationship on backend
        const inversionTotal = 1000000000 // Placeholder - should be fetched from backend with include_relations
        const kmTotales = proyectos.reduce((sum: number, p: Proyecto) => sum + p.longitud, 0)

        const fases = proyectos.reduce(
          (acc: Record<string, number>, p: Proyecto) => {
            const faseNombre = p.fase?.nombre || "Sin fase"
            acc[faseNombre] = (acc[faseNombre] || 0) + 1
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
      console.log("Usando datos mock para getEstadisticas")
    }

    await delay(400)
    const totalProyectos = mockProyectos.length
    // Calculate total from mockCostos
    const inversionTotal = mockCostos.reduce((sum, c) => sum + c.valor, 0)
    const kmTotales = mockProyectos.reduce((sum, p) => sum + p.longitud, 0)

    const fases = mockProyectos.reduce(
      (acc, p) => {
        const faseNombre = p.fase?.nombre || "Sin fase"
        acc[faseNombre] = (acc[faseNombre] || 0) + 1
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
