'use client'
import { useThemeStore } from '@/store/useThemeStore'
import { useEffect } from 'react'
import { Providers } from './providers'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <title>TradeOptimize AI</title>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
