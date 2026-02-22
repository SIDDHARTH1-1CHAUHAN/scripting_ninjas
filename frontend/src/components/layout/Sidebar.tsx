'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '@/store/useAuthStore'

const navItems = [
  { label: 'HS CLASSIFIER', path: '/classify' },
  { label: 'AI ASSISTANT', path: '/assistant' },
  { label: 'LANDED COST', path: '/landed-cost' },
  { label: 'COMPLIANCE', path: '/compliance' },
  { label: 'ROUTE OPTIMIZER', path: '/route' },
  { label: 'CARGO LOCATOR', path: '/cargo' },
  { label: 'FX SETTLEMENT OPTIMIZER', path: '/forex' },
  { label: 'ANALYTICS', path: '/analytics' },
  { label: 'BUSINESS MODEL', path: '/business' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const onLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <aside className="dashboard-scroll border-r-2 border-dark p-6 flex flex-col justify-between bg-canvas/80 backdrop-blur-md shadow-[var(--surface-shadow)] rounded-r-3xl overflow-y-auto">
      <div>
        {/* Logo */}
        <div className="mb-12">
          <div className="w-12 h-12 border-2 border-dark rounded-2xl flex items-center justify-center mb-4 bg-panel/60 shadow-[var(--surface-shadow)]">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6"
            >
              <line x1="2" y1="22" x2="22" y2="2" />
              <polyline points="12 2 22 2 22 12" />
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="label">SYSTEM</div>
          <div className="font-bold text-xl tracking-tight">TRADE<br/>OPTIMIZER</div>
        </div>

        {/* Nav */}
        <nav>
          <div className="label mb-2">MODULES</div>
          <div className="space-y-1.5">
          {navItems.map(item => {
            const isActive = isHydrated && pathname === item.path

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`block py-2.5 px-3 rounded-xl border border-dark/35 transition-all ${
                  isActive
                    ? 'module-nav-active text-[0.84rem] bg-dark text-text-inv shadow-[inset_3px_0_0_var(--accent),0_10px_20px_rgba(20,16,41,0.2)]'
                    : 'hover:bg-dark/10 hover:shadow-[var(--surface-shadow)]'
                }`}
              >
                <span>{item.label}</span>
                <span className="float-right text-xs">{isActive ? '←' : '↓'}</span>
              </Link>
            )
          })}
          </div>
        </nav>
      </div>

      <div>
        <div className="label">USER</div>
        <div className="text-sm">
          {user?.name || 'AUTHENTICATED USER'}
          <br />
          {user?.email || 'TRADE TEAM'}
        </div>
        <div className="mt-3 border border-dark/40 rounded-2xl p-3 text-xs bg-panel/50 shadow-[var(--surface-shadow)]">
          <div className="label">PLAN</div>
          <div className="font-pixel">FREE</div>
          <Link href="/business" className="inline-block mt-2 underline text-xs">
            UPGRADE PLAN
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="focus-ring border border-dark px-3 py-2 text-xs font-pixel hover:bg-dark hover:text-text-inv transition-all rounded-full"
          >
            LOGOUT
          </button>
        </div>
        <div className="mt-6 text-xs opacity-60">V.2.4.0</div>
      </div>
    </aside>
  )
}
