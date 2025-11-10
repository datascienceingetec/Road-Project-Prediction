# Funcionamiento y Escalabilidad del Módulo de Geometría

## ¿Cómo funciona el sistema de geometría?

- **Carga de geometría individual:**
  - Endpoint: `POST /api/v1/unidades-funcionales/{id}/geometry`
  - Permite subir un archivo KML, SHP (zip) o GeoJSON para una UF específica.
  - La geometría se almacena en formato GeoJSON (WGS84) en la base de datos.
  - Si ya existe geometría, se reemplaza.

- **Carga masiva de geometrías por proyecto:**
  - Endpoint: `POST /api/v1/proyectos/{codigo}/geometries`
  - Permite subir un archivo con múltiples features (KML, SHP, GeoJSON).
  - Cada feature se asigna a una UF (por el campo `numero` o secuencial).
  - Se crean o actualizan UFs automáticamente según el archivo.

- **Visualización:**
  - El frontend consume `GET /api/v1/proyectos/{codigo}/geometries` para mostrar todas las geometrías en el mapa interactivo.
  - Las geometrías se colorean dinámicamente según el tipo de alcance.

- **Eliminación:**
  - Endpoint: `DELETE /api/v1/unidades-funcionales/{id}/geometry`
  - Elimina la geometría de la UF, pero no la UF en sí.

- **Exportación:**
  - Endpoint: `GET /api/v1/proyectos/{codigo}/geometries/export/<format>`
  - Permite exportar todas las geometrías del proyecto en KML, SHP o GeoJSON.

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

### Mejoras recomendadas
- **Vista previa de geometría antes de guardar**
- **Validación avanzada de topología y CRS**
- **Soporte para multipolígonos y multilíneas**
- **Historial de versiones de geometría**
- **Integración con servicios de mapas externos (WMS, WMTS)**
- **Indexación espacial (PostGIS, SpatiaLite)**
- **Carga asíncrona de archivos muy grandes**
- **Permitir propiedades personalizadas en features**

---

**Última actualización:** Noviembre 2024
