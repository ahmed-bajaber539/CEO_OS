import { Plus, Search, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useQuickAddStore } from "@/stores/quick-add"
import { useSearchStore } from "@/stores/search"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export function Header() {
  const { open: openQuickAdd } = useQuickAddStore()
  const { open: openSearch } = useSearchStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success("تم تسجيل الخروج")
    navigate("/login")
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      {/* Search Trigger */}
      <button
        onClick={openSearch}
        className="flex flex-1 max-w-md items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Search className="size-4" />
        <span>بحث...</span>
        <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={openQuickAdd}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">إضافة سريعة</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />
        </Button>

        <Avatar className="size-8 cursor-pointer" title="تسجيل الخروج" onClick={handleLogout}>
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            <LogOut className="size-3" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
