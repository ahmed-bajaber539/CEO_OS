import { create } from 'zustand'

export interface ConfirmDialogOptions {
  title: string
  message: string
  variant?: 'destructive' | 'default'
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmStore {
  isOpen: boolean
  title: string
  message: string
  variant: 'destructive' | 'default'
  confirmLabel?: string
  cancelLabel?: string
  _resolve: ((ok: boolean) => void) | null
  confirm: (opts: ConfirmDialogOptions) => Promise<boolean>
  _handleConfirm: () => void
  _handleCancel: () => void
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  title: '',
  message: '',
  variant: 'default',
  confirmLabel: undefined,
  cancelLabel: undefined,
  _resolve: null,

  confirm: (opts) =>
    new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: opts.title,
        message: opts.message,
        variant: opts.variant ?? 'default',
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel,
        _resolve: resolve,
      })
    }),

  _handleConfirm: () => {
    const { _resolve } = get()
    set({ isOpen: false, _resolve: null })
    _resolve?.(true)
  },

  _handleCancel: () => {
    const { _resolve } = get()
    set({ isOpen: false, _resolve: null })
    _resolve?.(false)
  },
}))
