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
  node_type?: string // Backend parameter name
  limit?: number
  skip?: number
} = {}) => {
  // Map 'label' to 'node_type' for backend compatibility
  const backendParams: Record<string, unknown> = {
    ...params,
  }
  if (backendParams.label && !backendParams.node_type) {
    backendParams.node_type = backendParams.label
    delete backendParams.label
  }
  
  const query = buildQueryString(backendParams)
  const endpoint = config.buildApiPath(query ? `/explore/nodes?${query}` : '/explore/nodes')

  return handleResponse(await fetch(endpoint))
}

export const fetchStats = async () => {
  const endpoint = config.buildApiPath('/explore/stats')
  return handleResponse(await fetch(endpoint))
}

export const fetchNodeDetail = async (nodeId: string, depth: number = 1) => {
  const endpoint = config.buildApiPath(`/explore/node/${encodeURIComponent(nodeId)}?depth=${depth}`)
  return handleResponse(await fetch(endpoint))
}

export const fetchRelationships = async (params: {
  type?: string
  rel_type?: string // Backend parameter name
  limit?: number
  skip?: number // Pagination support
} = {}) => {
  // Map 'type' to 'rel_type' for backend compatibility
  const backendParams: Record<string, unknown> = {
    ...params,
  }
  if (backendParams.type && !backendParams.rel_type) {
    backendParams.rel_type = backendParams.type
    delete backendParams.type
  }
  
  const query = buildQueryString(backendParams)
  const endpoint = config.buildApiPath(
    query ? `/explore/relationships?${query}` : '/explore/relationships',
  )
  return handleResponse(await fetch(endpoint))
}

export const fetchSchema = async () => {
  const endpoint = config.buildApiPath('/schema')
  return handleResponse(await fetch(endpoint))
}
