import { create } from 'zustand'

export interface AuthUser {
  sub: string
  firstName: string
  lastName: string
  role: string
  companyId: string
  storeId?: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  setSession: (user: AuthUser, token: string) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,

  setSession: (user, token) => set({ user, accessToken: token }),

  clearSession: () => set({ user: null, accessToken: null }),
}))
