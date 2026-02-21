interface Props {
  label: string
  value: number
}

export function ConfidenceBar({ label, value }: Props) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 bg-[#333]">
        <div className="h-full bg-text-inv" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
