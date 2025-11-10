# Guía de Archivos Válidos para Geometría

## Formatos aceptados
- **KML** (`.kml`)
- **GeoJSON** (`.geojson`, `.json`)
- **Shapefile** (`.zip` que contenga `.shp`, `.shx`, `.dbf`, `.prj`)

## Estructura mínima esperada

### GeoJSON mínimo
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-74.0721, 4.7110],
          [-74.0820, 4.7200]
        ]
      },
      "properties": {}
    }
  ]
}
```

### GeoJSON recomendado (con propiedades)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-74.0721, 4.7110],
          [-74.0820, 4.7200]
        ]
      },
      "properties": {
        "numero": 1,
        "alcance": "Construcción",
        "zona": "Plana",
        "tipo_terreno": "Normal"
      }
    }
  ]
}
```

### KML simple
```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>UF-01</name>
      <LineString>
        <coordinates>
          -74.0721,4.7110,0
          -74.0820,4.7200,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
```

### Shapefile
- Debe ir en un `.zip` con al menos: `.shp`, `.shx`, `.dbf`, `.prj`
- Cada feature debe tener un campo `numero` o similar para identificar la UF (opcional, se asigna secuencial si falta)

## Recomendaciones
- **CRS:** Preferiblemente WGS84 (EPSG:4326). Si no, el sistema intentará convertir.
- **Propiedades:**
  - `numero`: Número de la UF (opcional, se asigna automático)
  - `alcance`: Ej. "Construcción", "Rehabilitación"
  - `zona`: Ej. "Plana", "Montañosa"
  - `tipo_terreno`: Ej. "Normal", "Rocoso"
- **Longitud:** Se calcula automáticamente desde la geometría.
- **Tamaño máximo:** 50MB por archivo.
- **Multiples features:** En carga masiva, cada feature es una UF.

## Errores comunes
- CRS no especificado o no reconocible
- Geometría inválida (auto-intersecciones, etc.)
- Archivo vacío o sin features
- Faltan archivos en el zip de Shapefile

---

**Última actualización:** Noviembre 2024
