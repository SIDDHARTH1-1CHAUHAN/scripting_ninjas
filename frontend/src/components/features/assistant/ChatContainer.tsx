'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { useChat } from '@/hooks'
import { useToast } from '@/components/ui/Toast'
import type { ChatContext, AssistantUserProfile } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'

interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
  suggestions?: string[]
}

interface ProfileState {
  company: string
  role: string
  lanes: string
  priorities: string
}

const INITIAL_SUGGESTIONS = [
  'Classify a product',
  'Calculate landed cost',
  'Check compliance',
  'Explain HS codes',
]

const ASSISTANT_PROFILE_STORAGE_KEY = 'tradeopt-assistant-profile-v1'

const EMPTY_PROFILE: ProfileState = {
  company: '',
  role: '',
  lanes: '',
  priorities: '',
}

function normalizeProfile(value: unknown): ProfileState {
  if (!value || typeof value !== 'object') {
    return EMPTY_PROFILE
  }

  const raw = value as Record<string, unknown>
  return {
    company: typeof raw.company === 'string' ? raw.company : '',
    role: typeof raw.role === 'string' ? raw.role : '',
    lanes: typeof raw.lanes === 'string' ? raw.lanes : '',
    priorities: typeof raw.priorities === 'string' ? raw.priorities : '',
  }
}

function splitCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildProfileBadge(profile: ProfileState, userName?: string): string | null {
  const parts: string[] = []
  if (profile.company.trim()) parts.push(`Company: ${profile.company.trim()}`)
  if (profile.role.trim()) parts.push(`Role: ${profile.role.trim()}`)
  if (profile.lanes.trim()) parts.push(`Lanes: ${profile.lanes.trim()}`)
  if (profile.priorities.trim()) parts.push(`Priorities: ${profile.priorities.trim()}`)
  if (userName?.trim()) parts.push(`User: ${userName.trim()}`)
  return parts.length ? parts.join(' | ') : null
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [profileHydrated, setProfileHydrated] = useState(false)
  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE)
  const [lastProfileSummary, setLastProfileSummary] = useState<string | null>(null)
  const [engineBadge, setEngineBadge] = useState<string>('ENGINE: waiting_for_first_response')
  const [profileAppliedBadge, setProfileAppliedBadge] = useState<string>('PROFILE_MODE: pending')
  const chatMutation = useChat()
  const { add } = useToast()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ASSISTANT_PROFILE_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setProfile(normalizeProfile(parsed))
      }
    } catch {
      // Ignore malformed local profile state.
    } finally {
      setProfileHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!profileHydrated) return
    window.localStorage.setItem(ASSISTANT_PROFILE_STORAGE_KEY, JSON.stringify(profile))
  }, [profile, profileHydrated])

  const hasCustomProfile = useMemo(
    () => Boolean(
      profile.company.trim()
      || profile.role.trim()
      || profile.lanes.trim()
      || profile.priorities.trim(),
    ),
    [profile],
  )

  const userProfile = useMemo<AssistantUserProfile | undefined>(() => {
    const preferredLanes = splitCommaSeparated(profile.lanes)
    const priorities = splitCommaSeparated(profile.priorities)

    const payload: AssistantUserProfile = {}
    if (user?.name?.trim()) payload.name = user.name.trim()
    if (profile.company.trim()) payload.company = profile.company.trim()
    if (profile.role.trim()) payload.role = profile.role.trim()
    if (preferredLanes.length) payload.preferred_lanes = preferredLanes
    if (priorities.length) payload.priorities = priorities

    return Object.keys(payload).length ? payload : undefined
  }, [profile, user?.name])

  const profileBadge = useMemo(
    () => buildProfileBadge(profile, user?.name),
    [profile, user?.name],
  )

  const clearProfile = useCallback(() => {
    setProfile(EMPTY_PROFILE)
    setLastProfileSummary(null)
    setProfileAppliedBadge('PROFILE_MODE: cleared')
    add('success', 'Assistant profile cleared')
  }, [add])

  const handleSend = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const conversationContext: ChatContext[] = messages
        .slice(-10)
        .map((message) => ({
          role: message.type === 'ai' ? 'assistant' : 'user',
          content: message.content,
        }))

      const response = await chatMutation.mutateAsync({
        message: content,
        context: conversationContext,
        userProfile,
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response,
        suggestions: response.suggestions,
      }

      setLastProfileSummary(response.profile_summary || profileBadge)
      setEngineBadge(
        `ENGINE: ${(response.provider || 'unknown').toUpperCase()} · ${response.model || 'n/a'} · ${response.live ? 'LIVE' : 'FALLBACK'}`,
      )
      setProfileAppliedBadge(
        response.profile_applied
          ? 'PROFILE_MODE: applied'
          : 'PROFILE_MODE: not_applied',
      )
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const fallbackText = error instanceof Error ? error.message : 'Assistant request failed'
      add('error', fallbackText)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Request failed. Please retry your query.',
          suggestions: ['TRY_AGAIN'],
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [add, chatMutation, messages, profileBadge, userProfile])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSend(suggestion)
  }, [handleSend])

  return (
    <div className="flex flex-col h-full bg-panel/70 backdrop-blur-sm">
      <div className="px-6 pt-5 pb-4 border-b border-dark/80 bg-canvas/55 space-y-3 shadow-[var(--surface-shadow)]">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="border border-dark/90 px-2 py-1 bg-panel/80">{engineBadge}</div>
          <div className="border border-dark/90 px-2 py-1 bg-panel/80">{profileAppliedBadge}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPersonalization((prev) => !prev)}
            className="focus-ring text-xs font-pixel border border-dark/90 px-3 py-2 bg-panel/80 hover:bg-dark hover:text-text-inv"
          >
            {showPersonalization ? 'HIDE_PROFILE' : 'PERSONALIZE_ASSISTANT'}
          </button>
          <button
            onClick={clearProfile}
            disabled={!hasCustomProfile}
            className="focus-ring text-xs font-pixel border border-dark/90 px-3 py-2 bg-panel/80 hover:bg-dark hover:text-text-inv disabled:opacity-40"
          >
            RESET_PROFILE
          </button>
          {(lastProfileSummary || profileBadge) && (
            <div className="text-[11px] border border-dark/90 px-2 py-1 bg-panel/90 max-w-full break-words">
              PROFILE_ACTIVE: {lastProfileSummary || profileBadge}
            </div>
          )}
        </div>

        {showPersonalization && (
          <div className="border border-dark/90 bg-panel/70 p-4 space-y-3">
            <div className="label">PERSONALIZATION PROFILE</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 min-w-0">
                <div className="label">COMPANY</div>
                <input
                  value={profile.company}
                  onChange={(event) => setProfile((prev) => ({ ...prev, company: event.target.value }))}
                  placeholder="Company name"
                  className="min-w-0 w-full bg-transparent border border-dark px-3 py-2 text-sm focus:outline-none focus:border-2"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="label">ROLE</div>
                <input
                  value={profile.role}
                  onChange={(event) => setProfile((prev) => ({ ...prev, role: event.target.value }))}
                  placeholder="Your role (e.g. Import Manager)"
                  className="min-w-0 w-full bg-transparent border border-dark px-3 py-2 text-sm focus:outline-none focus:border-2"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="label">TRADE LANES</div>
                <input
                  value={profile.lanes}
                  onChange={(event) => setProfile((prev) => ({ ...prev, lanes: event.target.value }))}
                  placeholder="IN->US, CN->US, VN->US"
                  className="min-w-0 w-full bg-transparent border border-dark px-3 py-2 text-sm focus:outline-none focus:border-2"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="label">PRIORITIES</div>
                <input
                  value={profile.priorities}
                  onChange={(event) => setProfile((prev) => ({ ...prev, priorities: event.target.value }))}
                  placeholder="cost, speed, compliance"
                  className="min-w-0 w-full bg-transparent border border-dark px-3 py-2 text-sm focus:outline-none focus:border-2"
                />
              </div>
            </div>
            <div className="text-xs opacity-70">
              This profile is saved locally and appended to assistant requests when relevant.
            </div>
          </div>
        )}
      </div>

      <MessageList
        messages={messages}
        isTyping={isTyping}
        onSuggestionClick={handleSuggestionClick}
      />
      {messages.length === 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {INITIAL_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="border border-dark px-4 py-2 text-sm hover:bg-dark hover:text-text-inv transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  )
}
