import { cn } from '@/lib/utils'

/**
 * ThinkingIndicator — animated dots shown while the AI is processing.
 * Arabic label: "جاري التحليل..."
 */
export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-3 px-4">
      <div className="flex items-center gap-1">
        <span
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-sm text-muted-foreground">جاري التحليل...</span>
    </div>
  )
}
