'use client'
import { useThemeStore } from '@/store/useThemeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="border border-dark px-3 py-2 text-xs font-pixel hover:bg-dark hover:text-canvas transition-all"
    >
      {theme === 'dark' ? 'LIGHT_MODE' : 'DARK_MODE'}
    </button>
  )
}
