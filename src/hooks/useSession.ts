import { useCallback, useState } from 'react'

import { createSession, fetchSessionHistory } from '@/services/sessionService'
import type { ConversationSession } from '@/types/session'

interface UseSessionState {
  sessionId: string | null
  history: ConversationSession['messages']
  isLoading: boolean
  error?: string
}

export const useSession = () => {
  const [state, setState] = useState<UseSessionState>({
    sessionId: null,
    history: [],
    isLoading: false,
  })

  const loadHistory = useCallback(async (sessionId: string) => {
    setState((current) => ({ ...current, isLoading: true, error: undefined }))
    try {
      const result = await fetchSessionHistory(sessionId)
      setState((current) => ({
        ...current,
        sessionId,
        history: result.messages,
        isLoading: false,
        error: undefined,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load session history'
      setState((current) => ({
        ...current,
        sessionId,
        history: [],
        isLoading: false,
        error: message,
      }))
    }
  }, [])

  const initialiseSession = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: undefined }))

    try {
      const id = await createSession()
      await loadHistory(id)
      return id
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start a session'
      setState((current) => ({
        ...current,
        isLoading: false,
        error: message,
      }))
      return null
    }
  }, [loadHistory])

  const refreshHistory = useCallback(async () => {
    if (!state.sessionId) {
      return
    }

    await loadHistory(state.sessionId)
  }, [loadHistory, state.sessionId])

  return {
    sessionId: state.sessionId,
    history: state.history,
    isLoading: state.isLoading,
    error: state.error,
    refreshHistory,
    startNewSession: initialiseSession,
    setHistory: (messages: ConversationSession['messages']) =>
      setState((current) => ({ ...current, history: messages })),
  }
}

export type UseSessionReturn = ReturnType<typeof useSession>
