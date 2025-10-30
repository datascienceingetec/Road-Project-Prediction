# Rediseño BD

##  1. Situación Actual

El sistema utiliza actualmente una base de datos SQLite con el siguiente modelo simplificado:

```

PROYECTOS
UNIDAD_FUNCIONAL
ITEM_FASE_I
ITEM_FASE_II
ITEM_FASE_III
ANUAL_INCREMENT

````

Cada fase del proyecto vial (I, II, III) tiene su propia tabla (`ITEM_FASE_X`), con columnas que representan los diferentes ítems de costo (geología, topografía, pavimento, etc.).

### Ejemplo simplificado

```sql
CREATE TABLE ITEM_FASE_II (
    id INTEGER PRIMARY KEY,
    codigo TEXT,
    transporte REAL,
    topografia REAL,
    geologia REAL,
    taludes REAL,
    hidrologia_hidraulica REAL,
    estructuras REAL,
    tuneles REAL,
    pavimento REAL,
    predial REAL,
    ambiental_social REAL,
    costos_presupuestos REAL,
    socioeconomica REAL,
    direccion_coordinacion REAL
);
````

---

## 2. Inconvenientes del Esquema Actual

| Nº  | Problema                                           | Descripción                                                                                       | Impacto                                               |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1️⃣ | **Desnormalización severa**                        | Cada fase está en una tabla distinta, con estructuras similares.                                  | Duplica lógica y dificulta mantenibilidad.            |
| 2️⃣ | **Dificultad para agregar nuevas fases**           | Si se requiere una Fase IV, se debe crear una nueva tabla.                                        | Cambios estructurales costosos y propensos a errores. |
| 3️⃣ | **Columnas fijas para ítems**                      | Cada tipo de ítem es una columna. No se pueden agregar o eliminar dinámicamente.                  | Inflexibilidad total ante cambios del INVÍAS.         |
| 4️⃣ | **Referencias inconsistentes**                     | Se usa `codigo` como FK entre tablas, en lugar de `id`.                                           | Riesgo de integridad y duplicidad de datos.           |
| 5️⃣ | **Consultas complejas y poco eficientes**          | Consultar costos por proyecto o comparar fases requiere unir tres tablas con distinta estructura. | Alto costo de desarrollo y bajo rendimiento.          |
| 6️⃣ | **No existe una relación explícita Proyecto–Fase** | La “fase” es solo una etiqueta textual dentro del proyecto.                                       | Dificulta saber qué fases tiene un proyecto.          |
| 7️⃣ | **Datos financieros aislados**                     | La tabla `ANUAL_INCREMENT` no se relaciona con los costos reales.                                 | Imposible aplicar normalización o ajustes por año.    |

---

## 3. Propuesta de Rediseño (Normalizada)

Se propone un esquema **modular, flexible y escalable**, en **3ª Forma Normal (3NF)**, que conserva la lógica de negocio actual pero elimina redundancias.

### Modelo Entidad–Relación

```
PROYECTOS
  ├── id (PK)
  ├── codigo (UNIQUE)
  ├── nombre
  ├── anio_inicio
  ├── duracion
  ├── longitud
  ├── ubicacion
  ├── lat_inicio / lng_inicio / lat_fin / lng_fin
  ├── fase_id (FK → FASES.id)
  └── created_at

FASES
  ├── id (PK)
  ├── nombre
  └── descripcion

UNIDAD_FUNCIONAL
  ├── id (PK)
  ├── proyecto_id (FK → PROYECTOS.id)
  ├── numero
  ├── longitud_km
  ├── puentes_vehiculares_und
  ├── puentes_vehiculares_mt2
  ├── puentes_peatonales_und
  ├── puentes_peatonales_mt2
  ├── tuneles_und
  ├── tuneles_km
  ├── alcance
  ├── zona
  └── tipo_terreno

ITEM_TIPO
  ├── id (PK)
  ├── nombre (ej. “Geología”, “Taludes”, “Pavimento”)
  └── descripcion

FASE_ITEM_REQUERIDO
  ├── id (PK)
  ├── fase_id (FK → FASES.id)
  ├── item_tipo_id (FK → ITEM_TIPO.id)
  ├── obligatorio (BOOLEAN)
  └── descripcion (opcional)

COSTO_ITEM
  ├── id (PK)
  ├── proyecto_id (FK → PROYECTOS.id)
  ├── item_tipo_id (FK → ITEM_TIPO.id)
  └── valor (REAL)

ANUAL_INCREMENT
  ├── id (PK)
  ├── ano
  └── valor
```

