'use client'
import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface Props {
  children: ReactNode
  rightPanel?: ReactNode
}

export function AppLayout({ children, rightPanel }: Props) {
  return (
    <div className="h-screen grid grid-cols-[260px_1fr_400px] border-t-2 border-dark">
      <Sidebar />
      <main className="flex flex-col overflow-hidden bg-panel">
        {children}
      </main>
      <aside className="bg-dark text-text-inv p-6 flex flex-col gap-8 overflow-y-auto">
        {rightPanel}
      </aside>
    </div>
  )
}
