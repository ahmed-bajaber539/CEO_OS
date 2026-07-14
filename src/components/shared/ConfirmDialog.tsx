import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useConfirmStore } from '@/stores/confirm'

export function ConfirmDialog() {
  const { isOpen, options, close } = useConfirmStore()

  if (!options) return null

  const isDestructive = options.variant === 'destructive'

  function handleConfirm() {
    options!.onConfirm()
    useConfirmStore.setState({ isOpen: false, options: null })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-full ${
                isDestructive
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
            </div>
            <DialogTitle>{options.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-right">
            {options.message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={close}>
            {options.cancelLabel ?? 'إلغاء'}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {options.confirmLabel ?? (isDestructive ? 'نعم، احذف' : 'نعم، متأكد')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
