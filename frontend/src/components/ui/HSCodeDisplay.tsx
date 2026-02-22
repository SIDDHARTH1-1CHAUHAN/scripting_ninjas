interface Props {
  code: string
  size?: 'sm' | 'md' | 'lg'
  description?: string
}

function formatHsCode(code: string): string {
  const digits = code.replace(/\D/g, '')
  let formatted = code

  if (digits.length === 10) {
    formatted = `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}.${digits.slice(8, 10)}`
  } else if (digits.length === 8) {
    formatted = `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`
  } else if (digits.length === 6) {
    formatted = `${digits.slice(0, 4)}.${digits.slice(4, 6)}`
  } else {
    formatted = code
  }

  // Keep display compact for fixed-width result panels.
  return formatted.length > 12 ? digits : formatted
}

export function HSCodeDisplay({ code, size = 'lg', description }: Props) {
  const displayCode = formatHsCode(code)
  const length = displayCode.length
  const sizes = {
    sm: 'text-[1.55rem]',
    md: 'text-[1.9rem]',
    lg: length > 12 ? 'text-[1.8rem]' : length >= 11 ? 'text-[2.05rem]' : 'text-[2.4rem]',
  }

  return (
    <div className="classify-result-hero p-4">
      <div className="label text-text-muted">HS Code</div>
      <div className="classify-hs-code-box mt-2 px-3 py-3">
        <div
          className={`overflow-hidden text-ellipsis whitespace-nowrap font-mono font-semibold tabular-nums ${sizes[size]} leading-none tracking-[0.015em] text-text-inv`}
          title={displayCode}
        >
          {displayCode}
        </div>
      </div>
      {description && <div className="mt-2 text-sm leading-relaxed text-text-muted">{description}</div>}
    </div>
  )
}
