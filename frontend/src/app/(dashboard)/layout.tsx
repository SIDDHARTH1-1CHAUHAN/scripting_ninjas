'use client'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ToastContainer } from '@/components/ui/Toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useKeyboardShortcuts()

  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}
