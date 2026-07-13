import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  CalendarCheck,
  Lightbulb,
  Scale,
  BarChart3,
  Bot,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/constants"
import { useSidebarStore } from "@/stores/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect } from "react"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FolderKanban,
  Target,
  CalendarCheck,
  Lightbulb,
  Scale,
  BarChart3,
  Bot,
}

export function Sidebar() {
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebarStore()
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setMobileOpen(false) }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [setMobileOpen])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b px-4", isCollapsed && "md:justify-center")}>
        {!isCollapsed && (
          <span className="font-semibold text-lg tracking-tight">CEO OS</span>
        )}
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ml-auto"
        >
          <X className="size-4" />
        </button>
        {/* Collapse toggle on desktop */}
        <button
          onClick={toggle}
          className={cn(
            "hidden md:block rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            !isCollapsed && "ml-auto"
          )}
        >
          {isCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon]
            const link = (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                    isCollapsed && "md:justify-center md:px-2"
                  )
                }
              >
                {Icon && <Icon className="size-5 shrink-0" />}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="hidden md:block">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return link
          })}
        </nav>

        <Separator className="my-2" />

        {/* Footer */}
        <div className="px-3">
          {!isCollapsed ? (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">المرحلة 1</p>
              <p>التأسيس التقني</p>
              <p className="mt-1">2026–2027</p>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="hidden md:flex justify-center rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground cursor-default">
                  <Target className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden md:block">المرحلة 1: التأسيس التقني</TooltipContent>
            </Tooltip>
          )}
        </div>
      </ScrollArea>
    </>
  )

  return (
    <>
      {/* Desktop: inline sidebar */}
      <aside
        className={cn(
          "hidden md:flex sidebar flex-col border-e bg-card transition-all duration-300",
          isCollapsed ? "w-17" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile: overlay sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <aside className="fixed inset-y-0 right-0 w-64 flex flex-col border-l bg-card shadow-lg animate-in slide-in-from-right">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
