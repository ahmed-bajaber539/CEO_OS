import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './ChatMessage'
import { ThinkingIndicator } from './ThinkingIndicator'
import { SuggestedActions } from './SuggestedActions'
import type { AIMessage } from '../../core/types'

interface ChatAreaProps {
  messages: AIMessage[]
  isStreaming: boolean
  streamingContent: string
  suggestedActions: string[]
  onSelectAction: (action: string) => void
}

/**
 * ChatArea — the main message list with auto-scroll and streaming support.
 * Shows the live streaming content as a temporary assistant message.
 */
export function ChatArea({
  messages,
  isStreaming,
  streamingContent,
  suggestedActions,
  onSelectAction,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const hasContent = messages.length > 0 || streamingContent

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      {!hasContent ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4">
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-lg font-semibold mb-2">المدير التنفيذي</h2>
          <p className="text-sm text-center max-w-md">
            مساعدك التنفيذي الشامل. يمكنني مساعدتك في التخطيط، المراجعة، تحليل البيانات،
            واتخاذ القرارات. ابدأ بطرح سؤال أو اختر إحدى الاقتراحات.
          </p>
        </div>
      ) : (
        <div className="flex flex-col min-h-full">
          {/* Rendered messages */}
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
            />
          ))}

          {/* Streaming content as temporary assistant message */}
          {isStreaming && streamingContent && (
            <ChatMessage
              message={{ role: 'assistant', content: streamingContent }}
            />
          )}

          {/* Thinking indicator */}
          {isStreaming && !streamingContent && <ThinkingIndicator />}

          {/* Suggested actions (after complete response) */}
          {!isStreaming && suggestedActions.length > 0 && (
            <SuggestedActions
              actions={suggestedActions}
              onSelect={onSelectAction}
            />
          )}

          {/* Auto-scroll anchor */}
          <div ref={bottomRef} />
        </div>
      )}
    </ScrollArea>
  )
}
