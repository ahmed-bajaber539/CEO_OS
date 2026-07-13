import { useState, useEffect } from "react"
import { useDaily, useAddDailyTask, useToggleDailyTask, useDeleteDailyTask, useUpsertDaily } from "@/hooks/use-daily"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check, Circle, Pencil, AlertTriangle, Sun, Plus, Trash2 } from "lucide-react"
import { PRIORITY_CONFIG } from "@/lib/constants"
import { getToday } from "@/lib/utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingList } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"

const today = getToday()

// ─── Inline Editable Text ─────────────────────────────────────
function EditableText({
  value,
  onSave,
  placeholder,
}: {
  value: string
  onSave: (v: string) => void
  placeholder: string
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setText(value)
              setEditing(false)
            }
          }}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onSave(text)
              setEditing(false)
            }}
          >
            حفظ
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setText(value)
              setEditing(false)
            }}
          >
            إلغاء
          </Button>
        </div>
      </div>
    )
  }

  return (
    <p
      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors rounded p-1 -m-1"
      onClick={() => setEditing(true)}
    >
      {value || placeholder}
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function DailyPage() {
  const { data: daily, isLoading } = useDaily(today)
  const addTask = useAddDailyTask()
  const toggleTask = useToggleDailyTask()
  const deleteTask = useDeleteDailyTask()
  const upsertDaily = useUpsertDaily()

  const [newTask, setNewTask] = useState("")

  // Auto-create daily plan if none exists for today
  useEffect(() => {
    if (!isLoading && !daily) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          upsertDaily.mutate({ user_id: user.id, date: today })
        }
      })
    }
  }, [isLoading, daily])

  const handleAddTask = () => {
    if (!newTask.trim() || !daily) return
    addTask.mutate(
      { dailyPlanId: daily.id, text: newTask.trim() },
      { onSuccess: () => setNewTask("") }
    )
  }

  const handleUpdateField = (
    field: "notes" | "blockers" | "tomorrow_plan",
    value: string
  ) => {
    if (!daily) return
    upsertDaily.mutate({
      user_id: daily.user_id,
      date: daily.date,
      [field]: value,
    })
  }

  const completed = daily?.daily_tasks?.filter((t) => t.done).length || 0
  const total = daily?.daily_tasks?.length || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="المهام اليومية"
        description={new Date().toLocaleDateString("ar-SA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              المهام المنجزة: {completed}/{total}
            </span>
            <span className="text-sm text-muted-foreground">
              {total > 0 ? Math.round((completed / total) * 100) : 0}%
            </span>
          </div>
          <Progress
            value={total > 0 ? Math.round((completed / total) * 100) : 0}
            className="mt-2 h-2"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>مهام اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add task input */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="أضف مهمة جديدة..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask()
                }}
                disabled={addTask.isPending}
              />
              <Button
                size="icon"
                onClick={handleAddTask}
                disabled={!newTask.trim() || !daily || addTask.isPending}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {isLoading ? (
              <LoadingList count={2} />
            ) : daily?.daily_tasks && daily.daily_tasks.length > 0 ? (
              <div className="space-y-1">
                {daily.daily_tasks.map((task) => {
                  const priority = PRIORITY_CONFIG[task.priority]
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <button
                        onClick={() =>
                          toggleTask.mutate({
                            taskId: task.id,
                            done: !task.done,
                          })
                        }
                        className="shrink-0"
                      >
                        {task.done ? (
                          <Check className="size-4 text-success" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground" />
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
                      {priority && (
                        <Badge variant={priority.badge}>{priority.label}</Badge>
                      )}
                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={Pencil} title="لا توجد مهام اليوم" />
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pencil className="size-4" />
                ملاحظات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableText
                value={daily?.notes || ""}
                onSave={(v) => handleUpdateField("notes", v)}
                placeholder="لا توجد ملاحظات"
              />
            </CardContent>
          </Card>

          {/* Blockers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" />
                المعوقات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableText
                value={daily?.blockers || ""}
                onSave={(v) => handleUpdateField("blockers", v)}
                placeholder="لا توجد معوقات"
              />
            </CardContent>
          </Card>

          {/* Tomorrow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="size-4" />
                خطة الغد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableText
                value={daily?.tomorrow_plan || ""}
                onSave={(v) => handleUpdateField("tomorrow_plan", v)}
                placeholder="لم تحدد بعد"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
