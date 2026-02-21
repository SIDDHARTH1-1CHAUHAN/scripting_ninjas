'use client'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useKeyboardShortcuts()

  return <>{children}</>
}
