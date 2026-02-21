interface Props {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 border-2 border-dashed border-[#555] flex items-center justify-center mb-4">
        <span className="text-3xl opacity-30">∅</span>
      </div>
      <div className="font-pixel text-lg mb-2">{title}</div>
      <p className="text-sm opacity-60 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 bg-dark text-canvas px-6 py-3 font-pixel text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
