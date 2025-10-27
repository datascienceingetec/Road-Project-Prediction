# 🏗️ Arquitectura del Sistema

## Resumen

Este proyecto implementa una arquitectura modular de **tres capas**:

1. **Frontend (planificado)**: React + React Router (SPA con CRUD y consumo de API REST)
2. **Backend**: Flask REST API estructurada en blueprints
3. **Datos**: SQLite (base local embebida con tres tablas relacionadas)

---

## Estructura General

```
backend/
├── app/
│   ├── routes/                → Blueprints de la API
│   ├── models/                → Lógica de acceso a datos
│   ├── services/              → Lógica de negocio (EDA, predicción, cálculos)
│   ├── templates/             → Plantillas de prueba (HTML opcional)
│   ├── static/                → Recursos estáticos
│   └── config.py              → Configuración global
│
├── instance/                  → Base de datos SQLite
├── data/                      → Archivos CSV / XLSX base
├── notebooks/                 → Notebooks de EDA y entrenamiento
└── run.py                     → Punto de entrada de la aplicación Flask
```

---

## Modelo de Datos

```
proyecto (tabla principal)
  ├── codigo (TEXT UNIQUE)
  ├── unidades_funcionales (1:N) ── FK: codigo
  └── items_fase (1:N por fase) ── FK: codigo
```

**Relaciones**

* Un proyecto puede tener múltiples unidades funcionales.
* Cada proyecto tiene conjuntos de ítems de costo, agrupados por fase.
* Eliminación en cascada definida a nivel de base de datos.

---

## Flujo de Datos

### 1. Operación CRUD básica

```
React → /api/proyectos
       ↓
Flask → Proyecto.get_all()
       ↓
SQLite (lectura / escritura)
```

### 2. Items y Unidades Funcionales

```
React → /api/proyectos/<codigo>/unidades-funcionales
React → /api/proyectos/<codigo>/items?fase=fase_i
```

### 3. Predicción

```
React → /api/predict
Flask → modelo entrenado (EDA/ML)
       ↓
Respuesta JSON con costo estimado
```

---

## API REST

### Endpoints por Recurso

**Proyectos**

* `GET /api/proyectos` → Lista todos los proyectos
* `GET /api/proyectos/<id>` → Obtiene por ID numérico
* `GET /api/proyectos/codigo/<codigo>` → Obtiene por código
* `POST /api/proyectos` → Crea un proyecto
* `PUT /api/proyectos/<id>` → Actualiza un proyecto
* `DELETE /api/proyectos/<id>` → Elimina un proyecto

**Unidades Funcionales**

* `GET /api/proyectos/<codigo>/unidades-funcionales` → Lista UFs del proyecto
* `POST /api/proyectos/<codigo>/unidades-funcionales` → Crea una UF
* `DELETE /api/proyectos/<codigo>/unidades-funcionales/<id>` → Elimina una UF

**Items**

* `GET /api/proyectos/<codigo>/items?fase=fase_i` → Obtiene ítems por fase
* `POST /api/proyectos/<codigo>/items?fase=fase_i` → Crea o actualiza ítems
* `PUT /api/proyectos/<codigo>/items?fase=fase_i` → Actualiza ítems existentes
* `DELETE /api/proyectos/<codigo>/items?fase=fase_i` → Elimina ítems de una fase

**Predicción**

* `POST /api/predict` → Calcula costo estimado con parámetros de entrada

---

## Formato de Respuesta

```json
// GET /api/proyectos
[
  {
    "id": 1,
    "anio_inicio": 2010,
    "codigo": "6935",
    "costo": 1238647591,
    "created_at": "2025-10-21 16:17:43",
    "duracion": null,
    "fase": "Fase II - Factibilidad",
    "lat_fin": null,
    "lat_inicio": null,
    "lng_fin": null,
    "lng_inicio": null,
    "longitud": 206.1,
    "nombre": "Autopista del Norte",
    "num_ufs": 7,
    "ubicacion": "Rural",
  },
]

// GET /api/proyectos/6935/unidades-funcionales
[
  {
    "alcance": "Construcción ",
    "codigo": "6935",
    "id": 1,
    "longitud_km": 26.2,
    "puentes_peatonales_mt2": 0,
    "puentes_peatonales_und": 0,
    "puentes_vehiculares_mt2": 4138,
    "puentes_vehiculares_und": 14,
    "tipo_terreno": "Plano",
    "tuneles_km": 0,
    "tuneles_und": 0,
    "unidad_funcional": 1,
    "zona": "Rural"
  },
]

// GET /api/proyectos/6935/items?fase=fase_ii
{
  "ambiental_social": 302592911,
  "codigo": "6935",
  "costos_presupuestos": 46610370,
  "direccion_coordinacion": 95956539,
  "estructuras": 5761233,
  "geologia": 61532307,
  "hidrologia_hidraulica": 0,
  "id": 1,
  "pavimento": 25858300,
  "predial": 122586050,
  "socioeconomica": 0,
  "taludes": 139616991,
  "topografia": 185525170,
  "transporte": 0,
  "tuneles": 252607720
}
```

---

## Arquitectura Interna (Backend)

```
Flask App
│
├── Configuración (config.py)
│    ├── Rutas absolutas (BASE_DIR, INSTANCE_DIR)
│    ├── Claves de API y secret keys
│
├── Models
│    ├── Proyecto
│    ├── UnidadFuncional
│    ├── Items (BaseItem + subclases por fase)
│
├── Services
│    ├── EDA
│    ├── PresentValue
│    ├── Predicción
│
└── Routes
     ├── /api/proyectos
     ├── /api/proyectos/<codigo>/unidades-funcionales
     └── /api/proyectos/<codigo>/items?fase=fase_i
```

---

## Próximos Pasos Arquitecturales

1. **Inicializar el frontend con React**
   Configurar una SPA con React Router y Axios para consumir la API Flask.

2. **Autenticación (JWT o Flask-Login)**
   Control de usuarios y permisos por proyecto.

3. **Paginación y búsqueda**
   Ejemplo:

   ```
   GET /api/proyectos?page=1&per_page=20
   GET /api/proyectos?nombre=Past
   ```

4. **Validación de datos (Marshmallow)**
   Validar entrada JSON antes de escribir en base.

5. **Migración a PostgreSQL / SQLAlchemy**
   Soporte para entornos productivos o multiusuario.

6. **Contenerización (Docker)**
   Backend + React build + Nginx reverse proxy.

---

## Conclusión

Esta arquitectura ofrece:

* Separación clara entre lógica, datos y presentación
* API REST estandarizada y jerárquica
* Mantenimiento simple con SQLite y Flask
* Escalabilidad futura hacia React y PostgreSQL

> Diseño enfocado en la simplicidad, extensibilidad y transición gradual hacia un entorno full-stack moderno.