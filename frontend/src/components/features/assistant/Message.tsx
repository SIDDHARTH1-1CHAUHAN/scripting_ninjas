interface MessageProps {
  type: 'ai' | 'user'
  content: string
  suggestions?: string[]
  onSuggestionClick?: (s: string) => void
}

export function Message({ type, content, suggestions, onSuggestionClick }: MessageProps) {
  return (
    <div className={`max-w-[80%] p-4 text-sm leading-relaxed animate-slide-in ${
      type === 'ai'
        ? 'self-start bg-dark text-text-inv border border-dark/70 shadow-[var(--surface-shadow)]'
        : 'self-end border border-dark bg-canvas/85 shadow-[var(--surface-shadow)]'
    }`}>
      {type === 'ai' && <div className="label text-text-inv/70 mb-2">SYSTEM_CORE</div>}
      <div className="whitespace-pre-wrap">{content}</div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => onSuggestionClick?.(s)}
              className="border border-text-inv/35 px-3 py-1.5 text-xs font-pixel text-text-inv/80 hover:text-text-inv hover:border-text-inv transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
