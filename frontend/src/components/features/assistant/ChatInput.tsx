'use client'
import { useState, KeyboardEvent } from 'react'

interface Props {
  onSend: (msg: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6 bg-canvas/65 border-t border-dark/45 flex gap-3 items-end">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Query trade database or ask for classification help..."
        rows={2}
        className="flex-1 min-h-[56px] max-h-36 resize-y bg-panel/70 border border-dark p-3 leading-relaxed focus:outline-none focus:border-2"
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="bg-dark text-canvas px-6 h-[56px] font-pixel disabled:opacity-50 hover:bg-dark/90 transition-colors border border-dark"
      >
        SEND_&gt;
      </button>
    </div>
  )
}
