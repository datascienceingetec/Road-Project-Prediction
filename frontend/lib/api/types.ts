export interface Fase {
  id: number
  nombre: string
  descripcion: string | null
}

export interface Proyecto {
  id: number
  nombre: string
  codigo: string
  longitud: number  // Computed from unidades_funcionales
  num_unidades_funcionales: number  // Computed count
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
  parent_id: number | null
  obligatorio: boolean
  descripcion: string | null
  fase: Fase | null
  item_tipo: ItemTipo | null
  has_children?: boolean
  valor_calculado?: number
  children?: FaseItemRequerido[]
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

export interface FunctionalUnitFormData {
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

export interface PredictionRequest {
  proyecto_nombre: string
  fase_id: number
  ubicacion: string
  unidades_funcionales?: Omit<UnidadFuncional, "id" | "proyecto_id">[]
}

export interface PredictionResponse {
  proyecto_nombre: string
  fase_id: number
  ubicacion: string
  costo_estimado: number
  costo_por_km: number
  confianza: number
  items?: Array<{
    item: string
    item_tipo_id: number
    causacion_estimada: number
    metrics?: PredictionMetrics
  }>
}

export interface PredictionMetrics {
  r2?: number
  mae?: number
  rmse?: number
  mape?: number
  median_ae?: number
  max_error?: number
}
