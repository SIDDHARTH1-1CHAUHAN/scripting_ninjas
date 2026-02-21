interface RouteCardProps {
  route: {
    id: string
    name: string
    carrier: string
    transitDays: number
    cost: number
    emissions: number
    congestionRisk: string
    recommended: boolean
    savings?: number
  }
  selected: boolean
  onClick: () => void
}

export function RouteCard({ route, selected, onClick }: RouteCardProps) {
  return (
    <div
      onClick={onClick}
      className={`border-2 p-4 cursor-pointer transition-all ${
        selected ? 'border-dark bg-dark/5' : 'border-[#888] hover:border-dark'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-pixel text-lg">{route.name}</div>
          <div className="text-sm opacity-60">{route.carrier}</div>
        </div>
        {route.recommended && (
          <span className="bg-dark text-canvas px-2 py-1 text-xs font-pixel">RECOMMENDED</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <div className="label">TRANSIT</div>
          <div className="font-pixel">{route.transitDays} DAYS</div>
        </div>
        <div>
          <div className="label">COST</div>
          <div className="font-pixel">${route.cost.toLocaleString()}</div>
        </div>
        <div>
          <div className="label">CO2</div>
          <div className="font-pixel">{route.emissions} KG</div>
        </div>
        <div>
          <div className="label">CONGESTION</div>
          <div
            className={`font-pixel ${
              route.congestionRisk === 'HIGH'
                ? 'text-warning'
                : route.congestionRisk === 'MEDIUM'
                ? 'text-yellow-500'
                : ''
            }`}
          >
            {route.congestionRisk}
          </div>
        </div>
      </div>

      {route.savings && (
        <div className="mt-3 pt-3 border-t border-[#888] text-sm text-green-600">
          Save ${route.savings} compared to direct route
        </div>
      )}
    </div>
  )
}
