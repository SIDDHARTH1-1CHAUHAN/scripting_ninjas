interface SanctionsAlertProps {
  entity: string
  status: 'clear' | 'blocked' | 'warning'
  details?: string
}

export function SanctionsAlert({ entity, status, details }: SanctionsAlertProps) {
  const statusConfig = {
    clear: {
      title: 'No Sanctions Found',
      color: 'border-green-500 bg-green-500/5',
      icon: '✓',
    },
    blocked: {
      title: 'SANCTIONED ENTITY',
      color: 'border-warning bg-warning/10',
      icon: '⚠',
    },
    warning: {
      title: 'Review Required',
      color: 'border-yellow-500 bg-yellow-500/10',
      icon: '!',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`border-2 ${config.color} p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <div className="font-pixel text-sm mb-1">{config.title}</div>
          <div className="text-sm mb-2">Entity: <span className="font-medium">{entity}</span></div>
          {details && <div className="text-xs opacity-80">{details}</div>}
        </div>
      </div>
    </div>
  )
}
