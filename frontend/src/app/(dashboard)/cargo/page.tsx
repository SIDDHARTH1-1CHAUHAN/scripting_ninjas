'use client'
import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { ShippingMap } from '@/components/features/cargo/ShippingMap'
import { TrackingTimeline } from '@/components/features/cargo/TrackingTimeline'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const mockShipment = {
  container_id: 'TCLU1234567',
  vessel: 'CSCL Saturn',
  carrier: 'COSCO Shipping',
  origin: { lat: 22.5431, lon: 114.0579, name: 'Yantian, Shenzhen' },
  destination: { lat: 33.7544, lon: -118.2166, name: 'Long Beach, CA' },
  route: [
    { lat: 22.5431, lon: 114.0579, name: 'Yantian Port' },
    { lat: 21.0, lon: 130.0, name: 'Pacific Ocean' },
    { lat: 25.0, lon: 180.0, name: 'International Date Line' },
    { lat: 30.0, lon: -150.0, name: 'Mid-Pacific' },
    { lat: 33.7544, lon: -118.2166, name: 'Long Beach' },
  ],
  currentPosition: {
    latitude: 28.5,
    longitude: -155.0,
    location_name: 'Pacific Ocean, approaching Hawaii',
    speed_knots: 18.5,
    heading: 75,
  },
  progress_percent: 65,
  eta: '2026-02-28T14:00:00Z',
}

const mockTimeline = [
  { status: 'CONTAINER_LOADED', location: 'Yantian Port', timestamp: '2026-02-09T14:30:00Z', completed: true },
  { status: 'DEPARTED_ORIGIN', location: 'Yantian Port', timestamp: '2026-02-10T08:00:00Z', completed: true },
  { status: 'IN_TRANSIT', location: 'Pacific Ocean', timestamp: '2026-02-18T12:00:00Z', completed: true, current: true },
  { status: 'ARRIVAL_AT_DESTINATION', location: 'Long Beach Port', timestamp: '2026-02-28T14:00:00Z', completed: false },
  { status: 'CUSTOMS_CLEARANCE', location: 'Long Beach Port', timestamp: '2026-02-29T10:00:00Z', completed: false },
  { status: 'DELIVERED', location: 'Los Angeles Warehouse', timestamp: '2026-03-02T16:00:00Z', completed: false },
]

export default function CargoPage() {
  const [containerId, setContainerId] = useState('TCLU1234567')
  const [shipment, setShipment] = useState(mockShipment)
  const [isTracking, setIsTracking] = useState(true)

  useEffect(() => {
    if (!isTracking) return

    const interval = setInterval(() => {
      setShipment((prev) => ({
        ...prev,
        currentPosition: {
          ...prev.currentPosition,
          longitude: prev.currentPosition.longitude + 0.2,
          latitude: prev.currentPosition.latitude + 0.05,
        },
        progress_percent: Math.min(prev.progress_percent + 0.5, 99),
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [isTracking])

  const handleTrack = () => {
    setIsTracking(true)
    setShipment({ ...mockShipment, container_id: containerId })
  }

  return (
    <AppLayout
      rightPanel={
        <div className="p-4">
          <div className="label text-text-inv mb-4">TRACKING_TIMELINE</div>
          <div className="border border-[#333] p-4 bg-dark/80 text-text-inv" style={{ minHeight: '300px' }}>
            <TrackingTimeline events={mockTimeline} />
          </div>
        </div>
      }
    >
      <WorkspaceHeader title="CARGO" pixelTitle="TRACKING" metaLabel="VESSEL" metaValue={shipment.vessel} />

      <div className="p-4 bg-canvas border-b border-dark flex gap-2 items-center">
        <Input
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
          placeholder="Enter Container ID, B/L, or Vessel..."
          className="flex-1"
        />
        <Button onClick={handleTrack}>TRACK ›</Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative" style={{ minHeight: '350px' }}>
          <ShippingMap
            currentPosition={shipment.currentPosition}
            route={shipment.route}
            originPort={shipment.origin}
            destinationPort={shipment.destination}
          />
          <div className="absolute top-4 left-4 bg-dark/90 text-text-inv p-4 text-xs border border-[#333]">
            <div className="font-pixel text-lg mb-2">{shipment.vessel}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="opacity-60">Speed:</span>
              <span>{shipment.currentPosition.speed_knots} knots</span>
              <span className="opacity-60">Heading:</span>
              <span>{shipment.currentPosition.heading}°</span>
              <span className="opacity-60">Position:</span>
              <span>{shipment.currentPosition.location_name}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-dark/90 p-4">
            <div className="flex justify-between text-xs text-text-inv mb-2">
              <span>{shipment.origin.name}</span>
              <span className="font-pixel">{shipment.progress_percent.toFixed(0)}%</span>
              <span>{shipment.destination.name}</span>
            </div>
            <div className="h-2 bg-[#333]">
              <div className="h-full bg-text-inv transition-all duration-1000" style={{ width: `${shipment.progress_percent}%` }} />
            </div>
            <div className="text-center text-xs mt-2 text-[#888]">
              ETA: {new Date(shipment.eta).toLocaleDateString()} {new Date(shipment.eta).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="p-4 bg-panel border-t border-dark">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="label">CARRIER</div>
              <div className="font-pixel">{shipment.carrier}</div>
            </div>
            <div>
              <div className="label">VESSEL</div>
              <div className="font-pixel">{shipment.vessel}</div>
            </div>
            <div>
              <div className="label">CONTAINER</div>
              <div className="font-pixel">{shipment.container_id}</div>
            </div>
            <div>
              <div className="label">STATUS</div>
              <div className="font-pixel text-green-600">IN_TRANSIT</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
