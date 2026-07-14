import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { QuickAdd } from "./QuickAdd"
import { SearchDialog } from "./SearchDialog"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <QuickAdd />
      <SearchDialog />
      <ConfirmDialog />
    </TooltipProvider>
  )
}
