'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/store/useAuthStore'

interface Props {
  children: ReactNode
}

export function AuthGuard({ children }: Props) {
  const bypassAuth =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const setHydrated = useAuthStore((state) => state.setHydrated)
  const [bootstrapReady, setBootstrapReady] = useState(false)
  const [persistedToken, setPersistedToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('tradeopt-auth')
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { token?: string } }
        const stored = parsed?.state?.token
        if (typeof stored === 'string' && stored.trim()) {
          setPersistedToken(stored)
        }
      }
    } catch {
      // Ignore malformed auth storage and continue with store state.
    } finally {
      setBootstrapReady(true)
    }
  }, [])

  useEffect(() => {
    // Persist middleware may skip rehydrate callback on first client render.
    if (!hasHydrated) {
      setHydrated(true)
    }
  }, [hasHydrated, setHydrated])

  const effectiveToken = token || persistedToken

  useEffect(() => {
    if (bypassAuth) {
      return
    }
    if (bootstrapReady && !effectiveToken) {
      router.replace('/login')
    }
  }, [bootstrapReady, bypassAuth, effectiveToken, router])

  if (bypassAuth) {
    return <>{children}</>
  }

  if (!bootstrapReady) {
    return <div className="p-8 text-sm">Loading session...</div>
  }

  if (!effectiveToken) {
    return <div className="p-8 text-sm">Redirecting to login...</div>
  }

  return <>{children}</>
}
