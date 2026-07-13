import { useChat } from './hooks/useChat'
import { ChatSidebar } from './components/ChatSidebar'
import { ChatArea } from './components/ChatArea'
import { ChatInput } from './components/ChatInput'
import { ContextPanel } from './components/ContextPanel'

/**
 * ExecutiveAIPage — 3-panel layout for the Executive AI Chat experience.
 *
 * Layout:
 *   [ChatSidebar] | [ChatArea + ChatInput] | [ContextPanel]
 *
 * This is one consumer of the AI Core Layer. Other pages can consume
 * the Core directly for inline AI features (future).
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

  function handleSelectAction(action: string) {
    sendMessage(action)
  }

  return (
    <div className="flex h-full">
      {/* Left: Conversation History */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={switchConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
      />

      {/* Center: Chat Area + Input */}
      <div className="flex flex-col flex-1 min-w-0">
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

      {/* Right: Context Panel */}
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
  )
}
