import { Button } from '@/components/ui/button'

interface SuggestedActionsProps {
  actions: string[]
  onSelect: (action: string) => void
  disabled?: boolean
}

/**
 * SuggestedActions — quick action chips shown after assistant response.
 * Each chip is a suggested follow-up message the user can click.
 */
export function SuggestedActions({ actions, onSelect, disabled }: SuggestedActionsProps) {
  if (!actions.length) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {actions.map((action) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="text-xs h-8 rounded-full border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-colors"
        >
          {action}
        </Button>
      ))}
    </div>
  )
}
