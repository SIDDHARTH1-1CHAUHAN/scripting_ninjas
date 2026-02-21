interface Props {
  code: string
  size?: 'sm' | 'md' | 'lg'
  description?: string
}

export function HSCodeDisplay({ code, size = 'lg', description }: Props) {
  const sizes = { sm: 'text-xl', md: 'text-3xl', lg: 'text-6xl' }
  return (
    <div>
      <div className={`font-pixel ${sizes[size]}`}>{code}</div>
      {description && <div className="text-sm opacity-80 mt-2">{description}</div>}
    </div>
  )
}
