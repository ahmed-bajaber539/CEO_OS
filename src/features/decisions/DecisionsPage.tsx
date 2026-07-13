import { useDecisions, useCreateDecision, useUpdateDecision, useDeleteDecision } from "@/hooks/use-decisions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Scale, Plus, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSection } from "@/components/shared/LoadingSkeleton"

export default function DecisionsPage() {
  const { data: decisions, isLoading } = useDecisions()
  const createMutation = useCreateDecision()
  const updateMutation = useUpdateDecision()
  const deleteMutation = useDeleteDecision()

  // Create state
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [reason, setReason] = useState("")
  const [alternatives, setAlternatives] = useState("")
  const [expectedImpact, setExpectedImpact] = useState("")

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editReason, setEditReason] = useState("")
  const [editAlternatives, setEditAlternatives] = useState("")
  const [editExpectedImpact, setEditExpectedImpact] = useState("")

  // Expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const resetCreate = () => { setTitle(""); setReason(""); setAlternatives(""); setExpectedImpact("") }

  const openEdit = (d: { id: string; title: string; reason: string | null; alternatives: string[] | null; expected_impact: string | null }) => {
    setEditId(d.id)
    setEditTitle(d.title)
    setEditReason(d.reason || "")
    setEditAlternatives(d.alternatives?.join(", ") || "")
    setEditExpectedImpact(d.expected_impact || "")
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("يرجى تسجيل الدخول أولاً"); return }
    createMutation.mutate(
      {
        user_id: user.id,
        title: title.trim(),
        reason: reason.trim() || undefined,
        alternatives: alternatives.trim() ? alternatives.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        expected_impact: expectedImpact.trim() || undefined,
        decided_at: new Date().toISOString(),
      },
      { onSuccess: () => { setCreateOpen(false); resetCreate(); toast.success("تم تسجيل القرار") } }
    )
  }

  const handleUpdate = () => {
    if (!editId || !editTitle.trim()) return
    updateMutation.mutate(
      {
        id: editId,
        input: {
          title: editTitle.trim(),
          reason: editReason.trim() || null,
          alternatives: editAlternatives.trim() ? editAlternatives.split(",").map(s => s.trim()).filter(Boolean) : null,
          expected_impact: editExpectedImpact.trim() || null,
        },
      },
      { onSuccess: () => { setEditId(null); toast.success("تم تعديل القرار") } }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="القرارات"
        description="سجل جميع القرارات المهمة مع أسبابها"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            قرار جديد
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSection rows={2} />
            </div>
          ) : decisions && decisions.length > 0 ? (
            <div className="divide-y">
              {decisions.map((decision) => (
                <div key={decision.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Scale className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{formatDate(decision.decided_at)}</Badge>
                        </div>
                        <h3 className="font-medium">{decision.title}</h3>
                        {decision.reason && (
                          <p className="text-sm text-muted-foreground mt-1">{decision.reason}</p>
                        )}
                        {decision.alternatives && decision.alternatives.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {decision.alternatives.map((alt, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{alt}</Badge>
                            ))}
                          </div>
                        )}
                        {/* Expanded details */}
                        {expanded.has(decision.id) && (
                          <div className="mt-3 space-y-2 border-t pt-3">
                            {decision.expected_impact && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">الأثر المتوقع:</span>
                                <p className="text-sm">{decision.expected_impact}</p>
                              </div>
                            )}
                            {decision.actual_result && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">النتيجة الفعلية:</span>
                                <p className="text-sm">{decision.actual_result}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 self-end sm:self-start">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => toggleExpand(decision.id)}>
                        {expanded.has(decision.id) ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(decision)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => deleteMutation.mutate(decision.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Scale} title="لا توجد قرارات مسجلة بعد" action={{ label: "سجل أول قرار", onClick: () => setCreateOpen(true) }} />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>قرار جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>العنوان</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان القرار" autoFocus />
            </div>
            <div className="grid gap-2">
              <Label>السبب</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="لماذا اتخذت هذا القرار؟" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>البدائل (مفصولة بفواصل)</Label>
              <Input value={alternatives} onChange={(e) => setAlternatives(e.target.value)} placeholder="البديل أ, البديل ب" />
            </div>
            <div className="grid gap-2">
              <Label>الأثر المتوقع</Label>
              <Input value={expectedImpact} onChange={(e) => setExpectedImpact(e.target.value)} placeholder="ماذا تتوقع أن يحدث؟" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreate() }}>إلغاء</Button>
              <Button onClick={handleCreate} disabled={!title.trim() || createMutation.isPending}>
                {createMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل القرار</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>العنوان</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>السبب</Label>
              <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>البدائل (مفصولة بفواصل)</Label>
              <Input value={editAlternatives} onChange={(e) => setEditAlternatives(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>الأثر المتوقع</Label>
              <Input value={editExpectedImpact} onChange={(e) => setEditExpectedImpact(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditId(null)}>إلغاء</Button>
              <Button onClick={handleUpdate} disabled={!editTitle.trim() || updateMutation.isPending}>
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
