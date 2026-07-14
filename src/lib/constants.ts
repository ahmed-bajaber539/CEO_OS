export const ROUTES = {
  DASHBOARD: "/",
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  GOALS: "/goals",
  DAILY: "/daily",
  IDEAS: "/ideas",
  DECISIONS: "/decisions",
  METRICS: "/metrics",
  EXECUTIVE_AI: "/executive-ai",
} as const

export const PRIORITY = {
  URGENT_IMPORTANT: "urgent_important",
  IMPORTANT_NOT_URGENT: "important_not_urgent",
  URGENT_NOT_IMPORTANT: "urgent_not_important",
  NOT_URGENT_NOT_IMPORTANT: "not_urgent_not_important",
} as const

export const PRIORITY_CONFIG = {
  [PRIORITY.URGENT_IMPORTANT]: { label: "عاجل ومهم", color: "bg-red-500", textColor: "text-red-600", badge: "destructive" as const },
  [PRIORITY.IMPORTANT_NOT_URGENT]: { label: "مهم وغير عاجل", color: "bg-amber-500", textColor: "text-amber-600", badge: "secondary" as const },
  [PRIORITY.URGENT_NOT_IMPORTANT]: { label: "عاجل وغير مهم", color: "bg-blue-500", textColor: "text-blue-600", badge: "secondary" as const },
  [PRIORITY.NOT_URGENT_NOT_IMPORTANT]: { label: "غير عاجل وغير مهم", color: "bg-gray-400", textColor: "text-gray-500", badge: "outline" as const },
} as const

export const NAV_ITEMS = [
  { label: "لوحة التحكم", icon: "LayoutDashboard", path: ROUTES.DASHBOARD },
  { label: "المدير التنفيذي", icon: "Bot", path: ROUTES.EXECUTIVE_AI },
  { label: "المشاريع", icon: "FolderKanban", path: ROUTES.PROJECTS },
  { label: "الأهداف", icon: "Target", path: ROUTES.GOALS },
  { label: "المهام اليومية", icon: "CalendarCheck", path: ROUTES.DAILY },
  { label: "الأفكار", icon: "Lightbulb", path: ROUTES.IDEAS },
  { label: "القرارات", icon: "Scale", path: ROUTES.DECISIONS },
  { label: "المؤشرات", icon: "BarChart3", path: ROUTES.METRICS },
] as const

// ─── Unified Status System ───────────────────────────────────
export const STATUS = {
  project: {
    planning:   { label: "تخطيط",   variant: "secondary" as const },
    active:     { label: "نشط",     variant: "default"   as const },
    on_hold:    { label: "متوقف",   variant: "secondary" as const },
    completed:  { label: "مكتمل",   variant: "default"   as const },
    archived:   { label: "مؤرشف",   variant: "outline"   as const },
  },
  goal: {
    active:     { label: "نشط",     variant: "default"   as const },
    completed:  { label: "مكتمل",   variant: "default"   as const },
    on_hold:    { label: "متوقف",   variant: "secondary" as const },
    archived:   { label: "مؤرشف",   variant: "outline"   as const },
  },
  idea: {
    active:     { label: "نشطة",    variant: "secondary" as const },
    evaluating: { label: "قيد التقييم", variant: "outline" as const },
    converted:  { label: "محولة",   variant: "default"   as const },
    archived:   { label: "مؤرشفة",  variant: "outline"   as const },
  },
  phase: {
    pending:      { label: "معلقة",      color: "bg-muted" },
    in_progress:  { label: "قيد التنفيذ", color: "bg-primary" },
    completed:    { label: "مكتملة",      color: "bg-success" },
  },
} as const
