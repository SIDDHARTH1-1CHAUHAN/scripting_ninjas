'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ShippingMap } from '@/components/features/cargo/ShippingMap'
import { TrackingTimeline } from '@/components/features/cargo/TrackingTimeline'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  getCargoShipments,
  trackShipment,
  type CargoShipmentSummary,
  type CargoTrackingResponse,
} from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

function normalizeContainerId(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function alertStyle(type: string): string {
  const normalized = type.toUpperCase()
  if (normalized === 'CRITICAL') return 'border-warning text-warning bg-warning/10'
  if (normalized === 'WARNING') return 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
  return 'border-[#555] text-[#bbb] bg-[#222]/60'
}

export default function CargoPage() {
  const [containerId, setContainerId] = useState('TCLU1234567')
  const [shipment, setShipment] = useState<CargoTrackingResponse | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(false)
  const [samples, setSamples] = useState<CargoShipmentSummary[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const { add } = useToast()

  const loadTracking = useCallback(async (id: string, options?: { quiet?: boolean }) => {
    const normalized = normalizeContainerId(id)
    if (!normalized) {
      if (!options?.quiet) {
        add('error', 'Enter a valid container ID')
      }
      return
    }

    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await trackShipment(normalized)
      setShipment(response)
      setContainerId(normalized)
      setLastSyncedAt(new Date().toISOString())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tracking failed'
      setErrorMessage(message)
      if (!options?.quiet) {
        add('error', message)
      }
    } finally {
      setLoading(false)
    }
  }, [add])

  useEffect(() => {
    void loadTracking(containerId, { quiet: true })
    void (async () => {
      try {
        const list = await getCargoShipments()
        setSamples(list)
      } catch {
        setSamples([])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!autoRefresh || !shipment) return

    const interval = setInterval(() => {
      void loadTracking(shipment.shipment.container_id, { quiet: true })
    }, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadTracking, shipment])

  const routePath = useMemo(() => {
    if (!shipment) return []

    if (shipment.route_points && shipment.route_points.length > 0) {
      return shipment.route_points.map((point) => ({
        lat: point.lat,
        lon: point.lon,
        name: point.name,
        kind: point.kind,
      }))
    }

    return [
      {
        lat: shipment.current_position.latitude,
        lon: shipment.current_position.longitude,
        name: shipment.current_position.location_name,
        kind: 'current',
      },
    ]
  }, [shipment])

  const currentStatus = useMemo(() => {
    if (!shipment?.timeline?.length) return 'IN_TRANSIT'
    const current = shipment.timeline.find((event) => event.current)
    if (current) return current.status
    const completed = shipment.timeline.filter((event) => event.completed)
    return completed[completed.length - 1]?.status || 'IN_TRANSIT'
  }, [shipment])

  const handleTrack = async () => {
    await loadTracking(containerId)
  }

  return (
    <AppLayout>
      <WorkspaceHeader
        title="CARGO"
        pixelTitle="LOCATOR"
        metaLabel="VESSEL"
        metaValue={shipment?.shipment.vessel || 'N/A'}
      />

      <div className="dashboard-scroll flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        <section className="border border-dark bg-canvas p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <Input
              label="CONTAINER ID"
              value={containerId}
              onChange={(event) => setContainerId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleTrack()
                }
              }}
              placeholder="e.g. TCLU1234567"
            />
            <Button variant="secondary" onClick={() => setAutoRefresh((prev) => !prev)} className="px-4 py-3 text-sm">
              {autoRefresh ? 'AUTO_REFRESH_ON' : 'AUTO_REFRESH_OFF'}
            </Button>
            <Button onClick={handleTrack} disabled={loading} className="px-4 py-3 text-sm">
              {loading ? 'TRACKING...' : 'TRACK_CONTAINER ›'}
            </Button>
          </div>

          <div className="flex flex-col gap-1 text-xs md:flex-row md:items-center md:justify-between">
            <div className={errorMessage ? 'text-warning' : 'text-[#166534]'}>
              {errorMessage ? `BACKEND_STATUS: ${errorMessage}` : 'BACKEND_STATUS: CONNECTED'}
            </div>
            <div className="opacity-65">
              LAST_SYNC: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : '--'}
            </div>
          </div>

          {samples.length > 0 && (
            <div>
              <div className="label mb-2">QUICK SAMPLE CONTAINERS</div>
              <div className="flex flex-wrap gap-2">
                {samples.slice(0, 6).map((sample) => (
                  <button
                    key={sample.container_id}
                    onClick={() => void loadTracking(sample.container_id)}
                    className="text-xs border border-dark px-3 py-1.5 hover:bg-dark hover:text-canvas transition-colors"
                  >
                    {sample.container_id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {!shipment && (
          <div className="border border-dark p-10 text-center text-sm opacity-70">
            Enter a container ID and start tracking.
          </div>
        )}

        {shipment && (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-4">
              <div className="border border-dark bg-panel overflow-hidden">
                <div className="px-4 py-3 border-b border-dark flex items-center justify-between bg-canvas">
                  <div>
                    <div className="label">LIVE CARGO MAP</div>
                    <div className="text-xs opacity-70">{shipment.shipment.origin_port} → {shipment.shipment.destination_port}</div>
                  </div>
                  <div className="text-right">
                    <div className="label">PROGRESS</div>
                    <div className="font-pixel text-sm">{shipment.progress_percent}%</div>
                  </div>
                </div>

                <div className="relative h-[460px]">
                  <ShippingMap
                    currentPosition={shipment.current_position}
                    route={routePath}
                    progressPercent={shipment.progress_percent}
                  />

                  <div className="absolute top-3 left-3 bg-dark/90 text-text-inv p-3 border border-[#333] text-xs max-w-[320px]">
                    <div className="font-pixel text-sm mb-1">{shipment.shipment.vessel}</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 opacity-90">
                      <span className="opacity-60">Carrier</span>
                      <span>{shipment.shipment.carrier}</span>
                      <span className="opacity-60">Voyage</span>
                      <span>{shipment.shipment.voyage}</span>
                      <span className="opacity-60">Speed</span>
                      <span>{shipment.current_position.speed_knots} kn</span>
                      <span className="opacity-60">Heading</span>
                      <span>{shipment.current_position.heading}°</span>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-dark/92 p-3 border-t border-[#333]">
                    <div className="flex justify-between text-xs text-text-inv mb-2">
                      <span>{shipment.shipment.origin_country}</span>
                      <span className="font-pixel">{currentStatus.replace(/_/g, ' ')}</span>
                      <span>{shipment.shipment.destination_country}</span>
                    </div>
                    <div className="h-2 bg-[#333]">
                      <div
                        className="h-full bg-[#22c55e] transition-all duration-500"
                        style={{ width: `${shipment.progress_percent}%` }}
                      />
                    </div>
                    <div className="text-center text-xs mt-2 text-[#b0b0b0]">
                      ETA: {new Date(shipment.shipment.eta).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-dark bg-dark/90 text-text-inv p-4">
                  <div className="label text-[#9ca3af] mb-3">TRACKING TIMELINE</div>
                  <TrackingTimeline events={shipment.timeline} />
                </div>

                <div className="border border-dark bg-canvas p-4">
                  <div className="label mb-3">ALERTS</div>
                  <div className="space-y-2">
                    {shipment.alerts.length === 0 && (
                      <div className="text-xs opacity-60">No active alerts</div>
                    )}
                    {shipment.alerts.map((alert) => (
                      <div key={`${alert.type}-${alert.timestamp}`} className={`border p-3 text-xs ${alertStyle(alert.type)}`}>
                        <div className="font-pixel text-[11px] mb-1">{alert.type}</div>
                        <div>{alert.message}</div>
                        <div className="opacity-60 mt-1">{new Date(alert.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <div className="border border-dark p-3 bg-canvas">
                <div className="label">CONTAINER</div>
                <div className="font-pixel text-sm break-all">{shipment.shipment.container_id}</div>
              </div>
              <div className="border border-dark p-3 bg-canvas">
                <div className="label">B/L</div>
                <div className="font-pixel text-sm break-all">{shipment.shipment.bill_of_lading}</div>
              </div>
              <div className="border border-dark p-3 bg-canvas">
                <div className="label">CARGO</div>
                <div className="text-xs">{shipment.shipment.cargo_description}</div>
              </div>
              <div className="border border-dark p-3 bg-canvas">
                <div className="label">HS CODE</div>
                <div className="font-pixel text-sm">{shipment.shipment.hs_code}</div>
              </div>
              <div className="border border-dark p-3 bg-canvas">
                <div className="label">RELIABILITY</div>
                <div className="font-pixel text-sm">{shipment.reliability_score ?? 'N/A'}</div>
              </div>
              <div className="border border-dark p-3 bg-canvas">
                <div className="label">DELAY RISK</div>
                <div className={`font-pixel text-sm ${
                  shipment.delay_risk === 'HIGH'
                    ? 'text-warning'
                    : shipment.delay_risk === 'MEDIUM'
                      ? 'text-yellow-500'
                      : 'text-green-600'
                }`}>
                  {shipment.delay_risk || 'LOW'}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  )
}
