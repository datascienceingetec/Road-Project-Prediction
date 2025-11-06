import {
  Fase,
  Proyecto,
  UnidadFuncional,
  ItemTipo,
  CostoItem,
  FaseItemRequerido,
  EnumOption,
  EnumsCatalog,
  PredictionRequest,
  PredictionResponse,
  Scenario,
} from './types'

import {
  mockProyectos,
  mockUnidadesFuncionales,
  mockCostos,
  mockItemsTipo,
  mockAlcanceOptions,
  mockStatusOptions,
  mockZonaOptions,
  mockTipoTerrenoOptions,
} from './mockData'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const api = {
  // ---------- Proyectos ----------
  async getProyectos(): Promise<Proyecto[]> {
    await delay(500)
    return [...mockProyectos]
  },

  async getProyecto(codigo: string): Promise<Proyecto | null> {
    await delay(300)
    const found = mockProyectos.find((p) => p.codigo === codigo) || null
    if (found) {
      return {
        ...found,
        lat_inicio: 6.2442,
        lng_inicio: -75.5812,
        lat_fin: 6.2442,
        lng_fin: -75.5812,
      } as Proyecto
    }
    return null
  },

  async createProyecto(proyecto: Omit<Proyecto, 'id' | 'created_at'>): Promise<Proyecto> {
    await delay(500)
    const newProyecto: Proyecto = {
      ...proyecto,
      id: Math.max(0, ...mockProyectos.map((p) => p.id)) + 1,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }
    mockProyectos.push(newProyecto)
    return newProyecto
  },

  async updateProyecto(codigo: string, proyecto: Partial<Proyecto>): Promise<Proyecto | null> {
    await delay(500)
    const index = mockProyectos.findIndex((p) => p.codigo === codigo)
    if (index === -1) return null
    mockProyectos[index] = { ...mockProyectos[index], ...proyecto }
    return mockProyectos[index]
  },

  async changeStatusProyecto(id: number, status: 'active' | 'inactive'): Promise<boolean> {
    await delay(500)
    const index = mockProyectos.findIndex((p) => p.id === id)
    if (index === -1) return false
    mockProyectos[index].status = status
    return true
  },

  async deleteProyecto(id: number): Promise<boolean> {
    await delay(500)
    const index = mockProyectos.findIndex((p) => p.id === id)
    if (index === -1) return false
    mockProyectos.splice(index, 1)
    return true
  },

  // ---------- Unidades Funcionales ----------
  async getUnidadesFuncionales(codigo: string): Promise<UnidadFuncional[]> {
    await delay(300)
    const proyecto = mockProyectos.find((p) => p.codigo === codigo)
    return proyecto ? mockUnidadesFuncionales.filter((u) => u.proyecto_id === proyecto.id) : []
  },

  async createUnidadFuncional(
    codigo: string,
    uf: Omit<UnidadFuncional, 'id' | 'proyecto_id'>
  ): Promise<UnidadFuncional> {
    await delay(400)
    const proyecto = mockProyectos.find((p) => p.codigo === codigo)
    if (!proyecto) throw new Error('Proyecto no encontrado')
    const newUF: UnidadFuncional = {
      ...uf,
      proyecto_id: proyecto.id,
      id: Math.max(0, ...mockUnidadesFuncionales.map((u) => u.id)) + 1,
    }
    mockUnidadesFuncionales.push(newUF)
    return newUF
  },

  async deleteUnidadFuncional(id: number): Promise<boolean> {
    await delay(300)
    const index = mockUnidadesFuncionales.findIndex((u) => u.id === id)
    if (index === -1) return false
    mockUnidadesFuncionales.splice(index, 1)
    return true
  },

  // ---------- Costos (Items) ----------
  async getCostos(codigo: string): Promise<CostoItem[]> {
    await delay(300)
    const proyecto = mockProyectos.find((p) => p.codigo === codigo)
    return proyecto ? mockCostos.filter((c) => c.proyecto_id === proyecto.id) : []
  },

  async createOrUpdateCostos(
    _codigo: string,
    costos: Array<{ item_tipo_id: number; valor: number }>
  ): Promise<{ created: number; updated: number }> {
    await delay(400)
    // Simulación simple
    return { created: costos.length, updated: 0 }
  },

  // ---------- Fases ----------
  async getFases(): Promise<Fase[]> {
    await delay(300)
    return [
      { id: 1, nombre: 'Fase I - Prefactibilidad', descripcion: null },
      { id: 2, nombre: 'Fase II - Factibilidad', descripcion: null },
      { id: 3, nombre: 'Fase III - Diseños a detalle', descripcion: null },
    ]
  },

  async getFaseItems(_faseId: number): Promise<FaseItemRequerido[]> {
    await delay(300)
    return []
  },

  // ---------- Items Tipo ----------
  async getItemsTipo(): Promise<ItemTipo[]> {
    await delay(300)
    return [...mockItemsTipo]
  },

  // ---------- Enums ----------
  async getEnums(): Promise<EnumsCatalog> {
    await delay(300)
    return {
      alcance: [...mockAlcanceOptions],
      zona: [...mockZonaOptions],
      tipo_terreno: [...mockTipoTerrenoOptions],
      status: [...mockStatusOptions],
    }
  },

  async getAlcanceOptions(): Promise<EnumOption[]> {
    await delay(300)
    return [...mockAlcanceOptions]
  },

  async getStatusOptions(): Promise<EnumOption[]> {
    await delay(300)
    return [...mockStatusOptions]
  },

  async getZonaOptions(): Promise<EnumOption[]> {
    await delay(300)
    return [...mockZonaOptions]
  },

  async getTipoTerrenoOptions(): Promise<EnumOption[]> {
    await delay(300)
    return [...mockTipoTerrenoOptions]
  },

  // ---------- Predicción ----------
  async getPrediction(data: PredictionRequest): Promise<PredictionResponse> {
    await delay(800)
    const baseCostPerKm = 6_000_000
    let multiplier = 1.0

    let costoEstimado = 0
    let costoPorKm = 0
    if (data.unidades_funcionales?.length) {
      const totalLongitud = data.unidades_funcionales.reduce((sum, uf) => sum + uf.longitud_km, 0)
      costoEstimado = Math.round(baseCostPerKm * totalLongitud * multiplier)
      costoPorKm = Math.round(costoEstimado / totalLongitud)
    }

    const itemsBase = [
      'Ambiental Social',
      'Costos Presupuestos',
      'Dirección Coordinación',
      'Estructuras',
      'Geología',
      'Pavimento',
      'Predial',
      'Taludes',
      'Topografía',
      'Túneles',
    ]

    const items = itemsBase.map((item) => ({
      item,
      causacion_estimada: Math.round(costoEstimado * (0.05 + Math.random() * 0.15)),
    }))

    return { costo_estimado: costoEstimado, costo_por_km: costoPorKm, confianza: 0.85, items }
  },

  async predictCosto(data: PredictionRequest): Promise<PredictionResponse> {
    return this.getPrediction(data)
  },

  // ---------- Scenarios ----------
  async getScenarios(): Promise<Scenario[]> {
    await delay(300)
    // Soporte localStorage (solo navegador)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('prediction_scenarios')
      return stored ? JSON.parse(stored) : []
    }
    return []
  },

  async saveScenario(scenario: Omit<Scenario, 'id' | 'fecha_creacion'>): Promise<Scenario> {
    await delay(300)
    const newScenario: Scenario = {
      ...scenario,
      id: `scenario_${Date.now()}`,
      fecha_creacion: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('prediction_scenarios')
      const scenarios: Scenario[] = stored ? JSON.parse(stored) : []
      scenarios.push(newScenario)
      localStorage.setItem('prediction_scenarios', JSON.stringify(scenarios))
    }
    return newScenario
  },

  async deleteScenario(scenarioId: string): Promise<boolean> {
    await delay(300)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('prediction_scenarios')
      if (stored) {
        const scenarios: Scenario[] = JSON.parse(stored)
        const filtered = scenarios.filter((s) => s.id !== scenarioId)
        localStorage.setItem('prediction_scenarios', JSON.stringify(filtered))
      }
    }
    return true
  },

  // ---------- Charts ----------
  async getValorPresenteCausacion(_faseId?: number, _alcance?: string, _presentYear: number = 2025) {
    // Devuelve null si no quieres mocks aquí; o arma un mock simple
    return null
  },

  async getCausacionPorKm(_faseId?: number, _alcance?: string, _presentYear: number = 2025) {
    return null
  },
}
