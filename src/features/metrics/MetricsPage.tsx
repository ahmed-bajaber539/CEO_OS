import { useMetricCategories, useMetricValues, useCreateMetricCategory, useAddMetricValue, useDeleteMetricCategory, useDeleteMetricValue } from "@/hooks/use-metrics"
import type { Database } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { BookOpen, Code, DollarSign, TrendingUp, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingCards } from "@/components/shared/LoadingSkeleton"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Code,
  DollarSign,
  TrendingUp,
}

const iconOptions = [
  { value: "BookOpen", label: "📚 تعلم" },
  { value: "Code", label: "💻 برمجة" },
  { value: "DollarSign", label: "💰 مالي" },
  { value: "TrendingUp", label: "📈 نمو" },
]

export default function MetricsPage() {
  const { data: categories, isLoading } = useMetricCategories()
  const createCategory = useCreateMetricCategory()

  // Create category
  const [catOpen, setCatOpen] = useState(false)
  const [catName, setCatName] = useState("")
  const [catIcon, setCatIcon] = useState("")

  const handleCreateCategory = () => {
    if (!catName.trim()) return
    createCategory.mutate(
      { name: catName.trim(), icon: catIcon || undefined },
      { onSuccess: () => { setCatOpen(false); setCatName(""); setCatIcon(""); toast.success("تم إنشاء الفئة") } }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مؤشرات الأداء"
        description="لوحة متابعة المؤشرات الرئيسية"
        action={
          <Button onClick={() => setCatOpen(true)}>
            <Plus className="size-4" />
            فئة جديدة
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <LoadingCards count={4} />
        ) : categories ? (
          categories.map((category) => {
            const Icon = iconMap[category.icon || ""]
            return (
              <MetricCategoryCard key={category.id} category={category} Icon={Icon} />
            )
          })
        ) : null}
      </div>

      {/* Create Category Dialog */}
      <Dialog open={catOpen} onOpenChange={(open) => { if (!open) setCatOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>فئة مؤشرات جديدة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>اسم الفئة</Label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="مثال: الإيرادات الشهرية" autoFocus />
            </div>
            <div className="grid gap-2">
              <Label>الأيقونة</Label>
              <Select value={catIcon} onValueChange={setCatIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر أيقونة" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCatOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateCategory} disabled={!catName.trim() || createCategory.isPending}>
                إنشاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCategoryCard({
  category,
  Icon,
}: {
  category: Database["public"]["Tables"]["metric_categories"]["Row"]
  Icon: React.ComponentType<{ className?: string }> | undefined
}) {
  const { data: values } = useMetricValues(category.id)
  const addValue = useAddMetricValue()
  const deleteCategory = useDeleteMetricCategory()
  const deleteValue = useDeleteMetricValue()

  // Add value
  const [valOpen, setValOpen] = useState(false)
  const [valLabel, setValLabel] = useState("")
  const [valCurrent, setValCurrent] = useState("")
  const [valTarget, setValTarget] = useState("")

  const handleAddValue = () => {
    if (!valLabel.trim()) return
    const currentNum = parseFloat(valCurrent)
    const targetNum = parseFloat(valTarget)
    const progress = !isNaN(currentNum) && !isNaN(targetNum) && targetNum > 0 ? Math.round((currentNum / targetNum) * 100) : undefined
    addValue.mutate(
      {
        category_id: category.id,
        label: valLabel.trim(),
        current_value: valCurrent.trim() || undefined,
        target_value: valTarget.trim() || undefined,
        progress,
      },
      { onSuccess: () => { setValOpen(false); setValLabel(""); setValCurrent(""); setValTarget(""); toast.success("تمت إضافة المؤشر") } }
    )
  }

  return (
    <Card key={category.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {Icon && <Icon className="size-5 text-primary" />}
            {category.name}
          </CardTitle>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => deleteCategory.mutate(category.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {values && values.length > 0 ? (
          values.map((metric) => (
            <div key={metric.id} className="group space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {metric.current_value}
                    {metric.target_value && (
                      <span className="text-muted-foreground"> / {metric.target_value}</span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteValue.mutate({ valueId: metric.id, categoryId: category.id })}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <Progress value={metric.progress} className="h-1.5" />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد مؤشرات بعد</p>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={() => setValOpen(true)}>
          <Plus className="size-3" />
          إضافة مؤشر
        </Button>
      </CardContent>

      {/* Add Value Dialog */}
      <Dialog open={valOpen} onOpenChange={(open) => { if (!open) setValOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مؤشر - {category.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>اسم المؤشر</Label>
              <Input value={valLabel} onChange={(e) => setValLabel(e.target.value)} placeholder="مثال: عدد المستخدمين" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>القيمة الحالية</Label>
                <Input value={valCurrent} onChange={(e) => setValCurrent(e.target.value)} placeholder="0" dir="ltr" />
              </div>
              <div className="grid gap-2">
                <Label>القيمة المستهدفة</Label>
                <Input value={valTarget} onChange={(e) => setValTarget(e.target.value)} placeholder="100" dir="ltr" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setValOpen(false)}>إلغاء</Button>
              <Button onClick={handleAddValue} disabled={!valLabel.trim() || addValue.isPending}>
                إضافة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
