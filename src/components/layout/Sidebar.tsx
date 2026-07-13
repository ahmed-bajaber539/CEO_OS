import { NavLink } from "react-router-dom"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/constants"
import { useSidebarStore } from "@/stores/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  const { isCollapsed, toggle } = useSidebarStore()

  return (
    <aside
      className={cn(
        "sidebar flex flex-col border-e bg-card transition-all duration-300",
        isCollapsed ? "w-17" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-14 items-center border-b px-4", isCollapsed && "justify-center")}>
        {!isCollapsed && (
          <span className="font-semibold text-lg tracking-tight">CEO OS</span>
        )}
        <button
          onClick={toggle}
          className={cn(
            "rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
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
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                    isCollapsed && "justify-center px-2"
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
                  <TooltipContent side="right">{item.label}</TooltipContent>
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
                <div className="flex justify-center rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground cursor-default">
                  <Target className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">المرحلة 1: التأسيس التقني</TooltipContent>
            </Tooltip>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
