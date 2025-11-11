# Sistema de Predicción ML con Arquitectura por Capas

## Descripción General

Este sistema implementa endpoints de entrenamiento y predicción de modelos de Machine Learning para estimación de costos de proyectos viales. Utiliza una **arquitectura por capas** con patrón adaptador para separar responsabilidades y facilitar la futura migración del esquema legacy al nuevo esquema de base de datos.

## Características Principales

- **Trabaja con `fase_id`**: Todo el sistema usa IDs de fase de la base de datos actual
- **Separación de responsabilidades**: Controladores HTTP, servicios de negocio, y adapters de infraestructura
- **Métricas múltiples**: Soporte para múltiples métricas por item (diferentes alcances)
- **Interface desacoplada**: El adapter maneja el mapeo interno al sistema legacy

## Arquitectura

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                 HTTP Layer (Flask Routes)                   │
│  - Recibe fase_id del cliente                               │
│  - Validación HTTP y manejo de errores                      │
│  /api/v1/predict/train  │  /api/v1/predict/                 │
└──────────────┬──────────────────────┬───────────────────────┘
               │ fase_id              │ fase_id
               v                      v
┌─────────────────────────────────────────────────────────────┐
│                Service Layer (Business Logic)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PredictionService                                     │ │
│  │  - Orquestación completa de predicción                 │ │
│  │  - Validación de negocio                               │ │
│  │  - Procesamiento de unidades funcionales               │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │ fase_id                                     │
│  ┌────────────▼───────────┐                                 │
│  │  ModelService          │                                 │
│  │  - Gestión de modelos  │                                 │
│  │  - Parsing de métricas │                                 │
│  └────────────┬───────────┘                                 │
└───────────────┼─────────────────────────────────────────────┘
                │ fase_id
                v
┌─────────────────────────────────────────────────────────────┐
│           Adapter Layer (Infrastructure)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ModelAdapterInterface (ABC)                           │ │
│  │  - train_models(fase_id: int)                          │ │
│  │  - predict(fase_id: int, ...)                          │ │
│  │  - save_models(fase_id: int, ...)                      │ │
│  │  - load_models(fase_id: int)                           │ │
│  └────────────┬───────────────────────────────────────────┘ │
│               │                                             │
│  ┌────────────▼───────────┐                                 │
│  │  LegacyModelAdapter    │                                 │
│  │  - _map_fase_id_to_code() ← MAPEO INTERNO              │ │
│  │  - Encapsula sistema legacy                            │ │
│  └────────────┬───────────┘                                 │
└───────────────┼─────────────────────────────────────────────┘
                │ fase_code ('II', 'III')
                v
