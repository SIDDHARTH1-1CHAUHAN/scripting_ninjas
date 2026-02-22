'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false },
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false },
)
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false },
)

interface Port {
  code: string
  name: string
  lat: number
  lon: number
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

function buildBounds(points: Array<{ lat: number; lon: number }>): [[number, number], [number, number]] {
  if (points.length === 0) {
    return [[-15, -15], [15, 15]]
  }

  let minLat = points[0].lat
  let maxLat = points[0].lat
  let minLon = points[0].lon
  let maxLon = points[0].lon

  points.forEach((point) => {
    minLat = Math.min(minLat, point.lat)
    maxLat = Math.max(maxLat, point.lat)
    minLon = Math.min(minLon, point.lon)
    maxLon = Math.max(maxLon, point.lon)
  })

  if (minLat === maxLat) {
    minLat -= 0.9
    maxLat += 0.9
  }
  if (minLon === maxLon) {
    minLon -= 0.9
    maxLon += 0.9
  }

  return [[minLat, minLon], [maxLat, maxLon]]
}

export function RouteMap({ origin, destination, routes, selectedRouteId }: RouteMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mapRef, setMapRef] = useState<{
    fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: [number, number]; animate?: boolean }) => void
    invalidateSize: (animate?: boolean) => void
  } | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const syncTheme = () => {
      const themeValue = document.documentElement.getAttribute('data-theme')
      setTheme(themeValue === 'light' ? 'light' : 'dark')
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [isMounted])

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId)
      || routes.find((route) => route.recommended)
      || routes[0],
    [routes, selectedRouteId],
  )

  const focusWaypoints = useMemo(
    () => (activeRoute?.waypoints?.length
      ? activeRoute.waypoints
      : [
          { lat: origin.lat, lon: origin.lon, name: origin.name },
          { lat: destination.lat, lon: destination.lon, name: destination.name },
        ]),
    [activeRoute, destination.lat, destination.lon, destination.name, origin.lat, origin.lon, origin.name],
  )

  const bounds = useMemo(
    () => buildBounds(focusWaypoints),
    [focusWaypoints],
  )

  const mapThemeConfig = theme === 'light'
    ? {
        tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        activeStroke: '#111827',
        waypoint: '#64748b',
      }
    : {
        tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        activeStroke: '#ffffff',
        waypoint: '#94a3b8',
      }

  useEffect(() => {
    if (!mapRef) return

    mapRef.fitBounds(bounds, { padding: [24, 24], animate: false })
    requestAnimationFrame(() => mapRef.invalidateSize(false))
  }, [bounds, mapRef])

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-panel flex items-center justify-center">
        <div className="font-pixel text-sm animate-pulse">LOADING_ROUTE_GRAPH...</div>
      </div>
    )
  }

  return (
    <MapContainer
      ref={setMapRef}
      bounds={bounds}
      boundsOptions={{ padding: [24, 24] }}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      preferCanvas
      zoomAnimation={false}
      markerZoomAnimation={false}
      fadeAnimation={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url={mapThemeConfig.tileUrl}
      />

      {routes
        .filter((route) => !activeRoute || route.id !== activeRoute.id)
        .map((route) => (
          <Polyline
            key={route.id}
            positions={route.waypoints.map((waypoint) => [waypoint.lat, waypoint.lon] as [number, number])}
            pathOptions={{
              color: route.color,
              weight: 2,
              opacity: 0.35,
              dashArray: '6, 8',
            }}
          />
        ))}

      {activeRoute && (
        <>
          <Polyline
            positions={activeRoute.waypoints.map((waypoint) => [waypoint.lat, waypoint.lon] as [number, number])}
            pathOptions={{
              color: mapThemeConfig.activeStroke,
              weight: 5,
              opacity: 0.95,
            }}
          />
          <Polyline
            positions={activeRoute.waypoints.map((waypoint) => [waypoint.lat, waypoint.lon] as [number, number])}
            pathOptions={{
              color: activeRoute.color,
              weight: 3,
              opacity: 0.85,
            }}
          />
        </>
      )}

      {activeRoute?.waypoints.slice(1, -1).map((waypoint, index) => (
        <CircleMarker
          key={`${waypoint.name}-${index}`}
          center={[waypoint.lat, waypoint.lon]}
          radius={5}
          pathOptions={{
            color: mapThemeConfig.waypoint,
            fillColor: mapThemeConfig.waypoint,
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <div className="text-xs font-pixel">{waypoint.name}</div>
          </Popup>
        </CircleMarker>
      ))}

      <CircleMarker
        center={[origin.lat, origin.lon]}
        radius={8}
        pathOptions={{
          color: '#00C853',
          fillColor: '#00C853',
          fillOpacity: 0.9,
        }}
      >
        <Popup>
          <div className="font-pixel text-xs">
            <div>ORIGIN</div>
            <div>{origin.name}</div>
          </div>
        </Popup>
      </CircleMarker>

      <CircleMarker
        center={[destination.lat, destination.lon]}
        radius={8}
        pathOptions={{
          color: '#60A5FA',
          fillColor: '#60A5FA',
          fillOpacity: 0.9,
        }}
      >
        <Popup>
          <div className="font-pixel text-xs">
            <div>DESTINATION</div>
            <div>{destination.name}</div>
          </div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  )
}
