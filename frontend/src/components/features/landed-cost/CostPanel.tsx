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
    <div className="space-y-4">
      {hsCode && baseDutyRate !== undefined && (
        <div className="border border-dark p-4 space-y-3">
          <div className="label">DUTY RATES</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs opacity-60">HS CODE</div>
              <div className="font-pixel text-lg">{hsCode}</div>
            </div>
            {description && (
              <div className="text-xs opacity-80">{description}</div>
            )}
            <div className="flex justify-between items-center border-t border-dark pt-2">
              <span className="text-sm">Base Duty</span>
              <span className="font-pixel">{baseDutyRate}%</span>
            </div>
            {section301Rate !== undefined && section301Rate > 0 && (
              <div className="flex justify-between items-center text-warning">
                <span className="text-sm">Section 301</span>
                <span className="font-pixel">+{section301Rate}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {recentCalculations.length > 0 && (
        <div className="border border-dark p-4">
          <div className="label mb-3">RECENT</div>
          <div className="space-y-2">
            {recentCalculations.map((calc, idx) => (
              <div key={idx} className="text-xs border-b border-dark/30 pb-2 last:border-0">
                <div className="font-pixel">{calc.hsCode}</div>
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
        <div className="border border-dark p-4 text-center text-sm opacity-60">
          <div className="font-pixel mb-2">NO_DATA</div>
          <p>Enter product details to calculate landed cost</p>
        </div>
      )}
    </div>
  )
}
