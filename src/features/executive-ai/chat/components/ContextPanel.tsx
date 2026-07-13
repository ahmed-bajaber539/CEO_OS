import { Target, FolderKanban, CalendarCheck, Lightbulb, Scale, Activity } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ContextPanelProps {
  /** Simple dashboard stats to display */
  stats?: {
    activeProjects: number
    todayTasksDone: number
    todayTasksTotal: number
    annualGoals: number
    totalDecisions: number
  }
  intent?: { capability: string; confidence: number } | null
}

/**
 * ContextPanel — right panel showing live system awareness.
 * Displays current system state (projects, goals, tasks, etc.)
 * and the detected intent for the current message.
 */
export function ContextPanel({ stats, intent }: ContextPanelProps) {
  return (
    <div className="flex flex-col h-full border-l bg-muted/20 w-64 flex-shrink-0">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">حالة النظام</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Stats */}
          {stats ? (
            <>
              <StatItem
                icon={<FolderKanban className="h-4 w-4" />}
                label="المشاريع النشطة"
                value={stats.activeProjects}
              />
              <StatItem
                icon={<CalendarCheck className="h-4 w-4" />}
                label="مهام اليوم"
                value={`${stats.todayTasksDone}/${stats.todayTasksTotal}`}
              />
              <StatItem
                icon={<Target className="h-4 w-4" />}
                label="الأهداف السنوية"
                value={stats.annualGoals}
              />
              <StatItem
                icon={<Scale className="h-4 w-4" />}
                label="القرارات"
                value={stats.totalDecisions}
              />
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              جاري تحميل بيانات النظام...
            </p>
          )}

          <Separator />

          {/* Intent */}
          {intent ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">القدرة المستخدمة</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    intent.confidence > 0.6
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  )}
                >
                  {CAPABILITY_LABELS[intent.capability] ?? intent.capability}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(intent.confidence * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              اكتب رسالة لتحليل القصد...
            </p>
          )}

          <Separator />

          {/* Quick Info */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">حول المساعد</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• يدعم التخطيط والمراجعة والتحليل</p>
              <p>• يمكنه إنشاء وتعديل المشاريع والمهام</p>
              <p>• يفهم سياق النظام بالكامل</p>
              <p>• جميع العمليات التخريبية تتطلب تأكيداً</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

const CAPABILITY_LABELS: Record<string, string> = {
  planning: 'تخطيط',
  reflection: 'مراجعة',
  prioritization: 'ترتيب الأولويات',
  strategy: 'تحليل استراتيجي',
  analysis: 'تحليل بيانات',
  general: 'عام',
}
