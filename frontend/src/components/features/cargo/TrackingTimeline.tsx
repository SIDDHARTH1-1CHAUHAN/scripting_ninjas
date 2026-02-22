interface TimelineEvent {
  status: string
  location: string
  timestamp: string
  completed: boolean
  current?: boolean
  estimated?: boolean
}

export function TrackingTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.map((event, i) => (
        <div key={i} className="flex gap-3 pb-5 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={`w-4 h-4 border-2 ${
                event.completed
                  ? 'bg-green-500 border-green-500'
                  : event.current
                    ? 'border-yellow-400 animate-pulse'
                    : 'border-[#777]'
              }`}
            />
            {i < events.length - 1 && (
              <div className={`w-0.5 flex-1 ${event.completed ? 'bg-green-500/80' : 'bg-[#555]'}`} />
            )}
          </div>

          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2">
              <div className="font-pixel text-sm">{event.status.replace(/_/g, ' ')}</div>
              {event.current && (
                <span className="text-[10px] border border-yellow-500 text-yellow-400 px-1 py-0.5">
                  CURRENT
                </span>
              )}
              {event.estimated && !event.completed && (
                <span className="text-[10px] border border-[#666] text-[#999] px-1 py-0.5">
                  ETA
                </span>
              )}
            </div>
            <div className="text-xs opacity-70">{event.location}</div>
            <div className="text-xs opacity-50 mt-1">{new Date(event.timestamp).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
