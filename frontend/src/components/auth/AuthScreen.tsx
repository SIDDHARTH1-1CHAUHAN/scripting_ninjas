'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { GoogleSignInButton } from './GoogleSignInButton'
import { demoSignIn, googleSignIn } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'

interface Props {
  mode: 'login' | 'signup'
}

export function AuthScreen({ mode }: Props) {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const onCredential = useCallback(
    async (idToken: string) => {
      try {
        setLoading(true)
        setError('')
        const result = await googleSignIn(idToken)
        setSession(result.access_token, result.user)
        router.replace('/classify')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google authentication failed'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [router, setSession],
  )

  const onDemoLogin = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const result = await demoSignIn('Demo Import Manager', 'demo@tradeoptimize.local')
      setSession(result.access_token, result.user)
      router.replace('/classify')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo authentication failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [router, setSession])

  const isLogin = mode === 'login'

  return (
    <main className="min-h-screen bg-canvas text-text-main flex items-center justify-center p-6">
      <div className="w-full max-w-[520px] border-2 border-dark bg-panel p-8">
        <div className="label mb-2">TRADEOPTIMIZE AI</div>
        <h1 className="text-4xl font-bold leading-none mb-2">
          {isLogin ? 'LOGIN' : 'SIGN UP'}
          <br />
          <span className="font-pixel">{isLogin ? 'ACCESS_PORTAL' : 'CREATE_ACCOUNT'}</span>
        </h1>
        <p className="text-sm opacity-80 mb-6">
          Use Google authentication to access all modules and keep your workspace synced.
        </p>

        <div className="space-y-4">
          <GoogleSignInButton onCredential={onCredential} text={isLogin ? 'signin_with' : 'signup_with'} />
          <button
            type="button"
            onClick={onDemoLogin}
            disabled={loading}
            className="w-full border border-dark px-4 py-3 text-sm hover:bg-dark hover:text-canvas transition-colors disabled:opacity-60"
          >
            Continue in Demo Mode
          </button>
          {loading && <div className="text-xs opacity-70">Verifying account...</div>}
          {error && <div className="text-xs text-warning">{error}</div>}
        </div>

        <div className="mt-8 text-xs">
          {isLogin ? (
            <>
              New user? <Link href="/signup" className="underline">Create account</Link>
            </>
          ) : (
            <>
              Already have access? <Link href="/login" className="underline">Login</Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
