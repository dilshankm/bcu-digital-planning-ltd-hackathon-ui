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

export interface TraversalPath {
  start: string
  type: string
  end: string
  [key: string]: unknown
}

export interface AskQuestionResponse {
  question?: string
  answer: string
  cypher_query?: string
  traversal_paths?: TraversalPath[]
  nodes_used?: string[]
  similar_nodes_found?: string[]
  plan?: string
  steps_taken?: number
  confidence?: number
  session_id?: string
  sources?: string[]
  refinements?: RefinementStep[]
  conversation?: ChatMessage[]
  data?: unknown
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

