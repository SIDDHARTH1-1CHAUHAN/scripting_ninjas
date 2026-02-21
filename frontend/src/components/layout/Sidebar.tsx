'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'HS CLASSIFIER', path: '/classify' },
  { label: 'AI ASSISTANT', path: '/assistant' },
  { label: 'LANDED COST', path: '/landed-cost' },
  { label: 'COMPLIANCE', path: '/compliance' },
  { label: 'ROUTE OPTIMIZER', path: '/route' },
  { label: 'CARGO LOCATOR', path: '/cargo' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="border-r-2 border-dark p-6 flex flex-col justify-between bg-canvas">
      <div>
        {/* Logo */}
        <div className="mb-12">
          <div className="w-12 h-12 border-2 border-dark rounded-full flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <line x1="2" y1="22" x2="22" y2="2" />
              <polyline points="12 2 22 2 22 12" />
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="label">SYSTEM</div>
          <div className="font-bold text-xl">TRADE<br/>OPTIMIZER</div>
        </div>

        {/* Nav */}
        <nav>
          <div className="label mb-2">MODULES</div>
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`block py-3 border-b border-dark hover:pl-2 transition-all ${
                pathname === item.path ? 'font-pixel text-lg' : ''
              }`}
            >
              <span>{item.label}</span>
              <span className="float-right text-xs">{pathname === item.path ? '←' : '↓'}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div>
        <div className="label">USER</div>
        <div className="text-sm">DEMO USER<br/>GLOBAL LOGISTICS</div>
        <div className="mt-6 text-xs opacity-60">V.2.4.0</div>
      </div>
    </aside>
  )
}
