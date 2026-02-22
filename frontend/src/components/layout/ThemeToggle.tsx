'use client'
import { useThemeStore } from '@/store/useThemeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="focus-ring border border-dark px-3 py-2 text-xs font-pixel hover:bg-dark hover:text-text-inv transition-all flex items-center gap-2 bg-panel/70 shadow-[var(--surface-shadow)] rounded-full"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className={`inline-flex items-center justify-center w-4 h-4 border border-dark rounded-full ${isDark ? 'bg-canvas text-dark' : 'bg-dark text-canvas'}`}
      />
      {isDark ? 'LIGHT_MODE' : 'DARK_MODE'}
    </button>
  )
}
