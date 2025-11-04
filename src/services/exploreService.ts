import { config } from '@/config'
import { buildUnexpectedResponseError, parseResponseBody } from '@/utils/http'

const handleResponse = async (response: Response) => {
  const { json, raw, isJson } = await parseResponseBody(response)

  if (!response.ok) {
    const message =
      (isJson && json && typeof json === 'object' && 'error' in json
        ? String((json as Record<string, unknown>).error)
        : response.statusText) || buildUnexpectedResponseError(raw)
    throw new Error(message)
  }

  if (!isJson) {
    throw new Error(buildUnexpectedResponseError(raw))
  }

  return json
}

const buildQueryString = (params: Record<string, unknown>) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

export const fetchNodes = async (params: {
  label?: string
  limit?: number
  skip?: number
} = {}) => {
  const query = buildQueryString(params)
  const endpoint = config.buildApiPath(query ? `/explore/nodes?${query}` : '/explore/nodes')

  return handleResponse(await fetch(endpoint))
}

export const fetchNodeDetail = async (nodeId: string) => {
  const endpoint = config.buildApiPath(`/explore/node/${encodeURIComponent(nodeId)}`)
  return handleResponse(await fetch(endpoint))
}

export const fetchRelationships = async (params: {
  type?: string
  limit?: number
} = {}) => {
  const query = buildQueryString(params)
  const endpoint = config.buildApiPath(
    query ? `/explore/relationships?${query}` : '/explore/relationships',
  )
  return handleResponse(await fetch(endpoint))
}

export const fetchSchema = async () => {
  const endpoint = config.buildApiPath('/schema')
  return handleResponse(await fetch(endpoint))
}
