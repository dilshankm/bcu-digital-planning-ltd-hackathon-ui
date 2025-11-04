import { config } from '@/config'
import type { ConversationSession } from '@/types/session'

const parseJson = async (response: Response) => {
  try {
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Unable to parse server response: ${message}`)
  }
}

export const createSession = async (): Promise<string> => {
  const endpoint = config.buildApiPath('/session')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as Record<string, unknown>).error)
        : response.statusText) || 'Failed to create session'
    throw new Error(message)
  }

  if (payload && typeof payload === 'object' && 'session_id' in payload) {
    return String((payload as Record<string, unknown>).session_id)
  }

  throw new Error('Session creation response did not include a session_id')
}

export const fetchSessionHistory = async (sessionId: string): Promise<ConversationSession> => {
  const endpoint = config.buildApiPath(`/session/${sessionId}`)

  const response = await fetch(endpoint)
  const payload = await parseJson(response)

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as Record<string, unknown>).error)
        : response.statusText) || 'Failed to retrieve session history'
    throw new Error(message)
  }

  const messages =
    payload && typeof payload === 'object' && 'messages' in payload
      ? (payload as { messages: unknown }).messages
      : []

  const safeMessages = Array.isArray(messages)
    ? messages.filter((entry): entry is ConversationSession['messages'][number] =>
        entry && typeof entry === 'object' && 'content' in entry && 'role' in entry,
      )
    : []

  return {
    sessionId,
    createdAt:
      payload && typeof payload === 'object' && 'created_at' in payload
        ? String((payload as Record<string, unknown>).created_at)
        : undefined,
    updatedAt:
      payload && typeof payload === 'object' && 'updated_at' in payload
        ? String((payload as Record<string, unknown>).updated_at)
        : undefined,
    messages: safeMessages,
  }
}
