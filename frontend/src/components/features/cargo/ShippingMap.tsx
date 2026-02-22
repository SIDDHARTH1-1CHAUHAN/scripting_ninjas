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

interface Position {
  latitude: number
  longitude: number
  location_name: string
}

interface ShippingMapProps {
  currentPosition: Position
  route: { lat: number; lon: number; name: string; kind?: string }[]
  progressPercent: number
}

function computeBounds(points: { lat: number; lon: number }[]): [[number, number], [number, number]] {
  if (!points.length) {
    return [[-20, -20], [20, 20]]
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

  const latPadding = Math.max(1.2, (maxLat - minLat) * 0.25)
  const lonPadding = Math.max(1.2, (maxLon - minLon) * 0.25)

  return [
    [minLat - latPadding, minLon - lonPadding],
    [maxLat + latPadding, maxLon + lonPadding],
  ]
}

function splitRouteByProgress(
  route: { lat: number; lon: number }[],
  progressPercent: number,
): { completed: [number, number][]; remaining: [number, number][] } {
  if (route.length <= 1) {
    const single = route.map((point) => [point.lat, point.lon] as [number, number])
    return { completed: single, remaining: single }
  }

  const ratio = Math.max(0, Math.min(100, progressPercent)) / 100
  const pivot = Math.max(1, Math.min(route.length - 1, Math.round((route.length - 1) * ratio)))

  const completed = route.slice(0, pivot + 1).map((point) => [point.lat, point.lon] as [number, number])
  const remaining = route.slice(pivot).map((point) => [point.lat, point.lon] as [number, number])

  return { completed, remaining }
}

export function ShippingMap({ currentPosition, route, progressPercent }: ShippingMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [tileSourceIndex, setTileSourceIndex] = useState(0)
  const [mapRef, setMapRef] = useState<{
    fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: [number, number]; animate?: boolean }) => void
    invalidateSize: (animate?: boolean) => void
  } | null>(null)

  const tileSources = [
    {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      label: 'CARTO_DARK',
    },
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      label: 'OPENSTREETMAP',
    },
  ] as const

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const normalizedRoute = useMemo(() => {
    if (route.length >= 2) return route
    return [
      { lat: currentPosition.latitude, lon: currentPosition.longitude, name: 'Current Position', kind: 'current' },
    ]
  }, [currentPosition.latitude, currentPosition.longitude, route])

  const bounds = useMemo(
    () => computeBounds(normalizedRoute),
    [normalizedRoute],
  )

  const routeSplit = useMemo(
    () => splitRouteByProgress(normalizedRoute, progressPercent),
    [normalizedRoute, progressPercent],
  )

  const tileSource = tileSources[Math.min(tileSourceIndex, tileSources.length - 1)]

  useEffect(() => {
    if (!mapRef) return
    mapRef.fitBounds(bounds, { padding: [30, 30], animate: false })
    requestAnimationFrame(() => mapRef.invalidateSize(false))
  }, [bounds, mapRef])

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-panel flex items-center justify-center">
        <div className="font-pixel text-sm animate-pulse">LOADING_CARGO_MAP...</div>
      </div>
    )
  }

  return (
    <MapContainer
      ref={setMapRef}
      bounds={bounds}
      boundsOptions={{ padding: [30, 30] }}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      preferCanvas
      zoomAnimation={false}
      markerZoomAnimation={false}
      fadeAnimation={false}
    >
      <TileLayer
        attribution={tileSource.attribution}
        url={tileSource.url}
        eventHandlers={{
          tileerror: () => {
            setTileSourceIndex((prev) => (
              prev < tileSources.length - 1 ? prev + 1 : prev
            ))
          },
        }}
      />

      {routeSplit.remaining.length > 1 && (
        <Polyline
          positions={routeSplit.remaining}
          pathOptions={{ color: '#94a3b8', weight: 2, opacity: 0.5, dashArray: '8,8' }}
        />
      )}

      {routeSplit.completed.length > 1 && (
        <Polyline
          positions={routeSplit.completed}
          pathOptions={{ color: '#ffffff', weight: 4, opacity: 0.9 }}
        />
      )}

      {normalizedRoute.map((point, index) => {
        const kind = point.kind || 'waypoint'
        if (kind === 'waypoint') return null

        const markerStyle = kind === 'origin'
          ? { color: '#22c55e', fill: '#22c55e', radius: 7 }
          : kind === 'destination'
            ? { color: '#60a5fa', fill: '#60a5fa', radius: 7 }
            : { color: '#f59e0b', fill: '#f59e0b', radius: 5 }

        return (
          <CircleMarker
            key={`${kind}-${index}-${point.name}`}
            center={[point.lat, point.lon]}
            radius={markerStyle.radius}
            pathOptions={{
              color: markerStyle.color,
              fillColor: markerStyle.fill,
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <div className="font-pixel text-xs">
                <div>{kind.toUpperCase()}</div>
                <div>{point.name}</div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      <CircleMarker
        center={[currentPosition.latitude, currentPosition.longitude]}
        radius={7}
        pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.95 }}
      >
        <Popup>
          <div className="font-pixel text-xs">
            <div>CURRENT_POSITION</div>
            <div>{currentPosition.location_name}</div>
            <div className="text-[10px] opacity-70">
              {currentPosition.latitude.toFixed(3)}, {currentPosition.longitude.toFixed(3)}
            </div>
          </div>
        </Popup>
      </CircleMarker>

    </MapContainer>
  )
}
