import { useState } from "react"
import {
  useGoals,
  useGoalChildren,
  useGoalProgress,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useGoal,
  useAddGoalTask,
  useToggleGoalTask,
  useDeleteGoalTask,
  useAddGoalIndicator,
} from "@/hooks/use-goals"
import type { Database } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Target,
  Calendar,
  Clock,
  ListTodo,
  Plus,
  Trash2,
  Check,
  Circle,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingList } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useConfirmStore } from "@/stores/confirm"

type GoalRow = Database["public"]["Tables"]["goals"]["Row"]
type GoalType = Database["public"]["Enums"]["goal_type"]

// ─── Expandable Goal Card ────────────────────────────────────
function GoalCard({ goal }: { goal: GoalRow; goalType: GoalType }) {
  const [expanded, setExpanded] = useState(false)
  const { data: children } = useGoalChildren(goal.id)
  const { data: progress } = useGoalProgress(goal.id)
  const { data: detail } = useGoal(goal.id)

  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const addTask = useAddGoalTask()
  const toggleTask = useToggleGoalTask()
  const delTask = useDeleteGoalTask()
  const addIndicator = useAddGoalIndicator()

  const [newTask, setNewTask] = useState("")
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(goal.title)
  const [indicatorLabel, setIndicatorLabel] = useState("")
  const [indicatorTarget, setIndicatorTarget] = useState("")

  const tasks = detail?.goal_tasks ?? []
  const indicators = detail?.goal_indicators ?? []

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold h-auto py-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateGoal.mutate({ id: goal.id, input: { title: editTitle } })
                      setEditingTitle(false)
                    }
                    if (e.key === "Escape") setEditingTitle(false)
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    updateGoal.mutate({ id: goal.id, input: { title: editTitle } })
                    setEditingTitle(false)
                  }}
                >
                  حفظ
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{goal.title}</CardTitle>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditTitle(goal.title)
                    setEditingTitle(true)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge type="goal" status={goal.status} className="text-xs" />
            <button
              onClick={async (e) => {
                e.stopPropagation()
                const ok = await useConfirmStore.getState().confirm({
                  title: 'حذف الهدف',
                  message: 'هل أنت متأكد من حذف هذا الهدف؟ لا يمكن التراجع عن هذا الإجراء.',
                  variant: 'destructive',
                  confirmLabel: 'نعم، احذف',
                })
                if (ok) {
                  deleteGoal.mutate(goal.id, {
                    onSuccess: () => toast.success('تم حذف الهدف'),
                  })
                }
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
            {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {progress ? (
          <>
            <Progress value={progress.percent} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground mb-3">
              {progress.completed}/{progress.total} مهام منجزة
            </p>
          </>
        ) : (
          <Progress value={0} className="h-2 mb-3" />
        )}
        {goal.description && (
          <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
        )}
        {children && children.length > 0 && (
          <div className="grid gap-2 text-sm text-muted-foreground mt-3">
            {children.map((child) => (
              <div key={child.id} className="flex justify-between">
                <span>{child.title}</span>
                <StatusBadge type="goal" status={child.status} className="text-xs" />
              </div>
            ))}
          </div>
        )}

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Tasks */}
            <div>
              <p className="text-sm font-medium mb-2">المهام</p>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="أضف مهمة..."
                  size={10}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTask.trim()) {
                      addTask.mutate(
                        { goalId: goal.id, text: newTask.trim() },
                        { onSuccess: () => setNewTask("") }
                      )
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() => {
                    if (!newTask.trim()) return
                    addTask.mutate(
                      { goalId: goal.id, text: newTask.trim() },
                      { onSuccess: () => setNewTask("") }
                    )
                  }}
                  disabled={!newTask.trim()}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              {tasks.length > 0 ? (
                <div className="space-y-1">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm p-1 rounded hover:bg-accent/50 group"
                    >
                      <button
                        onClick={() =>
                          toggleTask.mutate({
                            taskId: task.id,
                            done: !task.done,
                            goalId: goal.id,
                          })
                        }
                        className="shrink-0"
                      >
                        {task.done ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Circle className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <span
                        className={
                          task.done
                            ? "line-through text-muted-foreground flex-1"
                            : "flex-1"
                        }
                      >
                        {task.text}
                      </span>
                      <button
                        onClick={() =>
                          delTask.mutate({ taskId: task.id, goalId: goal.id })
                        }
                        className="opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد مهام</p>
              )}
            </div>

            {/* Indicators */}
            <div>
              <p className="text-sm font-medium mb-2">مؤشرات الأداء</p>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <div className="flex gap-2 flex-1">
                  <Input
                    value={indicatorLabel}
                    onChange={(e) => setIndicatorLabel(e.target.value)}
                    placeholder="اسم المؤشر..."
                    size={10}
                  />
                  <Input
                    value={indicatorTarget}
                    onChange={(e) => setIndicatorTarget(e.target.value)}
                    placeholder="القيمة المستهدفة"
                    size={10}
                    className="max-w-30"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!indicatorLabel.trim()) return
                    addIndicator.mutate(
                      {
                        goalId: goal.id,
                        indicator: {
                          label: indicatorLabel.trim(),
                          target: indicatorTarget.trim() || undefined,
                        },
                      },
                      {
                        onSuccess: () => {
                          setIndicatorLabel("")
                          setIndicatorTarget("")
                        },
                      }
                    )
                  }}
                  disabled={!indicatorLabel.trim()}
                >
                  أضف
                </Button>
              </div>
              {indicators.length > 0 ? (
                <div className="space-y-1">
                  {indicators.map((ind) => (
                    <div
                      key={ind.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-muted-foreground">{ind.label}</span>
                      {ind.target && (
                        <Badge variant="outline" className="text-xs">
                          {ind.current || "—"} / {ind.target}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد مؤشرات</p>
              )}
            </div>

            {/* Status control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">الحالة:</span>
              <Select
                value={goal.status}
                onValueChange={(status) =>
                  updateGoal.mutate({
                    id: goal.id,
                    input: { status } as never,
                  })
                }
              >
                <SelectTrigger className="w-30 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="on_hold">متوقف</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Goal Tab ─────────────────────────────────────────────────
function GoalTab({ goalType }: { goalType: GoalType }) {
  const { data: goals, isLoading } = useGoals(goalType)

  if (isLoading) return <LoadingList count={3} />

  if (!goals || goals.length === 0) {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      annual: Target,
      quarterly: Calendar,
      monthly: Clock,
      weekly: ListTodo,
    }
    const labels: Record<string, string> = {
      annual: "لا توجد أهداف سنوية بعد",
      quarterly: "لا توجد أهداف ربع سنوية بعد",
      monthly: "لا توجد أهداف شهرية بعد",
      weekly: "لا توجد أهداف أسبوعية بعد",
    }
    const Icon = icons[goalType] as LucideIcon
    return <EmptyState icon={Icon} title={labels[goalType]} />
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} goalType={goalType} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function GoalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [goalType, setGoalType] = useState<GoalType>("annual")

  const createGoal = useCreateGoal()

  const handleCreate = async () => {
    if (!title.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("يرجى تسجيل الدخول أولاً"); return }
    createGoal.mutate(
      {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        goal_type: goalType,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setTitle("")
          setDescription("")
          setGoalType("annual")
          toast.success("تم إنشاء الهدف")
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأهداف"
        description="متابعة الأهداف على جميع المستويات"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            هدف جديد
          </Button>
        }
      />

      <Tabs defaultValue="annual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="annual">
            <Target className="size-4" />
            <span className="hidden sm:inline mr-1">سنوية</span>
          </TabsTrigger>
          <TabsTrigger value="quarterly">
            <Calendar className="size-4" />
            <span className="hidden sm:inline mr-1">ربع سنوية</span>
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <Clock className="size-4" />
            <span className="hidden sm:inline mr-1">شهرية</span>
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <ListTodo className="size-4" />
            <span className="hidden sm:inline mr-1">أسبوعية</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="annual" className="space-y-4">
          <GoalTab goalType="annual" />
        </TabsContent>
        <TabsContent value="quarterly" className="space-y-4">
          <GoalTab goalType="quarterly" />
        </TabsContent>
        <TabsContent value="monthly" className="space-y-4">
          <GoalTab goalType="monthly" />
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <GoalTab goalType="weekly" />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>هدف جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>العنوان</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الهدف..."
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر..."
              />
            </div>
            <div className="grid gap-2">
              <Label>المستوى</Label>
              <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">سنوي</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={!title.trim()}>
              إنشاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
