'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface Position {
  latitude: number
  longitude: number
  location_name: string
}

interface ShippingMapProps {
  currentPosition: Position
  route?: { lat: number; lon: number; name: string }[]
  originPort?: { lat: number; lon: number; name: string }
  destinationPort?: { lat: number; lon: number; name: string }
}

export function ShippingMap({ currentPosition, route, originPort, destinationPort }: ShippingMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-panel flex items-center justify-center">
        <div className="font-pixel text-sm animate-pulse">LOADING_MAP...</div>
      </div>
    )
  }

  const center: [number, number] = [currentPosition.latitude, currentPosition.longitude]

  // Create route path
  const routePath: [number, number][] = route?.map((p) => [p.lat, p.lon]) || []

  return (
    <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      {/* Dark/Grayscale Map Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Route Line */}
      {routePath.length > 0 && (
        <Polyline positions={routePath} pathOptions={{ color: '#E8E8E8', weight: 2, dashArray: '10, 10' }} />
      )}

      {/* Origin Port */}
      {originPort && (
        <Marker position={[originPort.lat, originPort.lon]}>
          <Popup>
            <div className="font-pixel text-xs">
              <div>ORIGIN</div>
              <div>{originPort.name}</div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination Port */}
      {destinationPort && (
        <Marker position={[destinationPort.lat, destinationPort.lon]}>
          <Popup>
            <div className="font-pixel text-xs">
              <div>DESTINATION</div>
              <div>{destinationPort.name}</div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Current Position (Vessel) */}
      <Marker position={center}>
        <Popup>
          <div className="font-pixel text-xs">
            <div>VESSEL_POSITION</div>
            <div>{currentPosition.location_name}</div>
            <div className="text-[10px] opacity-60">
              {currentPosition.latitude.toFixed(4)}, {currentPosition.longitude.toFixed(4)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
