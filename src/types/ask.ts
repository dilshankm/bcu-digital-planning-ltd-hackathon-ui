import type { ChatMessage } from './session'

export interface AskQuestionRequest {
  question: string
  session_id?: string
}

export interface RefinementStep {
  query: string
  reason?: string
  resultCount?: number
}

export interface AskQuestionResponse {
  answer: string
  sources?: string[]
  refinements?: RefinementStep[]
  conversation?: ChatMessage[]
  data?: unknown
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

