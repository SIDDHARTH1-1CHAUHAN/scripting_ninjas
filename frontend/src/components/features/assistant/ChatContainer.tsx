'use client'
import { useState, useCallback } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
  suggestions?: string[]
}

const INITIAL_SUGGESTIONS = [
  'Classify a product',
  'Calculate landed cost',
  'Check compliance',
  'Explain HS codes'
]

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
    }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Mock API response - will be replaced with real API
    await new Promise(r => setTimeout(r, 1500))

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Processing your query: "${content}"\n\nBased on the information provided, I recommend checking the tariff schedule for relevant HS codes.\n\n**Key points:**\n- Verify the product's primary function\n- Check Section 301 tariff applicability\n- Ensure required documentation is ready`,
      suggestions: ['VIEW_DETAILS', 'CALCULATE_COST', 'CHECK_COMPLIANCE']
    }

    setMessages(prev => [...prev, aiMessage])
    setIsTyping(false)
  }, [])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSend(suggestion)
  }, [handleSend])

  return (
    <div className="flex flex-col h-full bg-panel">
      <MessageList
        messages={messages}
        isTyping={isTyping}
        onSuggestionClick={handleSuggestionClick}
      />
      {messages.length === 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {INITIAL_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="border border-dark px-4 py-2 text-sm hover:bg-dark hover:text-canvas transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  )
}
