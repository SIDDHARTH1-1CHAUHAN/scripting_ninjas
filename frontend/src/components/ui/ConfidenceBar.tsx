interface Props {
  label?: string
  value: number
}

export function ConfidenceBar({ label, value }: Props) {
  return (
    <div className="mb-2">
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      {!label && (
        <div className="text-xs mb-1 text-right">
          <span>{value}%</span>
        </div>
      )}
      <div className="h-1 bg-[#333]">
        <div className="h-full bg-text-inv" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
