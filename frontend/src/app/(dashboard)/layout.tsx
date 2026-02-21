'use client'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()

  return (
    <ErrorBoundary>
      {children}
      <ToastContainer />
    </ErrorBoundary>
  )
}
