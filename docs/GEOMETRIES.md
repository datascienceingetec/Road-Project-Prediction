# Funcionamiento y Escalabilidad del Módulo de Geometría

## ¿Cómo funciona el sistema de geometría?

### Carga de geometría individual
- **Endpoint:** `POST /api/v1/unidades-funcionales/{id}/geometry`
- Permite subir un archivo KML, SHP (zip) o GeoJSON para una UF específica
- La geometría se almacena en formato GeoJSON (WGS84) en la base de datos
- Si ya existe geometría, se reemplaza
- Validación topológica automática

### Carga masiva de geometrías por proyecto
- **Endpoint:** `POST /api/v1/proyectos/{codigo}/geometries`
- **Parámetros opcionales:**
  - `?dry_run=true`: Previsualización sin modificar la base de datos
  - `?auto_create=false`: Solo actualiza UFs existentes, no crea nuevas
- Permite subir un archivo con múltiples features (KML, SHP, GeoJSON)
- Cada feature se asigna a una UF (por el campo `numero` o secuencial)
- Se crean o actualizan UFs automáticamente según configuración
- **Validaciones incluidas:**
  - Topología de geometrías (is_valid, is_simple)
  - Área/longitud según tipo de geometría
  - CRS correcto (WGS84)
  - Verificación de UFs existentes
- **Manejo robusto de errores:**
  - Un error en un feature no aborta toda la carga
  - Commits incrementales cada 10 features
  - Respuesta detallada con errores y advertencias por feature

### Visualización
- El frontend consume `GET /api/v1/proyectos/{codigo}/geometries`
- Muestra todas las geometrías en el mapa interactivo
- Coloración dinámica según tipo de alcance
- Soporte para LineString, Polygon y MultiPolygon

### Eliminación
- **Endpoint:** `DELETE /api/v1/unidades-funcionales/{id}/geometry`
- Elimina la geometría de la UF, pero no la UF en sí

### Exportación
- **Endpoint:** `GET /api/v1/proyectos/{codigo}/geometries/export/<format>`
- Formatos: KML, SHP (ZIP), GeoJSON
- Exporta todas las geometrías del proyecto

## Escalabilidad y mejoras recomendadas

### Escalabilidad
- **Soporte para grandes volúmenes:**
  - La arquitectura permite cargar y visualizar decenas o cientos de UFs por proyecto.
  - Para miles de UFs, considerar paginación o carga bajo demanda en el frontend.
- **Almacenamiento:**
  - Actualmente en SQLite/PostgreSQL como texto GeoJSON. Para proyectos grandes, considerar PostGIS para consultas espaciales avanzadas.
- **Procesamiento:**
  - El backend usa GeoPandas y Shapely, escalable para archivos de hasta ~50MB.
  - Para cargas masivas (>50MB), considerar procesamiento asíncrono (Celery, RQ).
- **Descarga/exportación:**
  - Exportación masiva puede requerir optimización de memoria si hay miles de features.

### Mejoras implementadas ✅
- ✅ **Vista previa de geometría antes de guardar** (dry-run mode)
- ✅ **Validación avanzada de topología y CRS**
- ✅ **Soporte para multipolígonos y multilíneas**
- ✅ **Control de errores por feature** (no aborta toda la carga)
- ✅ **Cálculo automático de área para polígonos**
- ✅ **Validación semántica** (verificar UFs existentes)
