"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { api, type EnumOption } from "@/lib/api"

interface InteractiveProjectMapProps {
  projectCode?: string
  selectedUnitId?: number | null
  onUnitSelect?: (unitId: number) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
}

export function InteractiveProjectMap({
  projectCode,
  selectedUnitId,
  onUnitSelect,
  center = { lat: 4.5709, lng: -74.2973 }, // Colombia center
  zoom = 8,
  className = "w-full h-[600px]",
}: InteractiveProjectMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(false) // Start as false - only show loading when fetching data
  const [error, setError] = useState<string | null>(null)
  const dataLayerRef = useRef<google.maps.Data | null>(null)
  const [alcanceColors, setAlcanceColors] = useState<Record<string, string>>({})
  const [alcanceOptions, setAlcanceOptions] = useState<EnumOption[]>([])
  const [hideLegend, setHideLegend] = useState(true)
  const markerRef = useRef<google.maps.Marker | null>(null)

  // Load alcance options and generate colors
  useEffect(() => {
    const loadAlcances = async () => {
      try {
        const options = await api.getAlcanceOptions()
        setAlcanceOptions(options)
        
        // Generate colors for each alcance
        const colors: Record<string, string> = {}
        const colorPalette = [
          "#10B981", // Green
          "#F59E0B", // Orange
          "#3B82F6", // Blue
          "#8B5CF6", // Purple
          "#EF4444", // Red
          "#14B8A6", // Teal
        ]
        
        options.forEach((option, index) => {
          colors[option.value] = colorPalette[index % colorPalette.length]
        })
        
        setAlcanceColors(colors)
      } catch (error) {
        console.error("Error loading alcance options:", error)
        // Fallback colors
        setAlcanceColors({
          "Construcción": "#10B981",
          "Rehabilitación": "#F59E0B",
          "Mejoramiento": "#3B82F6",
        })
      }
    }
    
    loadAlcances()
  }, [])

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || map) return

    const initMap = () => {
      try {
        const googleMap = new google.maps.Map(mapRef.current!, {
          center,
          zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        })

        setMap(googleMap)
        setIsLoaded(true)
      } catch (err) {
        setError("Error al inicializar el mapa")
        console.error(err)
      }
    }

    if (window.google && window.google.maps) {
      initMap()
    } else {
      setError("Google Maps no está cargado")
    }
  }, [center, zoom, map])

  // Load GeoJSON data
  useEffect(() => {
    if (!map || !isLoaded || !projectCode) return

    const loadGeoJSON = async () => {
      setLoading(true)
      setError(null)

      try {
        // Clear existing data
        if (dataLayerRef.current) {
          dataLayerRef.current.forEach((feature) => {
            dataLayerRef.current?.remove(feature)
          })
        } else {
          dataLayerRef.current = map.data
        }

        // Load GeoJSON from API
        const geojson = await api.getProjectGeometries(projectCode)

        // Remove existing marker if any
        if (markerRef.current) {
          markerRef.current.setMap(null)
          markerRef.current = null
        }

        // Add features to map
        map.data.addGeoJson(geojson)

        // Fit bounds to show all features
        const bounds = new google.maps.LatLngBounds()
        let hasFeatures = false

        map.data.forEach((feature) => {
          hasFeatures = true
          const geometry = feature.getGeometry()
          if (geometry) {
            geometry.forEachLatLng((latLng) => {
              bounds.extend(latLng)
            })
          }
        })

        if (hasFeatures) {
          setHideLegend(false)
          map.fitBounds(bounds)
          // Add some padding
          const padding = { top: 50, right: 50, bottom: 50, left: 50 }
          map.fitBounds(bounds, padding)
        } else {
          setHideLegend(true)
          // No geometries - show marker at project center if available
          if (center.lat !== 4.5709 || center.lng !== -74.2973) {
            markerRef.current = new google.maps.Marker({
              position: center,
              map: map,
              title: "Ubicación del Proyecto",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#1D428A",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
            })
            map.setCenter(center)
            map.setZoom(12)
          }
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
        setLoading(false)
      }
    }

    loadGeoJSON()
  }, [map, isLoaded, projectCode])

  // Style features based on selection
  useEffect(() => {
    if (!map || !isLoaded || Object.keys(alcanceColors).length === 0) return

    map.data.setStyle((feature) => {
      const featureId = feature.getProperty("id") as number
      const isSelected = featureId === selectedUnitId
      const alcance = feature.getProperty("alcance") as string

      // Color by alcance type from dynamic mapping
      const strokeColor = alcanceColors[alcance] || "#1D428A" // Default blue

      return {
        strokeColor: isSelected ? "#FFD700" : strokeColor,
        strokeWeight: isSelected ? 6 : 3,
        strokeOpacity: isSelected ? 1 : 0.8,
        fillColor: strokeColor,
        fillOpacity: 0.1,
        clickable: true,
        zIndex: isSelected ? 1000 : 1,
      }
    })
  }, [map, isLoaded, selectedUnitId, alcanceColors])

  // Handle feature clicks
  useEffect(() => {
    if (!map || !isLoaded) return

    const clickListener = map.data.addListener("click", (event: google.maps.Data.MouseEvent) => {
      const featureId = event.feature.getProperty("id") as number
      if (featureId && onUnitSelect) {
        onUnitSelect(featureId)
      }
    })

    // Add hover effect
    const mouseoverListener = map.data.addListener(
      "mouseover",
      (event: google.maps.Data.MouseEvent) => {
        map.data.overrideStyle(event.feature, {
          strokeWeight: 5,
          strokeOpacity: 1,
        })
        map.setOptions({ draggableCursor: "pointer" })
      }
    )

    const mouseoutListener = map.data.addListener(
      "mouseout",
      (event: google.maps.Data.MouseEvent) => {
        map.data.revertStyle(event.feature)
        map.setOptions({ draggableCursor: null })
      }
    )

    return () => {
      google.maps.event.removeListener(clickListener)
      google.maps.event.removeListener(mouseoverListener)
      google.maps.event.removeListener(mouseoutListener)
    }
  }, [map, isLoaded, onUnitSelect])

  // Add info window on hover
  useEffect(() => {
    if (!map || !isLoaded) return

    const infoWindow = new google.maps.InfoWindow()

    const mouseoverListener = map.data.addListener(
      "mouseover",
      (event: google.maps.Data.MouseEvent) => {
        const numero = event.feature.getProperty("numero")
        const longitud = event.feature.getProperty("longitud_km")
        const alcance = event.feature.getProperty("alcance")
        const zona = event.feature.getProperty("zona")

        const content = `
          <div class="p-2">
            <h3 class="font-bold text-sm mb-1">Unidad Funcional ${numero}</h3>
            <div class="text-xs space-y-1">
              ${longitud ? `<p>Longitud: ${longitud} km</p>` : ""}
              ${alcance ? `<p>Alcance: ${alcance}</p>` : ""}
              ${zona ? `<p>Zona: ${zona}</p>` : ""}
            </div>
          </div>
        `

        infoWindow.setContent(content)
        infoWindow.setPosition(event.latLng)
        infoWindow.open(map)
      }
    )

    const mouseoutListener = map.data.addListener("mouseout", () => {
      infoWindow.close()
    })

    return () => {
      google.maps.event.removeListener(mouseoverListener)
      google.maps.event.removeListener(mouseoutListener)
      infoWindow.close()
    }
  }, [map, isLoaded])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-gray-600">Cargando geometrías...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Legend */}
      {!loading && !error && alcanceOptions.length > 0 && !hideLegend && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
          <h4 className="font-semibold text-xs mb-2">Leyenda</h4>
          <div className="space-y-1 text-xs">
            {alcanceOptions.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <div 
                  className="w-4 h-0.5" 
                  style={{ backgroundColor: alcanceColors[option.value] || "#1D428A" }}
                ></div>
                <span>{option.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t mt-1">
              <div className="w-4 h-0.5 bg-[#FFD700]" style={{ height: "3px" }}></div>
              <span>Seleccionada</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
