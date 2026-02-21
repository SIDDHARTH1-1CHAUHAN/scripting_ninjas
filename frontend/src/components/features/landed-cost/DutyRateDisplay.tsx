interface DutyRateDisplayProps {
  hsCode: string
  baseDutyRate: number
  section301Rate: number
  description?: string
}

export function DutyRateDisplay({ hsCode, baseDutyRate, section301Rate, description }: DutyRateDisplayProps) {
  return (
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
        {section301Rate > 0 && (
          <div className="flex justify-between items-center text-warning">
            <span className="text-sm">Section 301</span>
            <span className="font-pixel">+{section301Rate}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
