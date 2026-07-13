import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSearchStore } from "@/stores/search"
import { NAV_ITEMS } from "@/lib/constants"

export function SearchDialog() {
  const { isOpen, close } = useSearchStore()
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuery("")
    }
  }, [isOpen])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        isOpen ? close() : useSearchStore.getState().open()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [isOpen])

  const filtered = query
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : NAV_ITEMS

  const handleSelect = (path: string) => {
    navigate(path)
    close()
    setQuery("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>بحث</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 size-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن صفحة..."
            className="border-0 h-12 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-center text-muted-foreground">لا توجد نتائج</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.path}
                onClick={() => handleSelect(item.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <Search className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 py-0.5">Esc</kbd> للإغلاق
        </div>
      </DialogContent>
    </Dialog>
  )
}
