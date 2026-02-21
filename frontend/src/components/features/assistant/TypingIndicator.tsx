export function TypingIndicator() {
  return (
    <div className="flex gap-1 p-3 bg-dark w-fit self-start border border-[#333]">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-text-inv"
          style={{
            animation: 'bounce 1s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}
