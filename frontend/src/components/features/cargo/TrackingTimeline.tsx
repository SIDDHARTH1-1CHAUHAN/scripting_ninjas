interface TimelineEvent {
  status: string
  location: string
  timestamp: string
  completed: boolean
  current?: boolean
}

export function TrackingTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {events.map((event, i) => (
        <div key={i} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={`w-4 h-4 border-2 ${
                event.completed ? 'bg-dark border-dark' : event.current ? 'border-dark animate-pulse' : 'border-[#888]'
              }`}
            />
            {i < events.length - 1 && (
              <div className={`w-0.5 flex-1 ${event.completed ? 'bg-dark' : 'bg-[#888]'}`} />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="font-pixel text-sm">{event.status.replace(/_/g, ' ')}</div>
            <div className="text-xs opacity-60">{event.location}</div>
            <div className="text-xs opacity-40 mt-1">{new Date(event.timestamp).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
