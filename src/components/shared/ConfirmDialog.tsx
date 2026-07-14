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
  const isOpen = useConfirmStore((s) => s.isOpen)
  const title = useConfirmStore((s) => s.title)
  const message = useConfirmStore((s) => s.message)
  const variant = useConfirmStore((s) => s.variant)
  const confirmLabel = useConfirmStore((s) => s.confirmLabel)
  const cancelLabel = useConfirmStore((s) => s.cancelLabel)
  const handleConfirm = useConfirmStore((s) => s._handleConfirm)
  const handleCancel = useConfirmStore((s) => s._handleCancel)

  const isDestructive = variant === 'destructive'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
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
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-right">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            {cancelLabel ?? 'إلغاء'}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {confirmLabel ?? (isDestructive ? 'نعم، احذف' : 'نعم، متأكد')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
