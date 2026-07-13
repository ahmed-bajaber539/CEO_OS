import { useProjects } from "@/hooks/use-projects"
import { useGoals, useGoalProgress } from "@/hooks/use-goals"
import { useDaily, useToggleDailyTask } from "@/hooks/use-daily"
import { useDecisions } from "@/hooks/use-decisions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, FolderKanban, CalendarCheck, Scale, ArrowUpRight } from "lucide-react"
import { formatDate, getToday } from "@/lib/utils"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSection, LoadingList } from "@/components/shared/LoadingSkeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"

const today = getToday()

function GoalProgressRow({ goalId }: { goalId: string }) {
  const { data: progress } = useGoalProgress(goalId)
  if (!progress) return null
  return (
    <div className="mt-1 flex items-center gap-2">
      <Progress value={progress.percent} className="h-1.5 flex-1" />
      <span className="text-xs text-muted-foreground">{progress.percent}%</span>
    </div>
  )
}

export default function DashboardPage() {
  const { data: goals, isLoading: goalsLoading } = useGoals("annual")
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: daily, isLoading: dailyLoading } = useDaily(today)
  const { data: decisions } = useDecisions()
  const toggleDailyTask = useToggleDailyTask()

  return (
    <div className="space-y-6">
      <PageHeader title="لوحة التحكم" description="نظرة عامة على نظام التشغيل التنفيذي" />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المشاريع النشطة</CardTitle>
            <FolderKanban className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsLoading ? <Skeleton className="h-8 w-12" /> : projects?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مهام اليوم</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyLoading ? <Skeleton className="h-8 w-12" /> : daily?.daily_tasks?.filter((t) => t.done).length || 0}/{daily?.daily_tasks?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الأهداف السنوية</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalsLoading ? <Skeleton className="h-8 w-12" /> : goals?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">القرارات</CardTitle>
            <Scale className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{decisions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Goals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>أهم الأهداف السنوية</CardTitle>
            <Link to="/goals" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              عرض الكل <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <LoadingSection rows={3} height="h-16" />
            ) : goals && goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{goal.title}</p>
                      <GoalProgressRow goalId={goal.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد أهداف بعد</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Decision */}
        <Card>
          <CardHeader>
            <CardTitle>آخر قرار</CardTitle>
          </CardHeader>
          <CardContent>
            {decisions && decisions.length > 0 ? (
              <div className="space-y-2">
                <Badge variant="outline">{formatDate(decisions[0].decided_at)}</Badge>
                <p className="font-medium">{decisions[0].title}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{decisions[0].reason}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد قرارات بعد</p>
            )}
          </CardContent>
        </Card>

        {/* Today Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>مهام اليوم</CardTitle>
            <Link to="/daily" className="text-sm text-muted-foreground hover:text-foreground">
              عرض
            </Link>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <LoadingList count={2} />
            ) : daily?.daily_tasks && daily.daily_tasks.length > 0 ? (
              <div className="space-y-2">
                {daily.daily_tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleDailyTask.mutate({ taskId: task.id, done: !task.done })}
                    className="flex items-center gap-2 text-sm w-full text-right hover:bg-accent/50 rounded p-1 -m-1 transition-colors"
                  >
                    <div className={`size-2 rounded-full shrink-0 ${task.done ? "bg-success" : task.priority === "urgent_important" ? "bg-destructive" : "bg-muted-foreground"}`} />
                    <span className={task.done ? "line-through text-muted-foreground" : ""}>{task.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد مهام اليوم</p>
            )}
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>المشاريع النشطة</CardTitle>
            <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              عرض الكل <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <LoadingSection rows={2} height="h-20" />
            ) : projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="block rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{project.description || "لا يوجد وصف"}</p>
                      </div>
                      <StatusBadge type="project" status={project.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderKanban className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد مشاريع بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
