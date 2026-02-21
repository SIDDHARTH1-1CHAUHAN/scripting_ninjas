interface Props {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-4 border-t border-[#333]">
      <span className="text-xs text-[#666] mr-2">QUICK_ACTIONS:</span>
      {suggestions.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="border border-[#444] px-3 py-1.5 text-xs font-pixel text-[#AAA] hover:text-text-inv hover:border-text-inv transition-all"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
