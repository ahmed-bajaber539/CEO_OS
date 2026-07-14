import { Plus, MessageSquare, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Conversation } from '../../core/types'

interface ChatSidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete?: (id: string) => void
  /** Show close button (for mobile overlay) */
  onClose?: () => void
}

/**
 * ChatSidebar — left panel showing conversation history list.
 */
export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full border-r bg-muted/20 w-64 shrink-0">
      {/* New conversation button */}
      <div className="p-3 border-b flex items-center gap-2">
        <Button
          onClick={onNew}
          variant="outline"
          className="flex-1 justify-start gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          محادثة جديدة
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">
              لا توجد محادثات سابقة. ابدأ محادثة جديدة!
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId
              return (
                <div
                  key={conv.id}
                  className="group flex items-center"
                >
                  <button
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                      'flex items-center gap-2 flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground/80',
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </button>

                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(conv.id)
                      }}
                      title="حذف المحادثة"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
