import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        dark: 'var(--bg-dark)',
        panel: 'var(--bg-panel)',
        'text-main': 'var(--text-main)',
        'text-inv': 'var(--text-inv)',
        'text-muted': 'var(--text-muted)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['Manrope', 'Space Grotesk', 'sans-serif'],
        pixel: ['Chakra Petch', 'Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