┌─────────────────────────────────────────────────────────────┐
│         ModelsManagement (Legacy System)                    │
│  - Uses old DB schema (PROYECTOS, ITEM_FASE_III, etc.)      │
│  - Hardcoded logic for Fase II/III                          │
└─────────────────────────────────────────────────────────────┘
```

### Patrón Adaptador

El sistema usa el patrón adaptador para:

1. **Encapsular servicios legacy**: `LegacyModelAdapter` envuelve `ModelsManagement`
2. **Definir interfaz estándar**: `ModelAdapterInterface` define métodos abstractos
3. **Facilitar migración futura**: Se puede crear `NewSchemaModelAdapter` sin cambiar las rutas

## Endpoints

### 1. Entrenamiento de Modelos

**POST** `/api/v1/predict/train`

Entrena modelos de ML para una fase específica y los guarda en disco.

#### Request Body

```json
{
  "fase_id": 3
}
```

- `fase_id`: ID de fase de la base de datos (2 para Factibilidad, 3 para Diseño Detallado)

#### Response (Success)

```json
{
  "success": true,
  "fase": "III",
  "fase_id": 3,
  "models_path": "data/models/fase_III_models.pkl",
  "summary": [
    {
      "Target": "2.1 - INFORMACIÓN GEOGRÁFICA",
      "Alcance": "Segunda calzada",
      "Model": "ElasticNet",
      "R²": 1.0,
      "MAE": 452.54,
      "RMSE": 479.57,
      "MAPE (%)": 0.033,
      "n_samples": 4,
      "log_transform": "none"
    }
    // ... más items con diferentes alcances
  ],
  "metadata": {
    "fase": "III",
    "n_samples": 51,
    "training_date": "2024-11-11T12:00:00"
  }
}
```

#### Response (Error)

```json
{
  "success": false,
  "error": "Error al entrenar modelos: ..."
}
```

#### Proceso Interno

1. **Controller** recibe `fase_id` y delega a `ModelService`
2. **ModelService** llama a `adapter.train_models(fase_id)`
3. **LegacyModelAdapter** mapea `fase_id` → código legacy ('II', 'III')
4. **LegacyModelAdapter** llama a `ModelsManagement.prepare_data()` y `train_models()`
5. **LegacyModelAdapter** guarda modelos con métricas en `data/models/fase_{codigo}_models.pkl`
6. **ModelService** retorna resultado con `fase_id` y código para compatibilidad

### 2. Predicción de Costos

**POST** `/api/v1/predict/`

Realiza predicciones de costos usando modelos entrenados.

#### Request Body

```json
{
  "proyecto_nombre": "Proyecto Ejemplo",
  "fase_id": 3,
  "ubicacion": "Bogotá",
  "unidades_funcionales": [
    {
      "numero": 1,
      "longitud_km": 12.0,
      "puentes_vehiculares_und": 4,
      "puentes_vehiculares_mt2": 6292,
      "puentes_peatonales_und": 10,
      "puentes_peatonales_mt2": 0,
      "tuneles_und": 0,
      "tuneles_km": 0,
      "alcance": "Segunda calzada",
      "zona": "",
      "tipo_terreno": ""
    }
  ]
}
```

#### Response (Success)

```json
{
  "proyecto_nombre": "Proyecto Ejemplo",
  "fase_id": 3,
  "ubicacion": "Bogotá",
  "costo_total": 123456789.0,
  "costo_total_por_km": 10288065.75,
  "longitud_total_km": 12.0,
  "num_unidades_funcionales": 1,
  "resultados": [
    {
      "unidad_funcional": 1,
      "longitud_km": 12.0,
      "alcance": "Segunda calzada",
      "costo_estimado": 123456789.0,
      "costo_por_km": 10288065.75,
      "confianza": 0.75,
      "items": [
        {
          "item": "2.1 - INFORMACIÓN GEOGRÁFICA",
          "item_tipo_id": 5,
          "causacion_estimada": 1598831.85,
          "predicted": true,
          "is_parent": false,
          "metrics": [
            {
              "alcance": "Segunda calzada",
              "model": "ElasticNet",
              "r2": 1.0,
              "mae": 452.54,
              "rmse": 479.57,
              "mape": 0.033,
              "n_samples": 4
            },
            {
              "alcance": "Mejoramiento",
              "model": "Ridge",
              "r2": 0.85,
              "mae": 1200.0,
              "rmse": 1500.0,
              "mape": 5.2,
              "n_samples": 8
            }
          ]
        }
        // ... más items
      ]
    }
    // ... más unidades funcionales
  ]
}
```

#### Response (Error)

```json
{
  "error": "No se encontraron modelos entrenados para la fase 'III'. Por favor, entrene los modelos primero usando el endpoint /train."
}
```

#### Proceso Interno

1. **Controller** recibe request y delega a `PredictionService`
2. **PredictionService** valida `fase_id` y carga modelos vía `ModelService`
3. **ModelService** usa `adapter.load_models(fase_id)` y `parse_training_summary()`
4. **LegacyModelAdapter** mapea `fase_id` → código legacy y carga pickle
5. **PredictionService** procesa cada unidad funcional:
   - Prepara parámetros de predicción
   - Llama a `adapter.predict(fase_id, models, **params)`
   - Formatea items con predicciones y métricas múltiples
   - Calcula valores de items padre (suma de hijos)
   - Calcula totales por UF
6. **PredictionService** construye respuesta final con totales del proyecto

## Almacenamiento de Modelos

### Ubicación

```
backend/
  data/
    models/
      fase_II_models.pkl
      fase_III_models.pkl
