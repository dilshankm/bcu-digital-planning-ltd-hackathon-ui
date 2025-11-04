import { config } from '@/config'
import type { ConversationSession } from '@/types/session'
import { buildUnexpectedResponseError, parseResponseBody } from '@/utils/http'

export const createSession = async (): Promise<string> => {
  const endpoint = config.buildApiPath('/session')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  const { json: payload, raw, isJson } = await parseResponseBody<{ session_id?: unknown; error?: unknown }>(
    response,
  )

  if (!response.ok) {
    const message =
      (isJson && payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : response.statusText) || buildUnexpectedResponseError(raw)
    throw new Error(message)
  }

  if (isJson && payload && typeof payload === 'object' && 'session_id' in payload) {
    return String(payload.session_id)
  }

  throw new Error(buildUnexpectedResponseError(raw))
}

export const fetchSessionHistory = async (sessionId: string): Promise<ConversationSession> => {
  const endpoint = config.buildApiPath(`/session/${sessionId}`)

  const response = await fetch(endpoint)
  const { json: payload, raw, isJson } = await parseResponseBody<{ messages?: unknown; created_at?: unknown; updated_at?: unknown; error?: unknown }>(
    response,
  )

  if (!response.ok) {
    const message =
      (isJson && payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : response.statusText) || buildUnexpectedResponseError(raw)
    throw new Error(message)
  }

  if (!isJson || !payload || typeof payload !== 'object') {
    throw new Error(buildUnexpectedResponseError(raw))
  }

  const messages =
    'messages' in payload
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
      'created_at' in payload
        ? String((payload as Record<string, unknown>).created_at)
        : undefined,
    updatedAt:
      'updated_at' in payload
        ? String((payload as Record<string, unknown>).updated_at)
        : undefined,
    messages: safeMessages,
  }
}
