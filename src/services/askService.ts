import { config } from '@/config'
import type { AskQuestionResponse } from '@/types/ask'

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
  question: string,
  options: AskQuestionOptions = {},
): Promise<AskQuestionResponse> => {
  const response = await fetch(config.askEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
    signal: options.signal,
  })

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Unable to parse server response: ${message}`)
  }

  if (!response.ok) {
    const errorMessage =
      (typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as Record<string, unknown>).error)
        : null) ?? response.statusText

    throw new Error(errorMessage || 'The service returned an error')
  }

  if (!isAskQuestionResponse(payload)) {
    throw new Error('Received an unexpected response format from the service')
  }

  return payload
}