```

### Formato

Los modelos se guardan como archivos pickle con la siguiente estructura:

```python
{
    'models': {
        '1 - TRANSPORTE': {...},
        '2.1 - INFORMACIÓN GEOGRÁFICA': {...},
        # ... más modelos
    },
    'metadata': {
        'fase': 'III',
        'n_samples': 51,
        'training_date': '2024-11-11T12:00:00'
    }
}
```

## Mapeo Fase ID → Código Legacy

El `LegacyModelAdapter` maneja internamente el mapeo de `fase_id` a códigos legacy:

```python
class LegacyModelAdapter:
    PHASE_NAME_TO_CODE = {
        'Prefactibilidad': 'I',
        'Factibilidad': 'II',
        'Diseño Detallado': 'III'
    }
    
    def _map_fase_id_to_code(self, fase_id: int) -> str:
        """Mapea fase_id de BD → código legacy"""
        fase = Fase.query.get(fase_id)
        for name_key, code in self.PHASE_NAME_TO_CODE.items():
            if name_key.lower() in fase.nombre.lower():
                return code
        raise ValueError(f"Fase '{fase.nombre}' no soportada")
```

## Métricas Múltiples por Item

El sistema soporta múltiples métricas por item (diferentes alcances):

```python
# Estructura en pickle
{
    'summary': [
        {
            'Target': '2.2 - TRAZADO Y DISEÑO GEOMÉTRICO',
            'Alcance': 'Segunda calzada',
            'Model': 'SVR',
            'R²': 0.492,
            'MAE': 999906.336,
            'RMSE': 1874177.57,
            'MAPE (%)': 29.641,
            'n_samples': 16
        },
        {
            'Target': '2.2 - TRAZADO Y DISEÑO GEOMÉTRICO',
            'Alcance': 'Mejoramiento',
            'Model': 'Ridge',
            'R²': 0.338,
            'MAE': 4954865.0,
            'RMSE': 9490122.0,
            'MAPE (%)': 36.91,
            'n_samples': 10
        }
    ]
}

# Respuesta en API (agrupadas por item)
"metrics": [
    {
        "alcance": "Segunda calzada",
        "model": "SVR",
        "r2": 0.492,
        "mae": 999906.336,
        "rmse": 1874177.57,
        "mape": 29.641,
        "n_samples": 16
    },
    {
        "alcance": "Mejoramiento",
        "model": "Ridge",
        "r2": 0.338,
        "mae": 4954865.0,
        "rmse": 9490122.0,
        "mape": 36.91,
        "n_samples": 10
    }
]
```

## Migración Futura

### Paso 1: Crear NewSchemaModelAdapter

```python
class NewSchemaModelAdapter(ModelAdapterInterface):
    """
    Adapter que trabaja directamente con el nuevo esquema.
    No necesita mapeo - usa fase_id directamente.
    """
    
    def train_models(self, fase_id: int) -> Dict[str, Any]:
        # ✅ Usa fase_id directamente
        # Leer datos desde Proyecto, UnidadFuncional, CostoItem
        # Entrenar modelos dinámicamente basado en FaseItemRequerido
        return self.ml_service.train(fase_id)
    
    def predict(self, fase_id: int, models: Dict[str, Any], **kwargs) -> Dict[str, float]:
        # ✅ Usa fase_id directamente
        return self.ml_service.predict(fase_id, models, **kwargs)
    
    def save_models(self, fase_id: int, models: Dict, **kwargs) -> str:
        # ✅ Usa fase_id directamente
        return self.storage.save(f"models_fase_{fase_id}.pkl", models)
    
    def load_models(self, fase_id: int) -> Optional[Dict]:
        # ✅ Usa fase_id directamente
        return self.storage.load(f"models_fase_{fase_id}.pkl")
```

### Paso 2: Actualizar ModelService

```python
# En producción, cambiar a:
class ModelService:
    def __init__(self):
        self.adapter = NewSchemaModelAdapter()  # ← Solo este cambio
        # El resto del código no cambia
