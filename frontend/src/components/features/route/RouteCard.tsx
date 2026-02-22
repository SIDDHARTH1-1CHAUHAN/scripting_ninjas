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
      className={`border p-4 cursor-pointer transition-all shadow-[var(--surface-shadow)] ${
        selected
          ? 'border-dark bg-dark/10 ring-2 ring-[var(--focus-ring)]'
          : 'border-dark/40 bg-panel/70 hover:border-dark hover:bg-panel'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-pixel text-lg tracking-wide">{route.name}</div>
          <div className="text-sm opacity-70">{route.carrier}</div>
        </div>
        {route.recommended && (
          <span className="bg-dark text-canvas px-2 py-1 text-xs font-pixel border border-dark/70">RECOMMENDED</span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="label">TRANSIT</div>
          <div className="font-pixel">{route.transitDays} DAYS</div>
        </div>
        <div>
          <div className="label">COST</div>
          <div className="font-pixel">${route.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="label">CO2</div>
          <div className="font-pixel">{route.emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} KG</div>
        </div>
        <div>
          <div className="label">CONGESTION</div>
          <div
            className={`font-pixel ${
              route.congestionRisk === 'HIGH'
                ? 'text-warning'
                : route.congestionRisk === 'MEDIUM'
                  ? 'text-amber-500'
                  : 'text-emerald-600'
            }`}
          >
            {route.congestionRisk}
          </div>
        </div>
      </div>

      {route.savings && (
        <div className="mt-3 pt-3 border-t border-dark/30 text-sm text-emerald-700 dark:text-emerald-300">
          Save ${route.savings.toLocaleString(undefined, { maximumFractionDigits: 2 })} compared to direct route
        </div>
      )}
    </div>
  )
}
