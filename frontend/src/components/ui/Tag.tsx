interface Props {
  children: React.ReactNode
  variant?: 'light' | 'dark'
}

export function Tag({ children, variant = 'light' }: Props) {
  return (
    <span className={`border px-2 py-1 text-xs uppercase mr-1 ${
      variant === 'dark' ? 'border-[#555] text-[#AAA]' : 'border-dark'
    }`}>
      {children}
    </span>
  )
}
