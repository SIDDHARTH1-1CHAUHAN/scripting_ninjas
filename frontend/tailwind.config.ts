import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#C8C8C8',
        dark: '#080808',
        panel: '#D1D1D1',
        'text-main': '#000000',
        'text-inv': '#E8E8E8',
        'text-muted': '#888888',
        warning: '#FF4141',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        pixel: ['Silkscreen', 'monospace'],
      },
      borderRadius: {
        none: '0px',
      },
    },
  },
  plugins: [],
}

export default config
