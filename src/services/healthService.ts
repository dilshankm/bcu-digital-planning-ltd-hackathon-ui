import { config } from '@/config'
import { buildUnexpectedResponseError, parseResponseBody } from '@/utils/http'

export interface HealthCheckResponse {
  status: string
  service?: string
}

export const checkHealth = async (): Promise<HealthCheckResponse> => {
  const endpoint = config.buildApiPath('/')
  
  const response = await fetch(endpoint)
  const { json, raw, isJson } = await parseResponseBody<HealthCheckResponse>(response)

  if (!response.ok) {
    const message =
      (isJson && json && typeof json === 'object' && 'error' in json
        ? String((json as Record<string, unknown>).error)
        : response.statusText) || buildUnexpectedResponseError(raw)
    throw new Error(message)
  }

  if (!isJson || !json || typeof json !== 'object') {
    throw new Error(buildUnexpectedResponseError(raw))
  }

  return json as HealthCheckResponse
}

export const checkSessionHealth = async (): Promise<HealthCheckResponse> => {
  const endpoint = config.buildApiPath('/session/health')
  
  const response = await fetch(endpoint)
  const { json, raw, isJson } = await parseResponseBody<HealthCheckResponse>(response)

  if (!response.ok) {
    const message =
      (isJson && json && typeof json === 'object' && 'error' in json
        ? String((json as Record<string, unknown>).error)
        : response.statusText) || buildUnexpectedResponseError(raw)
    throw new Error(message)
  }

  if (!isJson || !json || typeof json !== 'object') {
    throw new Error(buildUnexpectedResponseError(raw))
  }

  return json as HealthCheckResponse
}

