import { config } from '@/config'
import type { AskQuestionResponse } from '@/types/ask'

export interface AskQuestionParams {
  question: string
  sessionId?: string
}

export interface AskQuestionOptions {
  signal?: AbortSignal
}

const isAskQuestionResponse = (value: unknown): value is AskQuestionResponse => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return 'answer' in value && typeof (value as Record<string, unknown>).answer === 'string'
}

export const askQuestion = async (
  params: AskQuestionParams,
  options: AskQuestionOptions = {},
): Promise<AskQuestionResponse> => {
  const endpoint = config.buildApiPath('/ask')
  const payload = {
    question: params.question,
    ...(params.sessionId ? { session_id: params.sessionId } : {}),
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  let body: unknown

  try {
    body = await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Unable to parse server response: ${message}`)
  }

  if (!response.ok) {
    const errorMessage =
      (typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : null) ?? response.statusText

    throw new Error(errorMessage || 'The service returned an error')
  }

  if (!isAskQuestionResponse(body)) {
    throw new Error('Received an unexpected response format from the service')
  }

  return body
}

