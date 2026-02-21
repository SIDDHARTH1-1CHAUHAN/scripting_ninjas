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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6 bg-canvas border-t-2 border-dark flex gap-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Query trade database or ask for classification help..."
        className="flex-1 bg-transparent border border-dark p-4 focus:outline-none focus:border-2"
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="bg-dark text-canvas px-6 font-pixel disabled:opacity-50 hover:bg-dark/90 transition-colors"
      >
        SEND_&gt;
      </button>
    </div>
  )
}
