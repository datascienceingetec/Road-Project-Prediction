# **API — Costos Vías (Flask API)**

> Prefijo base: `/api/v1`

---

## **A. Proyectos**

| Método   | Ruta                                              | Descripción                                 |
| -------- | ------------------------------------------------- | ------------------------------------------- |
| `GET`    | `/api/v1/proyectos`                               | Lista todos los proyectos                   |
| `GET`    | `/api/v1/proyectos/id/<proyecto_id>`              | Obtiene un proyecto por ID                  |
| `GET`    | `/api/v1/proyectos/<codigo>`                      | Obtiene un proyecto por código              |
| `POST`   | `/api/v1/proyectos`                               | Crea un nuevo proyecto (con `codigo` único) |
| `PUT`    | `/api/v1/proyectos/<codigo>`                      | Actualiza un proyecto por código            |
| `DELETE` | `/api/v1/proyectos/<proyecto_id>`                 | Elimina un proyecto por ID                  |
| `GET`    | `/api/v1/proyectos/<codigo>/geometries`           | Lista todas las geometrías del proyecto (GeoJSON) |
| `POST`   | `/api/v1/proyectos/<codigo>/geometries`           | Carga masiva de geometrías (KML, SHP, GeoJSON) |
| `GET`    | `/api/v1/proyectos/<codigo>/geometries/export/<format>` | Exporta geometrías del proyecto en formato KML/SHP/GeoJSON |

**Query Parameters para GET /proyectos/...:**
- `include_relations` (opcional): Incluir relaciones (ej: `?include_relations=true`)

---

## **B. Unidades Funcionales**

| Método   | Ruta                                   | Descripción                         |
| -------- | -------------------------------------- | ----------------------------------- |
| `GET`    | `/api/v1/proyectos/<codigo>/unidades-funcionales`  | Lista las UFs de un proyecto        |
| `GET`    | `/api/v1/unidades-funcionales/<id>`    | Obtiene una UF por ID               |
| `POST`   | `/api/v1/unidades-funcionales`         | Crea una nueva UF                   |
| `PUT`    | `/api/v1/unidades-funcionales/<id>`    | Actualiza una UF                    |
| `DELETE` | `/api/v1/unidades-funcionales/<id>`    | Elimina una UF                      |
| `GET`    | `/api/v1/unidades-funcionales/<id>/geometry`      | Obtiene la geometría de una UF (GeoJSON) |
| `POST`   | `/api/v1/unidades-funcionales/<id>/geometry`      | Carga geometría a una UF (KML, SHP, GeoJSON) |
| `PUT`    | `/api/v1/unidades-funcionales/<id>/geometry`      | Actualiza la geometría de una UF (GeoJSON) |
| `DELETE` | `/api/v1/unidades-funcionales/<id>/geometry`      | Elimina la geometría de una UF           |

---

## **C. Fases**

| Método   | Ruta                            | Descripción                          |
| -------- | ------------------------------- | ------------------------------------ |
| `GET`    | `/api/v1/fases`                 | Lista todas las fases registradas    |
| `GET`    | `/api/v1/fases/<fase_id>`       | Obtiene una fase específica          |
| `POST`   | `/api/v1/fases`                 | Crea una nueva fase                  |
| `PUT`    | `/api/v1/fases/<fase_id>`       | Actualiza una fase existente         |
| `DELETE` | `/api/v1/fases/<fase_id>`       | Elimina una fase                     |
| `GET`    | `/api/v1/fases/<fase_id>/items` | Lista ítems requeridos para la fase  |

---

## **D. Ítems**

| Método   | Ruta                    | Descripción                               |
| -------- | ----------------------- | ----------------------------------------- |
| `GET`    | `/api/v1/items`         | Lista todos los ítems posibles            |
| `GET`    | `/api/v1/items/<item_id>` | Obtiene un ítem por ID                   |
| `GET`    | `/api/v1/items/search?q=<query>` | Busca ítems por nombre               |
| `POST`   | `/api/v1/items`         | Crea un nuevo ítem                       |
| `PUT`    | `/api/v1/items/<item_id>` | Actualiza un ítem                       |
| `DELETE` | `/api/v1/items/<item_id>` | Elimina un ítem                         |

---

## **E. Costos por Proyecto**

| Método   | Rúa | Descripción |
| -------- | --- | ----------- |
| `GET`    | `/api/v1/proyectos/<codigo>/costos` | Obtiene todos los costos de un proyecto |
| `POST`   | `/api/v1/proyectos/<codigo>/costos` | Crea o actualiza costos de un proyecto |
| `PUT`    | `/api/v1/proyectos/<codigo>/costos/<costo_id>` | Actualiza un costo específico |
| `DELETE` | `/api/v1/proyectos/<codigo>/costos/<costo_id>` | Elimina un costo específico |

---

## **F. Predicción**

| Método | Ruta                      | Descripción                              |
| ------ | ------------------------- | ---------------------------------------- |
| `POST` | `/api/v1/predict`         | Predice el costo de una UF               |
| `GET`  | `/api/v1/predict/example` | Devuelve un ejemplo del payload esperado |

---

## **G. Gráficos**

| Método | Ruta                                       | Descripción                                                    |
| ------ | ------------------------------------------ | -------------------------------------------------------------- |
| `GET`  | `/api/v1/charts/valor-presente-causacion`  | Datos para gráfico de dispersión: longitud vs costo VP         |
| `GET`  | `/api/v1/charts/causacion-por-km`          | Estadísticas de causación promedio por km (heatmap)            |
| `GET`  | `/api/v1/charts/health`                    | Health check del servicio de charts                            |

**Query Parameters para gráficos:**
- `fase_id` (opcional): ID de la fase para filtrar proyectos
- `alcance` (opcional): Filtra por tipo de alcance
- `present_year` (opcional): Año para cálculo de valor presente (default: 2025)
