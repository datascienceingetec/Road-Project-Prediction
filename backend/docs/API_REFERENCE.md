# 🧱 **📘 API completa — Costos Vías (Flask Core API)**

> Prefijo base: `/api/v1`

---

## 🗂️ **A. Proyectos**

### Públicas (por código)

| Método   | Ruta                                              | Descripción                                 |
| -------- | ------------------------------------------------- | ------------------------------------------- |
| `GET`    | `/api/v1/proyectos`                               | Lista todos los proyectos                   |
| `GET`    | `/api/v1/proyectos/<codigo>`                      | Obtiene un proyecto por código              |
| `GET`    | `/api/v1/proyectos/<codigo>/resumen`              | Estadísticas o resumen general del proyecto |
| `GET`    | `/api/v1/proyectos/<codigo>/unidades-funcionales` | Lista UFs del proyecto                      |
| `GET`    | `/api/v1/proyectos/<codigo>/items?fase=<fase_id>` | Lista costos de una fase                    |
| `POST`   | `/api/v1/proyectos/<codigo>/items?fase=<fase_id>` | Crea o actualiza costos de esa fase         |
| `DELETE` | `/api/v1/proyectos/<codigo>/items?fase=<fase_id>` | Elimina todos los ítems de una fase         |
| `POST`   | `/api/v1/proyectos`                               | Crea un nuevo proyecto (con `codigo` único) |

---

### Internas (por id)

| Método   | Ruta                              | Descripción                               |
| -------- | --------------------------------- | ----------------------------------------- |
| `GET`    | `/api/v1/internal/proyectos/<id>` | Obtiene un proyecto por ID                |
| `PUT`    | `/api/v1/internal/proyectos/<id>` | Actualiza un proyecto                     |
| `DELETE` | `/api/v1/internal/proyectos/<id>` | Elimina un proyecto                       |
| `GET`    | `/api/v1/internal/proyectos`      | Listado técnico (paginado, filtros, etc.) |

---

## 🧩 **B. Unidades Funcionales**

### Públicas (por código del proyecto)

| Método | Ruta                                              | Descripción                         |
| ------ | ------------------------------------------------- | ----------------------------------- |
| `GET`  | `/api/v1/proyectos/<codigo>/unidades-funcionales` | Lista las UFs de un proyecto        |
| `POST` | `/api/v1/proyectos/<codigo>/unidades-funcionales` | Crea una UF asociada a ese proyecto |

---

### Internas (por id)

| Método   | Ruta                                         | Descripción               |
| -------- | -------------------------------------------- | ------------------------- |
| `GET`    | `/api/v1/internal/unidades-funcionales/<id>` | Obtiene una UF específica |
| `PUT`    | `/api/v1/internal/unidades-funcionales/<id>` | Actualiza una UF          |
| `DELETE` | `/api/v1/internal/unidades-funcionales/<id>` | Elimina una UF            |

---

## 🧠 **C. Fases**

| Método   | Ruta                                            | Descripción                          |
| -------- | ----------------------------------------------- | ------------------------------------ |
| `GET`    | `/api/v1/fases`                                 | Lista todas las fases registradas    |
| `GET`    | `/api/v1/fases/<id>`                            | Obtiene una fase específica          |
| `POST`   | `/api/v1/fases`                                 | Crea una nueva fase                  |
| `PUT`    | `/api/v1/fases/<id>`                            | Edita una fase existente             |
| `DELETE` | `/api/v1/fases/<id>`                            | Elimina una fase                     |
| `GET`    | `/api/v1/fases/<id>/items-requeridos`           | Lista ítems requeridos para esa fase |
| `POST`   | `/api/v1/fases/<id>/items-requeridos`           | Agrega ítems requeridos a la fase    |
| `DELETE` | `/api/v1/fases/<id>/items-requeridos/<item_id>` | Elimina un ítem requerido            |

---

## 💰 **D. Ítems**

