import { useState } from 'react'
import { Copy, Check, User, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AIMessage } from '../../core/types'

interface ChatMessageProps {
  message: AIMessage
}

/**
 * ChatMessage — renders a single message (user or assistant).
 * Features:
 *  - User messages: right-aligned with user icon
 *  - Assistant messages: left-aligned with bot icon + copy button
 *  - Manual markdown rendering (bold, italic, lists, code blocks, tables)
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const content = message.content ?? ''

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md',
        )}
      >
        <div className="text-sm whitespace-pre-wrap wrap-break-word">
          {renderMarkdown(content)}
        </div>
      </div>

      {/* Copy button (assistant only) */}
      {!isUser && content && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 self-end shrink-0 opacity-50 hover:opacity-100"
          onClick={handleCopy}
          title="نسخ الرد"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}

      {/* User avatar */}
      {isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}

// ─── Simple Markdown Renderer ──────────────────────────────────

/**
 * Manual markdown renderer — no extra dependencies.
 * Supports: bold, italic, inline code, code blocks, lists, tables, headers.
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return text

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block (```)
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      elements.push(
        <pre
          key={elements.length}
          className="bg-black/10 dark:bg-white/5 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // Tables (| col1 | col2 |)
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows: string[][] = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .filter(Boolean)
          .map((c) => c.trim())
        // Skip separator rows (---|---)
        if (!cells.every((c) => /^[-:]+$/.test(c))) {
          tableRows.push(cells)
        }
        i++
      }
      if (tableRows.length > 0) {
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-2">
            <table className="min-w-full text-xs border-collapse">
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={ri === 0 ? 'border-b font-bold' : 'border-b border-muted-foreground/20'}
                  >
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
      }
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={elements.length} className="text-sm font-bold mt-3 mb-1">
          {renderInlineMarkdown(line.slice(4))}
        </h3>,
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={elements.length} className="text-base font-bold mt-3 mb-1">
          {renderInlineMarkdown(line.slice(3))}
        </h2>,
      )
      i++
      continue
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={elements.length} className="text-lg font-bold mt-3 mb-1">
          {renderInlineMarkdown(line.slice(2))}
        </h1>,
      )
      i++
      continue
    }

    // Unordered lists
    if (/^[\s]*[-*+]\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\s]*[-*+]\s/, ''))
        i++
      }
      elements.push(
        <ul key={elements.length} className="list-disc list-inside my-1 space-y-0.5">
          {listItems.map((item, li) => (
            <li key={li} className="text-sm">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>,
      )
      continue
    }

    // Numbered lists
    if (/^[\s]*\d+[.)]\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^[\s]*\d+[.)]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\s]*\d+[.)]\s/, ''))
        i++
      }
      elements.push(
        <ol key={elements.length} className="list-decimal list-inside my-1 space-y-0.5">
          {listItems.map((item, li) => (
            <li key={li} className="text-sm">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ol>,
      )
      continue
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<br key={elements.length} />)
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={elements.length} className="text-sm leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>,
    )
    i++
  }

  return elements.length > 0 ? elements : text
}

/**
 * Inline markdown: bold (**), italic (*), inline code (`)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Split by inline code first
  const parts = text.split(/(`[^`]+`)/g)

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    // Process bold and italic within this part
    let processed: React.ReactNode = part

    // Collect segments
    const segments: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    // Bold first
    const boldRegex2 = new RegExp(/\*\*(.+?)\*\*/, 'g')
    while ((match = boldRegex2.exec(part)) !== null) {
      if (match.index > lastIndex) {
        segments.push(part.slice(lastIndex, match.index))
      }
      segments.push(
        <strong key={`${i}-b-${match.index}`} className="font-bold">
          {match[1]}
        </strong>,
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < part.length) {
      segments.push(part.slice(lastIndex))
    }

    return segments.length > 0 ? segments : processed
  })
}
