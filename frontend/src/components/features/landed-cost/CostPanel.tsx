interface CostPanelProps {
  hsCode?: string
  baseDutyRate?: number
  section301Rate?: number
  description?: string
  recentCalculations?: Array<{
    hsCode: string
    totalCost: number
    date: string
  }>
}

export function CostPanel({
  hsCode,
  baseDutyRate,
  section301Rate,
  description,
  recentCalculations = []
}: CostPanelProps) {
  return (
    <div className="space-y-3">
      {hsCode && baseDutyRate !== undefined && (
        <div className="border border-dark p-4">
          <div className="label mb-3">DUTY SNAPSHOT</div>
          <div className="space-y-3">
            <div className="bg-canvas/60 border border-dark/30 px-3 py-2">
              <div className="text-[11px] opacity-60">HS CODE</div>
              <div className="font-pixel text-base tracking-wide">{hsCode}</div>
            </div>
            {description && (
              <p className="text-xs leading-5 opacity-80">{description}</p>
            )}
            <div className="space-y-2 border-t border-dark/40 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">Base Duty</span>
                <span className="font-pixel">{baseDutyRate.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">Section 301</span>
                <span className={`font-pixel ${section301Rate && section301Rate > 0 ? 'text-warning' : ''}`}>
                  {section301Rate !== undefined && section301Rate > 0 ? `+${section301Rate.toFixed(2)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {recentCalculations.length > 0 && (
        <div className="border border-dark p-4">
          <div className="label mb-3">RECENT</div>
          <div className="space-y-2">
            {recentCalculations.map((calc, idx) => (
              <div key={idx} className="text-xs border-b border-dark/30 pb-2 last:border-0">
                <div className="font-pixel tracking-wide">{calc.hsCode}</div>
                <div className="flex justify-between opacity-60 mt-1">
                  <span>${calc.totalCost.toFixed(2)}</span>
                  <span>{calc.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hsCode && recentCalculations.length === 0 && (
        <div className="border border-dark p-4 text-center text-sm opacity-70">
          <div className="font-pixel mb-2">NO DATA</div>
          <p>Run a calculation to populate duty details.</p>
        </div>
      )}
    </div>
  )
}
