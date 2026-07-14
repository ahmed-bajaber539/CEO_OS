import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  message: string
  variant?: 'destructive' | 'default'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions | null
  confirm: (opts: ConfirmOptions) => void
  close: () => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  options: null,

  confirm: (opts) => set({ isOpen: true, options: opts }),

  close: () => {
    set((s) => {
      s.options?.onCancel?.()
      return { isOpen: false, options: null }
    })
  },
}))

/**
 * Imperative confirm helper — returns a Promise that resolves on confirm, rejects on cancel.
 * Usage: const ok = await confirmAction({ title: '...', message: '...' })
 */
export function confirmAction(opts: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().confirm({
      ...opts,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}
