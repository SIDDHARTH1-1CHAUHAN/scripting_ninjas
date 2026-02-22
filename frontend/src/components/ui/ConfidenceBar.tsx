interface Props {
  label?: string
  value: number
}

export function ConfidenceBar({ label, value }: Props) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

  return (
    <div className="mb-1">
      {label && (
        <div className="mb-1 flex justify-between text-xs">
          <span>{label}</span>
          <span>{Math.round(normalized)}%</span>
        </div>
      )}
      {!label && (
        <div className="mb-1 text-right text-xs text-text-muted">
          <span>{Math.round(normalized)}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full border border-dark/40 bg-dark/35">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8b76e8] to-[#c49c4c] transition-all duration-700 ease-out"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  )
}
