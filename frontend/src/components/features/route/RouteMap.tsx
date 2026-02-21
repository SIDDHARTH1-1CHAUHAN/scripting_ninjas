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
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)

interface Port {
  code: string
  name: string
  lat: number
  lon: number
  congestion?: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface Route {
  id: string
  name: string
  waypoints: { lat: number; lon: number; name: string }[]
  color: string
  recommended?: boolean
}

interface RouteMapProps {
  origin: Port
  destination: Port
  routes: Route[]
  selectedRouteId?: string
}

const MAJOR_PORTS: Port[] = [
  { code: 'CNSZX', name: 'Yantian, Shenzhen', lat: 22.5431, lon: 114.0579, congestion: 'MEDIUM' },
  { code: 'CNSHA', name: 'Shanghai', lat: 31.2304, lon: 121.4737, congestion: 'HIGH' },
  { code: 'HKHKG', name: 'Hong Kong', lat: 22.3193, lon: 114.1694, congestion: 'MEDIUM' },
  { code: 'USLAX', name: 'Los Angeles', lat: 33.7701, lon: -118.1937, congestion: 'HIGH' },
  { code: 'USLGB', name: 'Long Beach', lat: 33.7544, lon: -118.2166, congestion: 'MEDIUM' },
  { code: 'NLRTM', name: 'Rotterdam', lat: 51.9244, lon: 4.4777, congestion: 'LOW' },
  { code: 'SGSIN', name: 'Singapore', lat: 1.2644, lon: 103.8222, congestion: 'LOW' },
]

export function RouteMap({ origin, destination, routes, selectedRouteId }: RouteMapProps) {
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

  const centerLat = (origin.lat + destination.lat) / 2
  const centerLon = (origin.lon + destination.lon) / 2

  const getCongestionColor = (congestion?: string) => {
    switch (congestion) {
      case 'HIGH':
        return '#FF4141'
      case 'MEDIUM':
        return '#FFB800'
      case 'LOW':
        return '#00C853'
      default:
        return '#888888'
    }
  }

  return (
    <MapContainer center={[centerLat, centerLon]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.waypoints.map((w) => [w.lat, w.lon] as [number, number])}
          pathOptions={{
            color: selectedRouteId === route.id ? '#FFFFFF' : route.color,
            weight: selectedRouteId === route.id ? 4 : 2,
            opacity: selectedRouteId === route.id ? 1 : 0.5,
            dashArray: route.recommended ? undefined : '5, 10',
          }}
        />
      ))}

      {MAJOR_PORTS.map((port) => (
        <CircleMarker
          key={port.code}
          center={[port.lat, port.lon]}
          radius={8}
          pathOptions={{
            color: getCongestionColor(port.congestion),
            fillColor: getCongestionColor(port.congestion),
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <div className="font-pixel text-xs">
              <div>{port.name}</div>
              <div className="text-[10px]">Congestion: <span style={{ color: getCongestionColor(port.congestion) }}>{port.congestion}</span></div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      <Marker position={[origin.lat, origin.lon]}>
        <Popup>
          <div className="font-pixel text-xs">
            <div className="text-green-500">ORIGIN</div>
            <div>{origin.name}</div>
          </div>
        </Popup>
      </Marker>

      <Marker position={[destination.lat, destination.lon]}>
        <Popup>
          <div className="font-pixel text-xs">
            <div className="text-blue-500">DESTINATION</div>
            <div>{destination.name}</div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
