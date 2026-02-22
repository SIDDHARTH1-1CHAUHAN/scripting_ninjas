'use client'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { RouteCard } from '@/components/features/route/RouteCard'
import { RouteMap } from '@/components/features/route/RouteMap'
import { RouteMetricsGraph } from '@/components/features/route/RouteMetricsGraph'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { compareRoutes } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface Port {
  code: string
  name: string
  lat: number
  lon: number
}

interface CountryPreset {
  country: string
  defaultLocation: string
  mapCenter: { lat: number; lon: number }
}

interface UIRoute {
  id: string
  name: string
  carrier: string
  transitDays: number
  cost: number
  emissions: number
  congestionRisk: string
  recommended: boolean
  savings?: number
  waypoints: { lat: number; lon: number; name: string }[]
  color: string
}

const PORTS: Record<string, Port> = {
  CNSZX: { code: 'CNSZX', name: 'Yantian, Shenzhen', lat: 22.5431, lon: 114.0579 },
  USLAX: { code: 'USLAX', name: 'Los Angeles', lat: 33.7701, lon: -118.1937 },
  USLGB: { code: 'USLGB', name: 'Long Beach', lat: 33.7544, lon: -118.2166 },
  HKHKG: { code: 'HKHKG', name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  SGSIN: { code: 'SGSIN', name: 'Singapore', lat: 1.2644, lon: 103.8222 },
  NLRTM: { code: 'NLRTM', name: 'Rotterdam', lat: 51.9244, lon: 4.4777 },
}

const ROUTE_COLORS = ['#FF4141', '#00C853', '#FFB800', '#66BBFF']
const COUNTRY_PRESETS: CountryPreset[] = [
  { country: 'China', defaultLocation: 'Shenzhen, China', mapCenter: { lat: 22.5431, lon: 114.0579 } },
  { country: 'United States', defaultLocation: 'Los Angeles, United States', mapCenter: { lat: 33.7701, lon: -118.1937 } },
  { country: 'Germany', defaultLocation: 'Hamburg, Germany', mapCenter: { lat: 53.5511, lon: 9.9937 } },
  { country: 'France', defaultLocation: 'Paris, France', mapCenter: { lat: 48.8566, lon: 2.3522 } },
  { country: 'India', defaultLocation: 'Mumbai, India', mapCenter: { lat: 19.076, lon: 72.8777 } },
  { country: 'Singapore', defaultLocation: 'Singapore', mapCenter: { lat: 1.3521, lon: 103.8198 } },
  { country: 'Netherlands', defaultLocation: 'Rotterdam, Netherlands', mapCenter: { lat: 51.9244, lon: 4.4777 } },
  { country: 'Japan', defaultLocation: 'Tokyo, Japan', mapCenter: { lat: 35.6762, lon: 139.6503 } },
  { country: 'United Arab Emirates', defaultLocation: 'Dubai, United Arab Emirates', mapCenter: { lat: 25.2048, lon: 55.2708 } },
  { country: 'Brazil', defaultLocation: 'Santos, Brazil', mapCenter: { lat: -23.9608, lon: -46.3336 } },
  { country: 'Australia', defaultLocation: 'Melbourne, Australia', mapCenter: { lat: -37.8136, lon: 144.9631 } },
]
const LOCATION_SUGGESTIONS = COUNTRY_PRESETS.map((preset) => preset.defaultLocation)

function resolvePortCode(input: string): string {
  const query = input.trim().toUpperCase()
  if (!query) return ''
  if (query.includes('LOS ANGELES')) return 'USLAX'
  if (query.includes('LONG BEACH')) return 'USLGB'
  if (query.includes('SHENZHEN') || query.includes('YANTIAN')) return 'CNSZX'
  if (query.includes('HONG KONG')) return 'HKHKG'
  if (query.includes('SINGAPORE')) return 'SGSIN'
  if (query.includes('ROTTERDAM')) return 'NLRTM'
  return ''
}

export default function RoutePage() {
  const [originCountry, setOriginCountry] = useState('China')
  const [destinationCountry, setDestinationCountry] = useState('United States')
  const [originInput, setOriginInput] = useState('Yantian, Shenzhen, China')
  const [destinationInput, setDestinationInput] = useState('Los Angeles, United States')
  const [origin, setOrigin] = useState<Port>(PORTS.CNSZX)
  const [destination, setDestination] = useState<Port>(PORTS.USLAX)
  const [routes, setRoutes] = useState<UIRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { add } = useToast()
  const selectedRouteData = routes.find((route) => route.id === selectedRoute) || routes[0]

  const mapRoute = (
    route: {
      id: string
      name: string
      carrier: string
      transit_days: number
      cost_usd: number
      emissions_kg_co2: number
      congestion_risk: string
      recommended: boolean
      savings?: number
      waypoints: Array<{ port?: string; lat?: number; lon?: number; name?: string }>
    },
    index: number,
    originPort: Port,
    destinationPort: Port,
  ): UIRoute => {
    const waypoints = route.waypoints.map((waypoint, waypointIndex) => {
      if (typeof waypoint.lat === 'number' && typeof waypoint.lon === 'number') {
        return {
          lat: waypoint.lat,
          lon: waypoint.lon,
          name: waypoint.name || `Waypoint ${waypointIndex + 1}`,
        }
      }

      const code = waypoint.port || (waypointIndex === 0 ? originPort.code : destinationPort.code)
      const resolvedPort = PORTS[code] || (waypointIndex === 0 ? originPort : destinationPort)
      return {
        lat: resolvedPort.lat,
        lon: resolvedPort.lon,
        name: resolvedPort.name,
      }
    })

    return {
      id: route.id,
      name: route.name,
      carrier: route.carrier,
      transitDays: route.transit_days,
      cost: route.cost_usd,
      emissions: route.emissions_kg_co2,
      congestionRisk: route.congestion_risk,
      recommended: route.recommended,
      savings: route.savings,
      waypoints,
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
    }
  }

  const applySelectedRouteEndpoints = (selectedId: string | null, routeSet: UIRoute[]) => {
    const activeRoute = routeSet.find((route) => route.id === selectedId) || routeSet[0]
    if (!activeRoute || activeRoute.waypoints.length < 2) return

    const firstWaypoint = activeRoute.waypoints[0]
    const lastWaypoint = activeRoute.waypoints[activeRoute.waypoints.length - 1]

    setOrigin((prev) => ({
      ...prev,
      name: originInput,
      lat: firstWaypoint.lat,
      lon: firstWaypoint.lon,
    }))
    setDestination((prev) => ({
      ...prev,
      name: destinationInput,
      lat: lastWaypoint.lat,
      lon: lastWaypoint.lon,
    }))
  }

  const loadRoutes = async () => {
    setLoading(true)

    const originCode = resolvePortCode(originInput)
    const destinationCode = resolvePortCode(destinationInput)
    const originSeed = (originCode && PORTS[originCode]) ? PORTS[originCode] : origin
    const destinationSeed = (destinationCode && PORTS[destinationCode]) ? PORTS[destinationCode] : destination

    setOrigin({ ...originSeed, name: originInput })
    setDestination({ ...destinationSeed, name: destinationInput })

    try {
      const response = await compareRoutes({
        origin_port: originCode || 'CUSTOM_ORIGIN',
        destination_port: destinationCode || 'CUSTOM_DESTINATION',
        origin_location: originInput,
        destination_location: destinationInput,
        cargo_weight_kg: 1250,
        cargo_value_usd: 62500,
        hs_code: '8504.40.95',
      })

      const mappedRoutes = response.routes.map((route, idx) =>
        mapRoute(route, idx, originSeed, destinationSeed),
      )
      setRoutes(mappedRoutes)

      const nextSelected = response.recommended_route_id || mappedRoutes[0]?.id || null
      setSelectedRoute(nextSelected)
      applySelectedRouteEndpoints(nextSelected, mappedRoutes)
    } catch (error) {
      setRoutes([])
      setSelectedRoute(null)
      add('error', error instanceof Error ? error.message : 'Route loading failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRoute = (routeId: string) => {
    setSelectedRoute(routeId)
    applySelectedRouteEndpoints(routeId, routes)
  }

  const applyCountryPreset = (country: string, mode: 'origin' | 'destination') => {
    const preset = COUNTRY_PRESETS.find((item) => item.country === country)
    if (!preset) return

    const nextPoint: Port = {
      code: mode === 'origin' ? 'CUSTOM_ORIGIN' : 'CUSTOM_DESTINATION',
      name: preset.defaultLocation,
      lat: preset.mapCenter.lat,
      lon: preset.mapCenter.lon,
    }

    setRoutes([])
    setSelectedRoute(null)

    if (mode === 'origin') {
      setOriginInput(preset.defaultLocation)
      setOrigin(nextPoint)
      return
    }
    setDestinationInput(preset.defaultLocation)
    setDestination(nextPoint)
  }

  useEffect(() => {
    loadRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppLayout
      rightPanel={
        <div className="flex flex-col h-full gap-4">
          <div className="border border-dark/50 bg-canvas/10 p-3">
            <div className="label text-text-inv">LIVE ROUTE MAP</div>
            <div className="text-xs text-text-inv/70 mt-1">
              Selected route is highlighted, alternatives stay visible for comparison.
            </div>
          </div>
          <div className="h-[52vh] border border-dark/50 min-h-[360px] overflow-hidden">
            <RouteMap
              origin={origin}
              destination={destination}
              routes={routes}
              selectedRouteId={selectedRoute || undefined}
            />
          </div>

          {selectedRouteData && (
            <div className="border border-dark/50 p-3 text-xs bg-canvas/10">
              <div className="label text-text-inv mb-2">SELECTED ROUTE METRICS</div>
              <div className="font-pixel text-sm text-text-inv mb-3">{selectedRouteData.name}</div>
              <div className="grid grid-cols-2 gap-2 text-text-inv/80">
                <div>
                  <div className="text-[10px] opacity-70">COST</div>
                  <div className="font-pixel text-text-inv">${selectedRouteData.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-[10px] opacity-70">TRANSIT</div>
                  <div className="font-pixel text-text-inv">{selectedRouteData.transitDays} DAYS</div>
                </div>
                <div>
                  <div className="text-[10px] opacity-70">CO2</div>
                  <div className="font-pixel text-text-inv">{selectedRouteData.emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} KG</div>
                </div>
                <div>
                  <div className="text-[10px] opacity-70">CONGESTION</div>
                  <div className="font-pixel text-text-inv">{selectedRouteData.congestionRisk}</div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-text-inv/75 border border-dark/50 bg-canvas/10 p-3">
            <div className="label text-text-inv mb-2">LEGEND</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#60A5FA]"></span>
              <span>Selected Route</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#94a3b8]"></span>
              <span>Intermediary Waypoints</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#FFB800]"></span>
              <span>Alternative Routes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00C853]"></span>
              <span>Origin</span>
            </div>
          </div>
        </div>
      }
    >
      <WorkspaceHeader title="ROUTE" pixelTitle="OPTIMIZER" metaLabel="ANALYSIS ID" metaValue="RT_8824_XQ" />
      <div className="dashboard-scroll flex-1 overflow-y-auto p-4 lg:p-6 space-y-3">
        <div className="border border-dark p-3 lg:p-4 bg-panel/75 shadow-[var(--surface-shadow)] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1.4fr_1fr_1.4fr_auto] gap-3 items-end">
          <div>
            <div className="label mb-1">ORIGIN COUNTRY</div>
            <select
              className="w-full bg-transparent border border-dark p-3 focus:outline-none focus:border-2"
              value={originCountry}
              onChange={(event) => {
                const country = event.target.value
                setOriginCountry(country)
                applyCountryPreset(country, 'origin')
              }}
            >
              {COUNTRY_PRESETS.map((preset) => (
                <option key={`origin-${preset.country}`} value={preset.country}>
                  {preset.country}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="ORIGIN"
            value={originInput}
            onChange={(event) => setOriginInput(event.target.value)}
            placeholder="e.g. Hamburg, Germany"
            list="route-location-options"
          />
          <div>
            <div className="label mb-1">DESTINATION COUNTRY</div>
            <select
              className="w-full bg-transparent border border-dark p-3 focus:outline-none focus:border-2"
              value={destinationCountry}
              onChange={(event) => {
                const country = event.target.value
                setDestinationCountry(country)
                applyCountryPreset(country, 'destination')
              }}
            >
              {COUNTRY_PRESETS.map((preset) => (
                <option key={`destination-${preset.country}`} value={preset.country}>
                  {preset.country}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="DESTINATION"
            value={destinationInput}
            onChange={(event) => setDestinationInput(event.target.value)}
            placeholder="e.g. Paris, France"
            list="route-location-options"
          />
          <Button
            variant="secondary"
            onClick={loadRoutes}
            disabled={loading}
            className="px-4 py-3 text-sm md:col-span-2 xl:col-span-1 xl:justify-self-end"
          >
            {loading ? 'COMPARING...' : 'GET_WEB_ROUTES'}
          </Button>
          <datalist id="route-location-options">
            {LOCATION_SUGGESTIONS.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </div>

        <div className="mb-2 p-4 border border-dark bg-panel/75 shadow-[var(--surface-shadow)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="label">ORIGIN</div>
              <div className="font-pixel">{origin.name}</div>
            </div>
            <div>
              <div className="label">DESTINATION</div>
              <div className="font-pixel">{destination.name}</div>
            </div>
          </div>
        </div>

        <RouteMetricsGraph
          routes={routes.map((route) => ({
            id: route.id,
            name: route.name,
            cost: route.cost,
            transitDays: route.transitDays,
            emissions: route.emissions,
            recommended: route.recommended,
          }))}
          selectedRouteId={selectedRoute}
          onSelect={handleSelectRoute}
        />

        <div className="lg:hidden border border-dark bg-panel/75 p-3 shadow-[var(--surface-shadow)]">
          <div className="label mb-2">MAP PREVIEW</div>
          <div className="h-56 border border-dark">
            <RouteMap
              origin={origin}
              destination={destination}
              routes={routes}
              selectedRouteId={selectedRoute || undefined}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {loading && (
            <div className="border border-dark p-4 text-sm opacity-70 bg-panel/75 shadow-[var(--surface-shadow)]">Loading route options...</div>
          )}
          {!loading && routes.length === 0 && (
            <div className="border border-warning p-4 text-sm bg-panel/85">
              No routes available. Try different origin/destination input.
            </div>
          )}
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              selected={selectedRoute === route.id}
              onClick={() => handleSelectRoute(route.id)}
            />
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 z-10 p-3 lg:p-4 bg-canvas/92 backdrop-blur-md border-t border-dark flex justify-end gap-3 shadow-[0_-12px_30px_rgba(0,0,0,0.12)]">
        <Button variant="secondary" onClick={loadRoutes} disabled={loading} className="px-4 py-3 text-sm">
          {loading ? 'COMPARING...' : 'REFRESH_ROUTES'}
        </Button>
        <Button disabled={!selectedRoute} className="px-4 py-3 text-sm">SELECT_ROUTE ›</Button>
      </div>
    </AppLayout>
  )
}
