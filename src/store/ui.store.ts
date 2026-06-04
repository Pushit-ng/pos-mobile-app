import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface UIState {
  toasts: Toast[]
  pushToast: (message: string, type?: Toast['type'], duration?: number) => void
  dismissToast: (id: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  toasts: [],

  pushToast: (message, type = 'info', duration = 3000) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }))
    // Auto-dismiss after duration
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
