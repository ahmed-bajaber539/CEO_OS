import { Check, Circle } from "lucide-react"

interface TaskRowProps {
  done: boolean
  text: string
  className?: string
}

export function TaskRow({ done, text, className }: TaskRowProps) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors ${className ?? ""}`}>
      {done ? (
        <Check className="size-4 text-success shrink-0" />
      ) : (
        <Circle className="size-4 text-muted-foreground shrink-0" />
      )}
      <span className={done ? "line-through text-muted-foreground" : ""}>
        {text}
      </span>
    </div>
  )
}
