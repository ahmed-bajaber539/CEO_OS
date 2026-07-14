import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useAddProjectTask,
  useToggleProjectTask,
  useDeleteProjectTask,
  useAddProjectPhase,
  useLinkGoalToProject,
  useUnlinkGoalFromProject,
  useProjectGoals,
} from "@/hooks/use-projects"
import { useGoals } from "@/hooks/use-goals"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Circle,
  Pencil,
  Link2,
  Unlink2,
} from "lucide-react"
import { LoadingPage } from "@/components/shared/LoadingSkeleton"
import { STATUS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useConfirmStore } from "@/stores/confirm"

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: project, isLoading } = useProject(id!)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const addTask = useAddProjectTask()
  const toggleTask = useToggleProjectTask()
  const deleteTask = useDeleteProjectTask()
  const addPhase = useAddProjectPhase()
  const linkGoal = useLinkGoalToProject()
  const unlinkGoal = useUnlinkGoalFromProject()
  const { data: linkedGoals } = useProjectGoals(id!)
  const { data: allGoals } = useGoals("annual")

  const [newTask, setNewTask] = useState("")
  const [newPhase, setNewPhase] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState("")

  // Unlinked goals (for the dropdown)
  const linkedGoalIds = new Set(linkedGoals?.map((g) => g.id) ?? [])
  const unlinkedGoals = allGoals?.filter((g) => !linkedGoalIds.has(g.id)) ?? []

  if (isLoading) return <LoadingPage />

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">المشروع غير موجود</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/projects")}>
          العودة للمشاريع
        </Button>
      </div>
    )
  }

  const completedTasks = project.project_tasks?.filter((t) => t.done).length || 0
  const totalTasks = project.project_tasks?.length || 0

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/projects")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        العودة للمشاريع
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateProject.mutate({ id: project.id, input: { name: editName } })
                    setEditingName(false)
                  }
                  if (e.key === "Escape") setEditingName(false)
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  updateProject.mutate({ id: project.id, input: { name: editName } })
                  setEditingName(false)
                }}
              >
                حفظ
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <button
                onClick={() => {
                  setEditName(project.name)
                  setEditingName(true)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
            </div>
          )}
          <p className="text-muted-foreground mt-1">{project.description || "لا يوجد وصف"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={project.status}
            onValueChange={(status) =>
              updateProject.mutate({ id: project.id, input: { status } as never })
            }
          >
            <SelectTrigger className="w-32.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">تخطيط</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="on_hold">متوقف</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="archived">مؤرشف</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              useConfirmStore.getState().confirm({
                title: 'حذف المشروع',
                message: 'هل أنت متأكد من حذف هذا المشروع؟ سيتم حذف جميع المهام والمراحل المرتبطة به. لا يمكن التراجع عن هذا الإجراء.',
                variant: 'destructive',
                confirmLabel: 'نعم، احذف المشروع',
                onConfirm: () => {
                  deleteProject.mutate(project.id, {
                    onSuccess: () => {
                      toast.success('تم حذف المشروع')
                      navigate('/projects')
                    },
                  })
                },
              })
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>المهام ({completedTasks}/{totalTasks})</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add task */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="أضف مهمة جديدة..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTask.mutate(
                        { projectId: project.id, text: newTask.trim() },
                        { onSuccess: () => setNewTask("") }
                      )
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() =>
                    addTask.mutate(
                      { projectId: project.id, text: newTask.trim() },
                      { onSuccess: () => setNewTask("") }
                    )
                  }
                  disabled={!newTask.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {project.project_tasks && project.project_tasks.length > 0 ? (
                <div className="space-y-1">
                  {project.project_tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <button
                        onClick={() =>
                          toggleTask.mutate({
                            taskId: task.id,
                            done: !task.done,
                            projectId: project.id,
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
                      <button
                        onClick={() =>
                          deleteTask.mutate({
                            taskId: task.id,
                            projectId: project.id,
                          })
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد مهام بعد</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Phases */}
          <Card>
            <CardHeader>
              <CardTitle>المراحل</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add phase */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newPhase}
                  onChange={(e) => setNewPhase(e.target.value)}
                  placeholder="أضف مرحلة..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addPhase.mutate(
                        {
                          projectId: project.id,
                          phase: { name: newPhase.trim() },
                        },
                        { onSuccess: () => setNewPhase("") }
                      )
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() =>
                    addPhase.mutate(
                      { projectId: project.id, phase: { name: newPhase.trim() } },
                      { onSuccess: () => setNewPhase("") }
                    )
                  }
                  disabled={!newPhase.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {project.project_phases && project.project_phases.length > 0 ? (
                <div className="space-y-2">
                  {project.project_phases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={`size-2 rounded-full ${
                          STATUS.phase[
                            phase.status as keyof typeof STATUS.phase
                          ]?.color ?? "bg-muted"
                        }`}
                      />
                      <span>{phase.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  لا توجد مراحل بعد
                </p>
              )}
            </CardContent>
          </Card>

          {/* Linked Goals */}
          <Card>
            <CardHeader>
              <CardTitle>الأهداف المرتبطة</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Link goal dropdown */}
              {unlinkedGoals.length > 0 && (
                <Select
                  onValueChange={(goalId) =>
                    linkGoal.mutate({ projectId: project.id, goalId })
                  }
                >
                  <SelectTrigger className="mb-3">
                    <SelectValue placeholder="اربط بهدف..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedGoals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {linkedGoals && linkedGoals.length > 0 ? (
                <div className="space-y-2">
                  {linkedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="size-3 text-muted-foreground" />
                        <span className="truncate">{goal.title}</span>
                      </div>
                      <button
                        onClick={() =>
                          unlinkGoal.mutate({
                            projectId: project.id,
                            goalId: goal.id,
                          })
                        }
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Unlink2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  لا توجد أهداف مرتبطة
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>آخر تحديث</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatDate(project.updated_at || project.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
