interface RiskIndicatorProps {
  label: string
  status: 'clear' | 'warning' | 'danger' | 'pending'
  details?: string
}

export function RiskIndicator({ label, status, details }: RiskIndicatorProps) {
  const statusConfig = {
    clear: { icon: '✓', color: 'text-green-500', bg: 'bg-green-500/10' },
    warning: { icon: '!', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    danger: { icon: '✕', color: 'text-warning', bg: 'bg-warning/10' },
    pending: { icon: '○', color: 'text-[#888]', bg: 'bg-[#333]/10' },
  }

  const config = statusConfig[status]

  return (
    <div className={`flex items-start gap-3 p-3 ${config.bg}`}>
      <span className={`${config.color} font-pixel`}>{config.icon}</span>
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        {details && <div className="text-xs opacity-60 mt-1">{details}</div>}
      </div>
    </div>
  )
}
