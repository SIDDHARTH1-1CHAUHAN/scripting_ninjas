import { ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
}

export function ResultCard({ label, children }: Props) {
  return (
    <div className="border border-[#333] p-5">
      <div className="label text-[#888]">{label}</div>
      {children}
    </div>
  )
}
