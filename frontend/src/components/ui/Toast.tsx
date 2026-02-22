'use client'
import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface ToastStore {
  toasts: Toast[]
  add: (type: Toast['type'], message: string) => void
  remove: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function ToastContainer() {
  const { toasts, remove } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => remove(toast.id)}
          className={`min-w-[260px] max-w-[360px] px-4 py-3 text-sm cursor-pointer animate-slide-in border shadow-[var(--surface-shadow)] backdrop-blur-md ${
            toast.type === 'error' ? 'bg-warning/95 text-white border-warning' :
            toast.type === 'success' ? 'bg-dark/95 text-text-inv border-dark' :
            toast.type === 'warning' ? 'bg-yellow-500/95 text-black border-yellow-500' :
            'bg-panel/95 border-dark'
          }`}
        >
          <div className="label mb-1">
            {toast.type.toUpperCase()}
          </div>
          <div>{toast.message}</div>
        </div>
      ))}
    </div>
  )
}
