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
  handleConfirm: () => void
  handleCancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,

  confirm: (opts) => set({ isOpen: true, options: opts }),

  handleConfirm: () => {
    const { options } = get()
    if (!options) return
    set({ isOpen: false, options: null })
    options.onConfirm()
  },

  handleCancel: () => {
    const { options } = get()
    if (!options) return
    options.onCancel?.()
    set({ isOpen: false, options: null })
  },
}))

export function confirmAction(
  opts: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>
): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().confirm({
      ...opts,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}
