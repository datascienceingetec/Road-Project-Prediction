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
  proyecto_nombre: string
  fase_id: number
  ubicacion: string
  unidades_funcionales?: Omit<UnidadFuncional, "id" | "proyecto_id">[]
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
  fase_id: number
  ubicacion: string
  costo_total: number
  fecha_creacion: string
  unidades_funcionales?: Omit<UnidadFuncional, "id" | "proyecto_id">[]
  items?: any[]
}
