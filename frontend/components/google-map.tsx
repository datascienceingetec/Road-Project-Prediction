"use client"

import { useContext, useEffect, useRef, useState } from "react"
import { GoogleMapsContext } from "@/contexts/map-context"

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
  const { isLoaded } = useContext(GoogleMapsContext)
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const mapMarkers = useRef<any[]>([])
  const mapPolyline = useRef<any>(null)

  // Inicializar el mapa
  useEffect(() => {
    if (!mapRef.current || map || !isLoaded) return

    const newMap = new window.google.maps.Map(mapRef.current, {
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
  }, [center, zoom, isLoaded])

  // Actualizar marcadores
  useEffect(() => {
    if (!map || !isLoaded) return

    // Limpiar marcadores existentes
    mapMarkers.current.forEach((marker) => marker.setMap(null))
    mapMarkers.current = []

    // Crear nuevos marcadores
    markers.forEach((markerData, index) => {
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
      mapMarkers.current.push(marker)
    })

    // Ajustar bounds si hay marcadores
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markers.forEach((marker) => {
        bounds.extend({ lat: marker.lat, lng: marker.lng })
      })
      map.fitBounds(bounds)
    }
  }, [map, markers, highlightedMarker, isLoaded])

  // Actualizar polyline
  useEffect(() => {
    if (!map || !isLoaded || !polyline || polyline.length === 0) {
      if (mapPolyline.current) {
        mapPolyline.current.setMap(null)
        mapPolyline.current = null
      }
      return
    }

    // Limpiar polyline existente
    if (mapPolyline.current) {
      mapPolyline.current.setMap(null)
    }

    // Crear nueva polyline
    mapPolyline.current = new window.google.maps.Polyline({
      path: polyline,
      geodesic: true,
      strokeColor: "#1D428A",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map,
    })
  }, [map, polyline, isLoaded])

  if (!isLoaded) {
    return <div className={className || "w-full h-full bg-gray-100 flex items-center justify-center"}>Cargando mapa...</div>
  }

  return <div ref={mapRef} className={className || "w-full h-full"} />
}