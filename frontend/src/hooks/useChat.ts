import { useMutation } from '@tanstack/react-query'
import { sendChatMessage } from '@/lib/api'

interface ChatContext {
  role: string
  content: string
}

export function useChat() {
  return useMutation({
    mutationFn: ({ message, context }: { message: string; context?: ChatContext[] }) =>
      sendChatMessage(message, context),
  })
}
