'use client'
import { ReactNode } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'

interface Props {
  children: ReactNode
  rightPanel?: ReactNode
}

export function AppLayout({ children, rightPanel }: Props) {
  const hasRightPanel = Boolean(rightPanel)

  return (
    <div
      className={`min-h-screen lg:h-screen grid grid-cols-1 border-t-2 border-dark ${
        hasRightPanel ? 'lg:grid-cols-[260px_1fr_380px]' : 'lg:grid-cols-[260px_1fr]'
      }`}
    >
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="lg:hidden border-b-2 border-dark bg-canvas/90 px-4 py-3 backdrop-blur-md rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="font-pixel text-sm">TRADEOPTIMIZE</div>
          <Link href="/assistant" className="text-xs underline">ASSISTANT</Link>
        </div>
      </div>
      <main className="flex flex-col overflow-hidden bg-panel/80 backdrop-blur-sm">
        {children}
      </main>
      {hasRightPanel && (
        <aside className="dashboard-scroll hidden lg:flex bg-dark/95 text-text-inv p-6 flex-col gap-8 overflow-y-auto border-l-2 border-dark shadow-[var(--surface-shadow)] rounded-l-3xl">
          {rightPanel}
        </aside>
      )}
    </div>
  )
}
