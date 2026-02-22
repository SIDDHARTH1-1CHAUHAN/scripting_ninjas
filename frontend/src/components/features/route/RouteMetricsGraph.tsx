interface RouteMetric {
  id: string
  name: string
  cost: number
  transitDays: number
  emissions: number
  recommended: boolean
}

interface RouteMetricsGraphProps {
  routes: RouteMetric[]
  selectedRouteId: string | null
  onSelect: (routeId: string) => void
}

interface MetricBarProps {
  label: string
  valueLabel: string
  value: number
  max: number
  colorClass: string
}

function MetricBar({ label, valueLabel, value, max, colorClass }: MetricBarProps) {
  const widthPct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 6

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] opacity-80">
        <span>{label}</span>
        <span className="font-pixel">{valueLabel}</span>
      </div>
      <div className="h-2 border border-dark/40 bg-canvas/70 overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  )
}

export function RouteMetricsGraph({ routes, selectedRouteId, onSelect }: RouteMetricsGraphProps) {
  if (routes.length === 0) return null

  const maxCost = Math.max(...routes.map((route) => route.cost))
  const maxTransit = Math.max(...routes.map((route) => route.transitDays))
  const maxEmissions = Math.max(...routes.map((route) => route.emissions))

  return (
    <section className="border border-dark bg-panel/75 p-3 lg:p-4 shadow-[var(--surface-shadow)]">
      <div className="flex items-center justify-between mb-3">
        <div className="label">ROUTE COMPARISON GRAPH</div>
        <div className="text-[10px] opacity-70">Click a route row to focus map</div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {routes.map((route) => {
          const selected = selectedRouteId === route.id
          return (
            <button
              key={route.id}
              type="button"
              onClick={() => onSelect(route.id)}
              className={`text-left border p-3 transition-all ${
                selected
                  ? 'border-dark bg-dark/8 ring-2 ring-[var(--focus-ring)]'
                  : 'border-dark/40 bg-canvas/50 hover:border-dark hover:bg-canvas/75'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-pixel text-xs">{route.name}</div>
                {route.recommended && (
                  <span className="text-[10px] px-2 py-1 bg-dark text-canvas font-pixel">
                    RECOMMENDED
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <MetricBar
                  label="COST"
                  valueLabel={`$${route.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  value={route.cost}
                  max={maxCost}
                  colorClass="bg-sky-500"
                />
                <MetricBar
                  label="TRANSIT"
                  valueLabel={`${route.transitDays} DAYS`}
                  value={route.transitDays}
                  max={maxTransit}
                  colorClass="bg-amber-500"
                />
                <MetricBar
                  label="CO2"
                  valueLabel={`${route.emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} KG`}
                  value={route.emissions}
                  max={maxEmissions}
                  colorClass="bg-emerald-500"
                />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
