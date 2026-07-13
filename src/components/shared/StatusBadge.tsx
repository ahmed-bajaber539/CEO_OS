import { Badge } from "@/components/ui/badge"
import { STATUS } from "@/lib/constants"

type StatusType = keyof typeof STATUS

interface StatusBadgeProps {
  type: StatusType
  status: string
  className?: string
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  const config = (STATUS[type] as Record<string, { label: string; variant?: string }>)[status]
  if (!config) return <Badge className={className}>{status}</Badge>
  return (
    <Badge variant={(config.variant as "default" | "secondary" | "outline" | "destructive") ?? "secondary"} className={className}>
      {config.label}
    </Badge>
  )
}
