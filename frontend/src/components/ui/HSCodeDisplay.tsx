interface Props {
  code: string
  size?: 'sm' | 'md' | 'lg'
}

export function HSCodeDisplay({ code, size = 'lg' }: Props) {
  const sizes = { sm: 'text-xl', md: 'text-3xl', lg: 'text-6xl' }
  return <div className={`font-pixel ${sizes[size]}`}>{code}</div>
}
