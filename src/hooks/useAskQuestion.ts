import { useCallback, useEffect, useRef, useState } from 'react'

import type { AskQuestionResponse } from '@/types/ask'
import { askQuestion } from '@/services/askService'

export interface AskQuestionState {
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: AskQuestionResponse
  error?: string
}

export interface AskQuestionResult {
  ok: boolean
  data?: AskQuestionResponse
  error?: string
}

export interface UseAskQuestionOptions {
  onSuccess?: (response: AskQuestionResponse) => void
  onError?: (error: string) => void
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The request was cancelled.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export const useAskQuestion = (options: UseAskQuestionOptions = {}) => {
  const [state, setState] = useState<AskQuestionState>({ status: 'idle' })
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelOngoingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const ask = useCallback(
    async (question: string, sessionId?: string): Promise<AskQuestionResult> => {
      cancelOngoingRequest()

      const controller = new AbortController()
      abortControllerRef.current = controller

      setState({ status: 'loading' })

      try {
        const data = await askQuestion({ question, sessionId }, { signal: controller.signal })
        setState({ status: 'success', data })
        options.onSuccess?.(data)

        return { ok: true, data }
      } catch (error) {
        if (controller.signal.aborted) {
          setState({ status: 'idle' })
          return { ok: false, error: 'Request cancelled' }
        }

        const message = getErrorMessage(error)
        setState({ status: 'error', error: message })
        options.onError?.(message)

        return { ok: false, error: message }
      } finally {
        abortControllerRef.current = null
      }
    },
    [cancelOngoingRequest, options],
  )

  const reset = useCallback(() => {
    cancelOngoingRequest()
    setState({ status: 'idle' })
  }, [cancelOngoingRequest])

  useEffect(() => cancelOngoingRequest, [cancelOngoingRequest])

  return {
    state,
    ask,
    reset,
    isLoading: state.status === 'loading',
    hasError: state.status === 'error',
  }
}

