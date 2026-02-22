'use client'
import { useRef, useEffect } from 'react'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'

interface MessageData {
  id: string
  type: 'ai' | 'user'
  content: string
  suggestions?: string[]
}

interface Props {
  messages: MessageData[]
  isTyping: boolean
  onSuggestionClick: (s: string) => void
}

export function MessageList({ messages, isTyping, onSuggestionClick }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto p-6 flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 border border-dark/40 bg-canvas/45 p-8 shadow-[var(--surface-shadow)]">
          <div className="w-14 h-14 rounded-full border border-dark flex items-center justify-center font-pixel text-lg">
            AI
          </div>
          <div className="font-pixel text-xl tracking-wide">TRADE_ASSISTANT</div>
          <p className="text-sm opacity-80 max-w-md">
            Ask about HS codes, landed cost, compliance checks, routes, and import documentation.
          </p>
        </div>
      )}
      {messages.map(msg => (
        <Message
          key={msg.id}
          type={msg.type}
          content={msg.content}
          suggestions={msg.suggestions}
          onSuggestionClick={onSuggestionClick}
        />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
