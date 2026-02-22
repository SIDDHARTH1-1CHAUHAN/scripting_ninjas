import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/lib/api'

interface AuthStore {
  token: string | null
  user: AuthUser | null
  hasHydrated: boolean
  setSession: (token: string, user: AuthUser) => void
  logout: () => void
  setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'tradeopt-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