---

## 4. Ejemplo de Uso

### Agregar una nueva fase

```sql
INSERT INTO FASES (nombre, descripcion)
VALUES ('Fase IV - Ejecución', 'Seguimiento de costos durante la construcción');
```

### Asociar costos a un proyecto

```sql
INSERT INTO COSTO_ITEM (proyecto_id, item_tipo_id, valor)
VALUES (1, 4, 250000000); -- proyecto 1, ítem “Pavimento”
```

### Buscar proyectos por fase

```sql
SELECT DISTINCT p.*
FROM PROYECTOS p
JOIN FASES f ON f.id = p.fase_id
WHERE f.nombre = 'Fase II - Factibilidad';
```

### Obtener los ítems requeridos para una fase

```sql
SELECT i.nombre, f.nombre AS fase, r.obligatorio
FROM FASE_ITEM_REQUERIDO r
JOIN ITEM_TIPO i ON i.id = r.item_tipo_id
JOIN FASES f ON f.id = r.fase_id
WHERE f.nombre = 'Fase II - Factibilidad';
```

### Calcular el costo total de un proyecto-fase

```sql
SELECT 
    p.codigo,
    SUM(c.valor) AS costo_total
FROM PROYECTOS p
JOIN COSTO_ITEM c ON p.id = c.proyecto_id
GROUP BY p.codigo;
```

---

## 5. Ventajas del Nuevo Diseño

| Categoría                                  | Ventaja                                                   | Descripción                                       |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------- |
| **Flexibilidad**                        | Nueva fase o ítem = nuevo registro                        | No requiere alterar el esquema.                   |
| **Escalabilidad**                       | Compatible con PostgreSQL y SQLAlchemy                    | Permite múltiples usuarios y consultas complejas. |
| **Consultas eficientes**                | Filtrar por proyecto, fase o ítem fácilmente              | Simplifica reportes, análisis y ML.               |
| **Compatibilidad con Machine Learning** | Datos estructurados por filas (tidy data)                 | Ideal para generación de datasets dinámicos.      |
| **Integridad referencial**              | Uso de claves foráneas reales (`id` en lugar de `codigo`) | Elimina errores por duplicados o incoherencias.   |
| **Historial y versiones**               | Se puede añadir fecha o año en `COSTO_ITEM`               | Permite análisis temporales y proyecciones.       |
|  **Mantenibilidad**                      | Un solo modelo de datos unificado                         | Facilita el desarrollo, testing y migraciones.    |

## 6. Ventajas Directas para el desarrollo del Frontend

| Aspecto                                   | Mejora                                       | Descripción                                                                                                                                                         |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Simplicidad del CRUD**                  | Un solo endpoint genérico                    | Se elimina la necesidad de manejar rutas diferentes por fase (`/items_fase_I`, `/items_fase_II`, etc.). Ahora basta con `/api/proyectos/<id>/items?fase=<fase_id>`. |
| **Filtros dinámicos**                     | Fases e ítems parametrizables                | El frontend puede cargar fases e ítems desde la base y construir filtros y formularios automáticamente.                                                             |
| **Menor acoplamiento**                    | UI independiente del backend                 | Si INVÍAS cambia las categorías o fases, el frontend no se rompe; los cambios se reflejan dinámicamente.                                                            |
| **Datos consistentes**                    | Una sola estructura JSON                     | Todas las fases comparten el mismo formato de respuesta, simplificando la lógica de renderizado en el front.                                                           |
| **Mejor rendimiento en UX**               | Consultas uniformes y paginables             | Al tener un esquema normalizado, las APIs son más rápidas y predecibles para mostrar tablas o dashboards.                                                           |
| **Gráficas reactivas**                    | Datos listos para librerías de visualización | El frontend puede usar fácilmente librerías como Recharts o ECharts sin tener que transformar estructuras heterogéneas.                                             |
| **Evolución futura sin breaking changes** | Compatible con nuevas fases y métricas       | Los nuevos ítems o fases aparecerán automáticamente sin necesidad de rediseñar la UI.                                                                               |
| **Menor deuda técnica**                   | Mantenimiento de componentes más simple      | Evita componentes duplicados o condicionales excesivos según la fase.                                                                                               |
