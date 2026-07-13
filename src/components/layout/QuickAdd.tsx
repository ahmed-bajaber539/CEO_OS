import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FolderKanban, Lightbulb, Scale, Target, CalendarCheck, Plus } from "lucide-react"
import { useQuickAddStore } from "@/stores/quick-add"
import { useCreateProject } from "@/hooks/use-projects"
import { useCreateIdea } from "@/hooks/use-ideas"
import { useCreateDecision } from "@/hooks/use-decisions"
import { useCreateGoal } from "@/hooks/use-goals"
import { useAddDailyTask, useUpsertDaily } from "@/hooks/use-daily"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn, getToday } from "@/lib/utils"

type QuickAddType = "project" | "idea" | "decision" | "goal" | "task" | null

const options: { type: QuickAddType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { type: "project", label: "مشروع جديد", icon: FolderKanban, description: "أنشئ مشروعًا جديدًا مع المراحل والمهام" },
  { type: "idea", label: "فكرة جديدة", icon: Lightbulb, description: "سجل فكرة لمراجعتها لاحقًا" },
  { type: "decision", label: "قرار جديد", icon: Scale, description: "سجل قرارًا مهمًا مع أسبابه" },
  { type: "goal", label: "هدف جديد", icon: Target, description: "أضف هدفًا سنويًا أو ربع سنوي" },
  { type: "task", label: "مهمة يومية", icon: CalendarCheck, description: "أضف مهمة لقائمة مهام اليوم" },
]

export function QuickAdd() {
  const { isOpen, close } = useQuickAddStore()
  const [selectedType, setSelectedType] = useState<QuickAddType>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const navigate = useNavigate()

  const createProject = useCreateProject()
  const createIdea = useCreateIdea()
  const createDecision = useCreateDecision()
  const createGoal = useCreateGoal()
  const addDailyTask = useAddDailyTask()
  const upsertDaily = useUpsertDaily()

  const handleClose = () => {
    setSelectedType(null)
    setName("")
    setDescription("")
    close()
  }

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("يرجى تسجيل الدخول أولاً"); return null }
    return user.id
  }

  const handleSubmit = async () => {
    if (!selectedType || !name.trim()) return

    const userId = await getUserId()
    if (!userId) return

    const onSuccess = (path: string) => {
      toast.success("تمت الإضافة بنجاح")
      handleClose()
      navigate(path)
    }

    if (selectedType === "project") {
      createProject.mutate(
        { user_id: userId, name: name.trim(), description: description.trim() || undefined },
        { onSuccess: () => onSuccess("/projects") }
      )
    } else if (selectedType === "idea") {
      createIdea.mutate(
        { user_id: userId, title: name.trim(), description: description.trim() || undefined, effort: "medium", expected_return: "medium", priority: "medium" },
        { onSuccess: () => onSuccess("/ideas") }
      )
    } else if (selectedType === "decision") {
      createDecision.mutate(
        { user_id: userId, title: name.trim(), reason: description.trim() || undefined, decided_at: new Date().toISOString() },
        { onSuccess: () => onSuccess("/decisions") }
      )
    } else if (selectedType === "goal") {
      createGoal.mutate(
        { user_id: userId, title: name.trim(), description: description.trim() || undefined, goal_type: "annual" },
        { onSuccess: () => onSuccess("/goals") }
      )
    } else if (selectedType === "task") {
      // Ensure daily plan exists, then add task
      const today = getToday()
      upsertDaily.mutate(
        { user_id: userId, date: today },
        {
          onSuccess: (dailyPlan) => {
            addDailyTask.mutate(
              { dailyPlanId: dailyPlan.id, text: name.trim() },
              { onSuccess: () => onSuccess("/daily") }
            )
          },
        }
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة سريعة</DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid gap-3">
            {options.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.type}
                  onClick={() => setSelectedType(opt.type)}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-4 text-right transition-all hover:border-primary hover:bg-accent/50"
                  )}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {Icon && <Icon className="size-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  </div>
                  <Plus className="mr-auto size-4 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-4">
            <button
              onClick={() => setSelectedType(null)}
              className="text-sm text-muted-foreground hover:text-foreground text-right"
            >
              العودة
            </button>
            <div className="grid gap-2">
              <Label>الاسم</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل الاسم..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="أدخل وصفًا مختصرًا..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>إلغاء</Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || createProject.isPending || createIdea.isPending || createDecision.isPending || createGoal.isPending || upsertDaily.isPending || addDailyTask.isPending}
              >
                إضافة
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
