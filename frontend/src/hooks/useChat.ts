import { useMutation } from '@tanstack/react-query'
import { sendChatMessage, type ChatContext, type AssistantUserProfile } from '@/lib/api'

export function useChat() {
  return useMutation({
    mutationFn: ({
      message,
      context,
      userProfile,
    }: {
      message: string
      context?: ChatContext[]
      userProfile?: AssistantUserProfile
    }) => sendChatMessage(message, context, userProfile),
  })
}
