import { useState } from 'react'
import { PanelLeft, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChat } from './hooks/useChat'
import { ChatSidebar } from './components/ChatSidebar'
import { ChatArea } from './components/ChatArea'
import { ChatInput } from './components/ChatInput'
import { ContextPanel } from './components/ContextPanel'

/**
 * ExecutiveAIPage — 3-panel layout for the Executive AI Chat experience.
 *
 * Layout (desktop):
 *   [ChatSidebar] | [ChatArea + ChatInput] | [ContextPanel]
 *
 * Layout (mobile):
 *   [ChatArea + ChatInput] with toggle buttons to show sidebar/context as overlays
 */
export default function ExecutiveAIPage() {
  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    streamingContent,
    suggestedActions,
    currentIntent,
    sendMessage,
    stopGeneration,
    switchConversation,
    newConversation,
    clearConversation,
    deleteConversation,
  } = useChat()

  const [showSidebar, setShowSidebar] = useState(false)
  const [showContext, setShowContext] = useState(false)

  function handleSelectAction(action: string) {
    sendMessage(action)
  }

  function handleSelectConversation(id: string) {
    switchConversation(id)
    setShowSidebar(false)
  }

  return (
    <div className="flex h-full relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={switchConversation}
          onNew={newConversation}
          onDelete={deleteConversation}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="fixed inset-y-0 right-0 w-72 bg-background border-l shadow-lg z-50">
            <ChatSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={handleSelectConversation}
              onNew={() => { newConversation(); setShowSidebar(false) }}
              onDelete={deleteConversation}
            />
          </div>
        </div>
      )}

      {/* Center: Chat Area + Input */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile toggle bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <PanelLeft className="size-4" />
            <span className="text-xs">المحادثات</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowContext(!showContext)}
          >
            <span className="text-xs">حالة النظام</span>
            <PanelRight className="size-4" />
          </Button>
        </div>

        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          suggestedActions={suggestedActions}
          onSelectAction={handleSelectAction}
        />
        <ChatInput
          onSend={sendMessage}
          onStop={stopGeneration}
          isStreaming={isStreaming}
        />
      </div>

      {/* Desktop Context Panel */}
      <div className="hidden lg:block">
        <ContextPanel
          intent={
            currentIntent
              ? {
                  capability: currentIntent.capability,
                  confidence: currentIntent.confidence,
                }
              : null
          }
        />
      </div>

      {/* Mobile Context Overlay */}
      {showContext && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowContext(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-background border-r shadow-lg z-50">
            <div className="flex items-center justify-between p-3 border-b">
              <Button variant="ghost" size="sm" onClick={() => setShowContext(false)}>
                ✕
              </Button>
            </div>
            <ContextPanel
              intent={
                currentIntent
                  ? {
                      capability: currentIntent.capability,
                      confidence: currentIntent.confidence,
                    }
                  : null
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
