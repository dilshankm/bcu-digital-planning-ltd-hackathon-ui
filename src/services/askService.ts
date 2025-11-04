import { config } from '@/config'
import type { AskQuestionResponse } from '@/types/ask'
import { buildUnexpectedResponseError, parseResponseBody } from '@/utils/http'

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

  const { json: body, raw, isJson } = await parseResponseBody<AskQuestionResponse>(response)

  if (!response.ok) {
    const errorMessage =
      (isJson && body && typeof body === 'object' && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : null) ?? response.statusText ?? buildUnexpectedResponseError(raw)

    throw new Error(errorMessage || 'The service returned an error')
  }

  if (!isJson || !isAskQuestionResponse(body)) {
    throw new Error(buildUnexpectedResponseError(raw))
  }

  return body
}

