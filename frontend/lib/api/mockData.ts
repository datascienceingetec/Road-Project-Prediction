import { Proyecto, UnidadFuncional, CostoItem, Fase, FaseItemRequerido, ItemTipo, PredictionResponse, Scenario, EnumOption } from './types';

// Datos de ejemplo basados en las respuestas reales
export const mockProyectos: Proyecto[] = [
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
];

export const mockUnidadesFuncionales: UnidadFuncional[] = [
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
];

export const mockCostos: CostoItem[] = [
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
];

export const mockItemsTipo: ItemTipo[] = [
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

export const mockAlcanceOptions: EnumOption[] = [
  { value: "Nuevo", label: "Nuevo" },
  { value: "Segunda calzada", label: "Segunda calzada" },
  { value: "Mejoramiento", label: "Mejoramiento" },
  { value: "Rehabilitación", label: "Rehabilitación" },
  { value: "Puesta a punto", label: "Puesta a punto" },
  { value: "Construcción", label: "Construcción" },
]

export const mockStatusOptions: EnumOption[] = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
]

export const mockZonaOptions: EnumOption[] = [
  { value: "Rural", label: "Rural" },
  { value: "Montañoso", label: "Montañoso" },
  { value: "Plano", label: "Plano" },
]

export const mockTipoTerrenoOptions: EnumOption[] = [
  { value: "Plano", label: "Plano" },
  { value: "Ondulado", label: "Ondulado" },
]

// Simular delay de API
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper para simular respuestas de API con delay
export const simulateApiCall = async <T>(data: T, errorRate: number = 0): Promise<T> => {
  await delay(300 + Math.random() * 700); // Random delay between 300-1000ms
  if (Math.random() < errorRate) {
    throw new Error('Simulated API error');
  }
  return JSON.parse(JSON.stringify(data)); // Deep clone
};

// Helper para simular respuestas de error
export const simulateError = (message: string) => {
  return new Error(`Simulated error: ${message}`);
};
