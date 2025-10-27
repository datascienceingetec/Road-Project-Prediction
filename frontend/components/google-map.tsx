"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    google: any
  }
}

interface MapMarker {
  lat: number
  lng: number
  title?: string
  color?: "primary" | "accent"
}

interface GoogleMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  markers?: MapMarker[]
  polyline?: { lat: number; lng: number }[]
  highlightedMarker?: number
  className?: string
}

export function GoogleMap({ center, zoom = 12, markers = [], polyline, highlightedMarker, className }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [mapPolyline, setMapPolyline] = useState<any>(null)

  // Inicializar el mapa
  useEffect(() => {
    if (!mapRef.current || map) return

    const initMap = () => {
      const newMap = new window.google.maps.Map(mapRef.current!, {
        center,
        zoom,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })
      setMap(newMap)
    }

    // Cargar Google Maps API si no está cargada
    if (typeof window.google === "undefined" || !window.google.maps) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [center, zoom])

  // Actualizar marcadores
  useEffect(() => {
    if (!map || typeof window.google === "undefined") return

    // Limpiar marcadores existentes
    mapMarkers.forEach((marker) => marker.setMap(null))

    // Crear nuevos marcadores
    const newMarkers = markers.map((markerData, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map,
        title: markerData.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: highlightedMarker === index ? 12 : 8,
          fillColor: markerData.color === "accent" ? "#E4002B" : "#1D428A",
          fillOpacity: highlightedMarker === index ? 1 : 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        animation: highlightedMarker === index ? window.google.maps.Animation.BOUNCE : undefined,
      })

      return marker
    })

    setMapMarkers(newMarkers)

    // Ajustar bounds si hay marcadores
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      newMarkers.forEach((marker) => {
        const position = marker.getPosition()
        if (position) bounds.extend(position)
      })
      map.fitBounds(bounds)
    }
  }, [map, markers, highlightedMarker])

  // Actualizar polyline
  useEffect(() => {
    if (!map || typeof window.google === "undefined") return

    // Limpiar polyline existente
    if (mapPolyline) {
      mapPolyline.setMap(null)
    }

    // Crear nueva polyline si hay datos
    if (polyline && polyline.length > 0) {
      const newPolyline = new window.google.maps.Polyline({
        path: polyline,
        geodesic: true,
        strokeColor: "#1D428A",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map,
      })
      setMapPolyline(newPolyline)
    }
  }, [map, polyline])

  return <div ref={mapRef} className={className || "w-full h-full"} />
}
