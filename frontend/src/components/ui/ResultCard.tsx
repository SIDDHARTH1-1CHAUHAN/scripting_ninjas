import { ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
}

export function ResultCard({ label, children }: Props) {
  return (
    <div className="border border-dark p-5 bg-panel/70 shadow-[var(--surface-shadow)] backdrop-blur-sm">
      <div className="label">{label}</div>
      {children}
    </div>
  )
}
