import { useIdeas, useCreateIdea, useDeleteIdea, useUpdateIdea, useConvertIdea } from "@/hooks/use-ideas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Lightbulb, Archive, Trash2, ArrowRightLeft, Pencil } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingCards } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"

export default function IdeasPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  // Edit state
  const [editIdea, setEditIdea] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState("")

  // Convert state
  const [convertIdeaId, setConvertIdeaId] = useState<string | null>(null)
  const [convertName, setConvertName] = useState("")

  const { data: ideas, isLoading } = useIdeas()
  const createMutation = useCreateIdea()
  const deleteMutation = useDeleteIdea()
  const archiveMutation = useUpdateIdea()
  const updateMutation = useUpdateIdea()
  const convertMutation = useConvertIdea()

  const openEdit = (idea: { id: string; title: string; description: string | null; category: string | null }) => {
    setEditIdea(idea.id)
    setEditTitle(idea.title)
    setEditDescription(idea.description || "")
    setEditCategory(idea.category || "")
  }

  const handleConvert = async () => {
    if (!convertIdeaId || !convertName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("يرجى تسجيل الدخول أولاً"); return }
    convertMutation.mutate(
      { ideaId: convertIdeaId, name: convertName.trim(), user_id: user.id },
      {
        onSuccess: () => {
          setConvertIdeaId(null)
          setConvertName("")
          toast.success("تم تحويل الفكرة إلى مشروع")
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="بنك الأفكار"
        description="الأفكار تنتظر التقييم قبل التحول إلى مشاريع"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            فكرة جديدة
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <LoadingCards count={3} />
        ) : ideas && ideas.length > 0 ? (
          ideas.map((idea) => (
            <Card key={idea.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{idea.title}</CardTitle>
                  <Badge variant="secondary">{idea.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{idea.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate({ id: idea.id, input: { status: "archived" } })}>
                    <Archive className="size-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setConvertIdeaId(idea.id); setConvertName(idea.title) }} disabled={idea.status === "converted"}>
                    <ArrowRightLeft className="size-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(idea)}>
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(idea.id)}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={Lightbulb}
              title="لا توجد أفكار بعد"
              action={{ label: "أضف أول فكرة", onClick: () => setDialogOpen(true) }}
              className="border-dashed"
            />
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>فكرة جديدة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>العنوان</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الفكرة" />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="تطبيق">تطبيق</SelectItem>
                  <SelectItem value="أداة">أداة</SelectItem>
                  <SelectItem value="محتوى">محتوى</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { toast.error("يرجى تسجيل الدخول أولاً"); return }
                createMutation.mutate(
                  { user_id: user.id, title, description, category, effort: "medium", expected_return: "medium", priority: "medium" },
                  { onSuccess: () => { setDialogOpen(false); setTitle(""); setDescription(""); setCategory(""); toast.success("تمت إضافة الفكرة") } }
                )
              }}
              disabled={!title}
            >
              إضافة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editIdea} onOpenChange={(open) => { if (!open) setEditIdea(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الفكرة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>العنوان</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>الفئة</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="تطبيق">تطبيق</SelectItem>
                  <SelectItem value="أداة">أداة</SelectItem>
                  <SelectItem value="محتوى">محتوى</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (!editIdea || !editTitle.trim()) return
                updateMutation.mutate(
                  { id: editIdea, input: { title: editTitle.trim(), description: editDescription.trim() || null, category: editCategory } },
                  { onSuccess: () => { setEditIdea(null); toast.success("تم تعديل الفكرة") } }
                )
              }}
              disabled={!editTitle.trim()}
            >
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={!!convertIdeaId} onOpenChange={(open) => { if (!open) { setConvertIdeaId(null); setConvertName("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحويل الفكرة إلى مشروع</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>اسم المشروع</Label>
              <Input value={convertName} onChange={(e) => setConvertName(e.target.value)} placeholder="اسم المشروع الجديد" autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setConvertIdeaId(null); setConvertName("") }}>إلغاء</Button>
              <Button onClick={handleConvert} disabled={!convertName.trim() || convertMutation.isPending}>
                {convertMutation.isPending ? "جاري التحويل..." : "تحويل"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
