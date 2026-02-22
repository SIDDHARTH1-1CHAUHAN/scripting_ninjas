'use client'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()

  return (
    <ErrorBoundary>
      <AuthGuard>
        {children}
        <ToastContainer />
      </AuthGuard>
    </ErrorBoundary>
  )
}
