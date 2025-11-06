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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

async function fetchAPI<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
  })
  if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`)
  return response.json()
}

export const api = {
  // ---------- Proyectos ----------
  getProyectos(): Promise<Proyecto[]> {
    return fetchAPI('/proyectos')
  },

  getProyecto(codigo: string): Promise<Proyecto | null> {
    return fetchAPI(`/proyectos/${codigo}`)
  },

  createProyecto(proyecto: Omit<Proyecto, 'id' | 'created_at'>): Promise<Proyecto> {
    return fetchAPI('/proyectos', { method: 'POST', body: JSON.stringify(proyecto) })
  },

  updateProyecto(codigo: string, proyecto: Partial<Proyecto>): Promise<Proyecto> {
    return fetchAPI(`/proyectos/${codigo}`, { method: 'PUT', body: JSON.stringify(proyecto) })
  },

  async changeStatusProyecto(codigo: string, status: 'active' | 'inactive'): Promise<boolean> {
    await fetchAPI(`/proyectos/${codigo}`, { method: 'PUT', body: JSON.stringify({ status }) })
    return true
  },

  async deleteProyecto(id: number): Promise<boolean> {
    await fetchAPI(`/proyectos/${id}`, { method: 'DELETE' })
    return true
  },

  // ---------- Unidades Funcionales ----------
  getUnidadesFuncionales(codigo: string): Promise<UnidadFuncional[]> {
    return fetchAPI(`/proyectos/${codigo}/unidades-funcionales`)
  },

  createUnidadFuncional(
    uf: Omit<UnidadFuncional, 'id'>
  ): Promise<UnidadFuncional> {
    return fetchAPI(`/unidades-funcionales/`, {
      method: 'POST',
      body: JSON.stringify(uf),
    })
  },

  updateUnidadFuncional(
    id: number,
    unidadFuncional: Partial<UnidadFuncional>
  ): Promise<UnidadFuncional> {
    return fetchAPI(`/unidades-funcionales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(unidadFuncional),
    })
  },

  async deleteUnidadFuncional(id: number): Promise<boolean> {
    await fetchAPI(`/unidades-funcionales/${id}`, { method: 'DELETE' })
    return true
  },

  // ---------- Costos (Items) ----------
  getCostos(codigo: string): Promise<CostoItem[]> {
    return fetchAPI(`/proyectos/${codigo}/costos`)
  },

  createOrUpdateCostos(
    codigo: string,
    costos: Array<{ item_tipo_id: number; valor: number }>
  ): Promise<{ created: number; updated: number }> {
    return fetchAPI(`/proyectos/${codigo}/costos`, {
      method: 'POST',
      body: JSON.stringify({ costos }),
    })
  },

  // ---------- Fases ----------
  getFases(): Promise<Fase[]> {
    return fetchAPI('/fases')
  },

  getFaseItems(faseId: number): Promise<FaseItemRequerido[]> {
    return fetchAPI(`/fases/${faseId}/items`)
  },

  // ---------- Items Tipo ----------
  getItemsTipo(): Promise<ItemTipo[]> {
    // Tu código usa "/items" (no "/items-tipo"), lo respeto.
    return fetchAPI('/items')
  },

  // ---------- Enums ----------
  getEnums(): Promise<EnumsCatalog> {
    return fetchAPI('/enums')
  },

  getAlcanceOptions(): Promise<EnumOption[]> {
    return fetchAPI('/enums/alcance')
  },

  getStatusOptions(): Promise<EnumOption[]> {
    return fetchAPI('/enums/status')
  },

  getZonaOptions(): Promise<EnumOption[]> {
    return fetchAPI('/enums/zona')
  },

  getTipoTerrenoOptions(): Promise<EnumOption[]> {
    return fetchAPI('/enums/tipo-terreno')
  },

  // ---------- Predicción ----------
  getPrediction(data: PredictionRequest): Promise<PredictionResponse> {
    console.log(data) 
    return fetchAPI('/predict/', { method: 'POST', body: JSON.stringify(data) })
  },

  predictCosto(data: PredictionRequest): Promise<PredictionResponse> {
    return this.getPrediction(data)
  },

  // ---------- Scenarios ----------
  getScenarios(): Promise<Scenario[]> {
    return fetchAPI('/scenarios')
  },

  saveScenario(scenario: Omit<Scenario, 'id' | 'fecha_creacion'>): Promise<Scenario> {
    return fetchAPI('/scenarios', { method: 'POST', body: JSON.stringify(scenario) })
  },

  async deleteScenario(scenarioId: string): Promise<boolean> {
    await fetchAPI(`/scenarios/${scenarioId}`, { method: 'DELETE' })
    return true
  },

  // ---------- Charts ----------
  async getValorPresenteCausacion(faseId?: number, alcance?: string, presentYear: number = 2025) {
    const params = new URLSearchParams()
    if (faseId) params.append('fase_id', String(faseId))
    if (alcance) params.append('alcance', alcance)
    params.append('present_year', String(presentYear))
    return fetchAPI(`/charts/valor-presente-causacion?${params.toString()}`)
  },

  async getCausacionPorKm(faseId?: number, alcance?: string, presentYear: number = 2025) {
    const params = new URLSearchParams()
    if (faseId) params.append('fase_id', String(faseId))
    if (alcance) params.append('alcance', alcance)
    params.append('present_year', String(presentYear))
    return fetchAPI(`/charts/causacion-por-km?${params.toString()}`)
  },

  async getItemComparison(itemTipoId: number, faseId?: number, presentYear: number = 2025) {
    const params = new URLSearchParams()
    params.append('item_tipo_id', String(itemTipoId))
    if (faseId) params.append('fase_id', String(faseId))
    params.append('present_year', String(presentYear))
    return fetchAPI(`/charts/item-comparison?${params.toString()}`)
  },

  // ---------- Model Training ----------
  async trainModel() {
    return fetchAPI('/predict/train', { method: 'POST' })
  },
}
