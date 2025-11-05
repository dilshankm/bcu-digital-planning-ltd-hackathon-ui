export type ChatRole = 'user' | 'assistant' | 'system' | string

export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface ConversationSession {
  sessionId: string
  createdAt?: string
  updatedAt?: string
  messages: ChatMessage[]
}

