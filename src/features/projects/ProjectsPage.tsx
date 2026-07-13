import { useState } from "react"
import { Link } from "react-router-dom"
import { useProjects, useCreateProject } from "@/hooks/use-projects"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingCards } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("يرجى تسجيل الدخول أولاً"); return }
    createProject.mutate(
      { user_id: user.id, name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => { setDialogOpen(false); setName(""); setDescription(""); toast.success("تم إنشاء المشروع") } }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="المشاريع"
        description="إدارة ومتابعة جميع المشاريع"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            مشروع جديد
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <LoadingCards count={3} />
        ) : projects && projects.length > 0 ? (
          projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="group-hover:text-primary transition-colors">{project.name}</CardTitle>
                    <StatusBadge type="project" status={project.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.description || "لا يوجد وصف بعد"}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(project.updated_at || project.created_at)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={FolderKanban}
              title="لا توجد مشاريع بعد"
              action={{ label: "إنشاء أول مشروع", onClick: () => setDialogOpen(true) }}
              className="border-dashed"
            />
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مشروع جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>اسم المشروع</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسم المشروع..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر للمشروع..."
                rows={3}
              />
            </div>
            <Button onClick={handleCreate} disabled={!name.trim() || createProject.isPending}>
              إنشاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
