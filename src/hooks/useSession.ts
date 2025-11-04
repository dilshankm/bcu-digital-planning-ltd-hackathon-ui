import { useCallback, useRef, useState } from 'react'

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
  
  // Use a ref to always have access to the current sessionId
  const sessionIdRef = useRef<string | null>(null)

  const loadHistory = useCallback(async (sessionId: string) => {
    setState((current) => ({ ...current, isLoading: true, error: undefined }))
    try {
      console.log('Fetching history for session:', sessionId)
      const result = await fetchSessionHistory(sessionId)
      console.log('Fetched history result:', result)
      console.log('Messages count:', result.messages?.length || 0)
      sessionIdRef.current = sessionId
      setState((current) => ({
        ...current,
        sessionId,
        history: result.messages,
        isLoading: false,
        error: undefined,
      }))
    } catch (error) {
      console.error('Error loading history:', error)
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
    // Use the ref to get the current sessionId
    const currentSessionId = sessionIdRef.current
    console.log('refreshHistory called, sessionId:', currentSessionId)
    if (!currentSessionId) {
      console.log('No session ID available, skipping refresh')
      return
    }

    console.log('Loading history for session:', currentSessionId)
    await loadHistory(currentSessionId)
    console.log('History loaded')
  }, [loadHistory])

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