```

### Paso 3: Deprecar servicios legacy

Una vez migrado, se pueden eliminar:
- `ModelsManagement`
- `EDA`
- `PresentValue`
- Tablas antiguas (`ITEM_FASE_I`, `ITEM_FASE_II`, `ITEM_FASE_III`)

## Ventajas de la Arquitectura

### 1. Separación de Responsabilidades
- **HTTP Layer**: Solo manejo de requests/responses
- **Service Layer**: Lógica de negocio pura
- **Adapter Layer**: Abstracción de infraestructura

### 2. Interface Desacoplada
- La interface usa `fase_id` (dominio actual)
- El adapter maneja mapeo interno al sistema legacy
- Facilita migración futura sin cambios en servicios

### 3. Testabilidad
- Servicios testeable sin Flask
- Mock adapters para pruebas unitarias
- Lógica de negocio aislada

### 4. Extensibilidad
- Fácil agregar nuevos adapters
- Reutilización de servicios desde otros contextos
- Migración gradual sin breaking changes

### 5. Métricas Avanzadas
- Soporte para múltiples modelos por item
- Métricas detalladas por alcance
- Tabla de métricas en frontend

## Consideraciones

### Servicios Legacy

Los siguientes servicios usan el esquema antiguo y se mantienen por ahora:

- `app/services/eda.py`
- `app/services/present_value.py`
- `app/services/models_management.py`
- Notebooks en `backend/notebooks/`

### Limitaciones Actuales

1. **Solo Fase III**: Fase II no está completamente implementada
2. **Modelos estáticos**: No hay versionado de modelos
3. **Sin validación de alcance**: No valida si el alcance existe en datos de entrenamiento
4. **Dependencia legacy**: Aún depende de `ModelsManagement` y esquema antiguo

### Mejoras Futuras

1. **Versionado de modelos**: Guardar múltiples versiones con timestamps
2. **Validación de entrada**: Validar alcance, rangos de valores, etc.
3. **Cache de modelos**: Mantener modelos en memoria para mejor performance
4. **A/B Testing**: Comparar modelos legacy vs nuevos
5. **Logging estructurado**: Registrar todas las predicciones para análisis
6. **Migración completa**: Implementar `NewSchemaModelAdapter`
7. **Intervalos de confianza**: Agregar incertidumbre a las predicciones

## Ejemplo de Uso

### 1. Entrenar Modelos

```bash
curl -X POST http://localhost:5000/api/v1/predict/train \
  -H "Content-Type: application/json" \
  -d '{"fase_id": 3}'
```

### 2. Hacer Predicción

```bash
curl -X POST http://localhost:5000/api/v1/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "proyecto_nombre": "Proyecto Test",
    "fase_id": 3,
    "ubicacion": "Bogotá",
    "unidades_funcionales": [
      {
        "numero": 1,
        "longitud_km": 12.0,
        "puentes_vehiculares_und": 4,
        "puentes_vehiculares_mt2": 6292,
        "puentes_peatonales_und": 10,
        "puentes_peatonales_mt2": 0,
        "tuneles_und": 0,
        "tuneles_km": 0,
        "alcance": "Segunda calzada"
      }
    ]
  }'
```

## TypeScript Types

Ver `frontend/lib/api/types.ts` para tipos completos:

```typescript
interface TrainingRequest {
  fase_id: number
}

interface TrainingResponse {
  success: boolean
  fase: string
  fase_id: number
  models_path: string
  summary?: TrainingSummaryItem[]
  metadata?: TrainingMetadata
  error?: string
}

interface PredictionRequest {
  proyecto_nombre: string
  fase_id: number
  ubicacion: string
  unidades_funcionales?: UnidadFuncional[]
}

interface UnidadFuncionalPrediction {
  unidad_funcional: number
  longitud_km: number
  alcance: string
  costo_estimado: number
  costo_por_km: number
  confianza: number
  items: PredictionItem[]
}

interface PredictionResponse {
  proyecto_nombre: string
  fase_id: number
  ubicacion: string
  costo_total: number
  costo_total_por_km: number
  longitud_total_km: number
  num_unidades_funcionales: number
  resultados: UnidadFuncionalPrediction[]
}
```

## Referencias

- **Esquema Antiguo**: `backend/docs/DB_OLD_SCHEMA.md`
- **Esquema Nuevo**: `backend/docs/DB_SCHEMA.md`
- **Notebook de Entrenamiento**: `backend/notebooks/models_management.ipynb`
- **Servicio Legacy**: `backend/app/services/models_management.py`
