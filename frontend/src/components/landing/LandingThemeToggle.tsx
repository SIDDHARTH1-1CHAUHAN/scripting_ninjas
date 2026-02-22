'use client'

import { useThemeStore } from '@/store/useThemeStore'

export function LandingThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="curve-chip landing-chip px-4 py-2 text-xs font-pixel tracking-[0.07em]"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? 'LIGHT MODE' : 'DARK MODE'}
    </button>
  )
}
