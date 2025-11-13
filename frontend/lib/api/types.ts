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
  costo_total: number
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

export interface PredictionItemResult {
  item: string
  item_tipo_id: number | null
  causacion_estimada: number
  metrics?: MetricRow | MetricRow[]
  predicted?: boolean  // Indica si se pudo predecir o es 0 por defecto
}

export interface UnidadFuncionalPrediction {
  unidad_funcional: number
  longitud_km: number
  alcance: string
  costo_estimado: number
  costo_por_km: number
  confianza: number
  items: PredictionItemResult[]
}

export interface PredictionResponse {
  proyecto_nombre: string
  fase_id: number
  ubicacion: string
  costo_total: number
  costo_total_por_km: number
  longitud_total_km: number
  num_unidades_funcionales: number
  resultados: UnidadFuncionalPrediction[]
}

export interface MetricRow {
  alcance: string
  model: string
  r2?: number
  mae?: number
  rmse?: number
  mape?: number
  n_samples?: number
}

// Training endpoint types
export interface TrainingRequest {
  fase: 'II' | 'III'
}

export interface TrainingSummaryItem {
  Target: string
  Alcance: string
  Model: string
  'R²': number
  MAE: number
  RMSE: number
  'MAPE (%)': number
  n_samples: number
  log_transform: string
}

export interface TrainingMetadata {
  fase: string
  n_samples: number
  training_date: string
}

export interface TrainingResponse {
  success: boolean
  fase: string
  models_path: string
  summary?: TrainingSummaryItem[]
  metadata?: TrainingMetadata
  error?: string
}

// Available models types
export interface AvailableModel {
  fase: 'I' | 'II' | 'III'
  fase_id: number
  fase_nombre: string
  available: boolean
  metadata?: TrainingMetadata | null
}

export interface AvailableModelsResponse {
  models: AvailableModel[]
}
