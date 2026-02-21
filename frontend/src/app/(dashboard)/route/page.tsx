'use client'
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader'
import { RouteCard } from '@/components/features/route/RouteCard'
import { RouteMap } from '@/components/features/route/RouteMap'
import { Button } from '@/components/ui/Button'

const mockRoutes = [
  {
    id: '1',
    name: 'Direct Sea Freight',
    carrier: 'COSCO Shipping',
    transitDays: 18,
    cost: 1850,
    emissions: 245,
    congestionRisk: 'HIGH',
    recommended: false,
    waypoints: [
      { lat: 22.5431, lon: 114.0579, name: 'Yantian' },
      { lat: 33.7701, lon: -118.1937, name: 'Los Angeles' },
    ],
    color: '#FF4141',
  },
  {
    id: '2',
    name: 'Via Long Beach',
    carrier: 'Evergreen Marine',
    transitDays: 19,
    cost: 1720,
    emissions: 238,
    congestionRisk: 'MEDIUM',
    recommended: true,
    savings: 130,
    waypoints: [
      { lat: 22.5431, lon: 114.0579, name: 'Yantian' },
      { lat: 21.0, lon: -157.0, name: 'Hawaii' },
      { lat: 33.7544, lon: -118.2166, name: 'Long Beach' },
    ],
    color: '#00C853',
  },
  {
    id: '3',
    name: 'Express Air Freight',
    carrier: 'FedEx',
    transitDays: 4,
    cost: 8450,
    emissions: 1890,
    congestionRisk: 'LOW',
    recommended: false,
    waypoints: [
      { lat: 22.3193, lon: 114.1694, name: 'Hong Kong HKG' },
      { lat: 33.9425, lon: -118.4081, name: 'Los Angeles LAX' },
    ],
    color: '#FFB800',
  },
]

const origin = { code: 'CNSZX', name: 'Yantian, Shenzhen', lat: 22.5431, lon: 114.0579 }
const destination = { code: 'USLAX', name: 'Los Angeles', lat: 33.7701, lon: -118.1937 }

export default function RoutePage() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>('2')

  return (
    <AppLayout
      rightPanel={
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center pb-4 border-b border-[#333]">
            <div className="label text-text-inv">ROUTE_MAP</div>
          </div>
          <div className="flex-1 mt-4 border border-[#333]" style={{ minHeight: '300px' }}>
            <RouteMap
              origin={origin}
              destination={destination}
              routes={mockRoutes}
              selectedRouteId={selectedRoute || undefined}
            />
          </div>
          <div className="mt-4 text-xs text-[#888]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#FF4141]"></span>
              <span>High Congestion</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#FFB800]"></span>
              <span>Medium Congestion</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00C853]"></span>
              <span>Low Congestion</span>
            </div>
          </div>
        </div>
      }
    >
      <WorkspaceHeader title="ROUTE" pixelTitle="OPTIMIZER" metaLabel="ANALYSIS ID" metaValue="RT_8824_XQ" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 p-4 border border-dark bg-canvas">
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
        <div className="grid gap-4">
          {mockRoutes.map((route) => (
            <RouteCard key={route.id} route={route} selected={selectedRoute === route.id} onClick={() => setSelectedRoute(route.id)} />
          ))}
        </div>
      </div>
      <div className="p-6 bg-canvas border-t-2 border-dark flex justify-end gap-4">
        <Button variant="secondary">COMPARE_ALL</Button>
        <Button disabled={!selectedRoute}>SELECT_ROUTE ›</Button>
      </div>
    </AppLayout>
  )
}
