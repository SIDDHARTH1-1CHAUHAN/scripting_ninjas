interface Props {
  children: React.ReactNode
  variant?: 'light' | 'dark'
}

export function Tag({ children, variant = 'light' }: Props) {
  return (
    <span className={`mr-1 inline-flex rounded-full border px-3 py-1.5 text-[11px] tracking-[0.05em] ${
      variant === 'dark'
        ? 'border-dark/45 bg-dark/25 text-text-main'
        : 'border-dark/40 bg-panel/65 text-text-main'
    }`}>
      {children}
    </span>
  )
}
