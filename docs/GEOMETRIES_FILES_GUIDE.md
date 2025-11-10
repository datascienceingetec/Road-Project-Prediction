# Guía de Archivos Válidos para Geometría de Unidad Funcional

## 📦 Formatos aceptados
- **KML** (`.kml`)
- **GeoJSON** (`.geojson`, `.json`)
- **Shapefile** (`.zip` que contenga `.shp`, `.shx`, `.dbf`, `.prj`)

> Actualmente **solo se admite la carga individual de geometría**
> por unidad funcional mediante el endpoint:
> ```
> POST /api/v1/unidades-funcionales/{id}/geometry
> ```

---

## 🧭 Requisitos generales

| Criterio | Descripción |
|-----------|-------------|
| **CRS** | WGS84 (`EPSG:4326`) — latitud/longitud en grados decimales |
| **Tamaño máximo** | 50 MB |
| **Cantidad de geometrías** | Exactamente **una** (`1`) por archivo |
| **Tipos de geometría permitidos** | `LineString`, `Polygon`, `MultiLineString`, `MultiPolygon` |
| **Altitud (Z)** | Opcional — se ignora si está presente |
| **Atributos asociados** | Opcional — se conservan pero no se usan en la base de datos |
| **Formato de coordenadas KML** | `longitud,latitud[,altura]` separados por espacios o saltos de línea |

---

## 🧩 Estructura esperada del KML

Un archivo **KML válido** debe contener exactamente **un `<Placemark>`**, el cual representa
la geometría de la unidad funcional.

### 📘 Ejemplo con línea (`LineString`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>UF-01 - Segunda Calzada</name>
      <description>
        Alcance: Segunda calzada
        Zona: Rural
        Tipo de Terreno: Ondulado
      </description>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
          -76.5501996,3.6984053,0
          -76.5451996,3.7034053,0
          -76.5401996,3.7084053,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
````

### 📗 Ejemplo con polígono (`Polygon`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>UF-03 - Zona de Operación</name>
      <description>
        Alcance: Operación y mantenimiento
        Zona: Rural
        Tipo de Terreno: Ondulado
      </description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -76.5501996,3.6984053,0
              -76.5481996,3.6989053,0
              -76.5471996,3.6998053,0
              -76.5491996,3.6994053,0
              -76.5501996,3.6984053,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
```

---

## ⚙️ Cómo procesa el backend el archivo

1. **Validación inicial:**

   * Extensión y tamaño.
   * Existencia de al menos un `<Placemark>`.

2. **Extracción de geometría:**

   * Se convierte a GeoJSON en formato WGS84.
   * Solo se conserva la primera geometría del archivo.

3. **Actualización en la base de datos:**

   * Se guarda la geometría en `geometry_json` de la unidad funcional.
   * Opcionalmente, si se solicita con `?recalculate_length=true`, se recalcula el campo `longitud_km` para líneas o `area_km2` (futuro) para polígonos.

---

## ✅ Recomendaciones

* Siempre cierre el polígono (último punto igual al primero).
* Use coordenadas válidas dentro del rango:

  * Latitud: -90 a 90
  * Longitud: -180 a 180
* Mantenga el archivo liviano (máximo unas pocas centenas de vértices).
* Evite geometrías autointersectadas o con topología inválida.
* No incluya múltiples `Placemark` en un solo KML.
* Si usa software SIG (QGIS, ArcGIS), exporte siempre en **EPSG:4326**.

---

## 🚫 Errores comunes detectados

| Error                                  | Causa probable                                             |
| -------------------------------------- | ---------------------------------------------------------- |
| “No se encontraron geometrías válidas” | El archivo KML no tiene `<Placemark>` o está vacío         |
| “File type not allowed”                | Extensión incorrecta (debe ser `.kml`, `.zip`, `.geojson`) |
| “File does not have CRS defined”       | Shapefile sin `.prj` o GeoJSON sin CRS                     |
| “Geometry invalid (self-intersection)” | Polígono no cerrado correctamente                          |
| “Archivo vacío o sin features”         | Archivo sin geometrías dentro                              |