| Método   | Ruta                 | Descripción                    |
| -------- | -------------------- | ------------------------------ |
| `GET`    | `/api/v1/items`      | Lista todos los ítems posibles |
| `GET`    | `/api/v1/items/<id>` | Obtiene un ítem                |
| `POST`   | `/api/v1/items`      | Crea un nuevo ítem             |
| `PUT`    | `/api/v1/items/<id>` | Actualiza un ítem              |
| `DELETE` | `/api/v1/items/<id>` | Elimina un ítem                |

---

## 🔄 **E. Costos por Proyecto y Fase**

| Método   | Ruta                                               | Descripción                                  |
| -------- | -------------------------------------------------- | -------------------------------------------- |
| `GET`    | `/api/v1/proyectos/<codigo>/costos?fase=<fase_id>` | Lista costos de una fase de un proyecto      |
| `POST`   | `/api/v1/proyectos/<codigo>/costos?fase=<fase_id>` | Crea o actualiza costos                      |
| `GET`    | `/api/v1/proyectos/<codigo>/costos/totales`        | Retorna el total consolidado por fase o ítem |
| `DELETE` | `/api/v1/proyectos/<codigo>/costos?fase=<fase_id>` | Elimina los costos de una fase               |

---

## 🤖 **F. Predicción (Machine Learning)**

| Método | Ruta                      | Descripción                              |
| ------ | ------------------------- | ---------------------------------------- |
| `POST` | `/api/v1/predict`         | Predice el costo de una UF (modelo ML)   |
| `GET`  | `/api/v1/models`          | Lista modelos disponibles                |
| `POST` | `/api/v1/train`           | Entrena o reentrena un modelo            |
| `GET`  | `/api/v1/predict/example` | Devuelve un ejemplo del payload esperado |

---

## 🔐 **G. Autenticación y Usuarios (opcional)**

| Método | Ruta                   | Descripción                    |
| ------ | ---------------------- | ------------------------------ |
| `POST` | `/api/v1/auth/login`   | Inicia sesión, devuelve JWT    |
| `POST` | `/api/v1/auth/logout`  | Cierra sesión                  |
| `POST` | `/api/v1/auth/refresh` | Renueva token                  |
| `GET`  | `/api/v1/auth/me`      | Información del usuario actual |

---

## 📊 **H. Estadísticas y Reportes**

| Método | Ruta                              | Descripción                                        |
| ------ | --------------------------------- | -------------------------------------------------- |
| `GET`  | `/api/v1/reportes/resumen`        | Resumen general (proyectos, inversión, km totales) |
| `GET`  | `/api/v1/reportes/fase/<fase_id>` | Reporte de costos por fase                         |
| `GET`  | `/api/v1/reportes/item/<item_id>` | Reporte histórico por tipo de ítem                 |
| `GET`  | `/api/v1/reportes/geografia`      | Datos agrupados por departamento o zona            |

---

## 📈 **I. Charts (Gráficos)**

| Método | Ruta                                       | Descripción                                                    |
| ------ | ------------------------------------------ | -------------------------------------------------------------- |
| `GET`  | `/api/v1/charts/valor-presente-causacion`  | Datos para gráfico de dispersión: longitud vs costo VP        |
| `GET`  | `/api/v1/charts/causacion-por-km`          | Estadísticas de causación promedio por km (heatmap)            |
| `GET`  | `/api/v1/charts/health`                    | Health check del servicio de charts                            |

**Query Parameters comunes:**
- `fase_id` (opcional): ID de la fase para filtrar proyectos
- `present_year` (opcional): Año presente para cálculo de valor presente. Default: `2025`

---

## 🔧 **J. Internos / Administrativos**

| Método | Ruta                         | Descripción                          |
| ------ | ---------------------------- | ------------------------------------ |
| `GET`  | `/api/v1/internal/db/backup` | Genera un backup de la base          |
| `GET`  | `/api/v1/internal/db/stats`  | Devuelve métricas de base de datos   |
| `POST` | `/api/v1/internal/db/reload` | Restaura o recarga datos desde Excel |
| `GET`  | `/api/v1/internal/logs`      | Devuelve logs del sistema            |
