import { config } from '@/config'

const parseResponse = async (response: Response) => {
  try {
    const body = await response.json()
    if (!response.ok) {
      const message =
        (body && typeof body === 'object' && 'error' in body
          ? String((body as Record<string, unknown>).error)
          : response.statusText) || 'Request failed'
      throw new Error(message)
    }

    return body
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unable to parse server response')
  }
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

  return parseResponse(await fetch(endpoint))
}

export const fetchNodeDetail = async (nodeId: string) => {
  const endpoint = config.buildApiPath(`/explore/node/${encodeURIComponent(nodeId)}`)
  return parseResponse(await fetch(endpoint))
}

export const fetchRelationships = async (params: {
  type?: string
  limit?: number
} = {}) => {
  const query = buildQueryString(params)
  const endpoint = config.buildApiPath(
    query ? `/explore/relationships?${query}` : '/explore/relationships',
  )
  return parseResponse(await fetch(endpoint))
}

export const fetchSchema = async () => {
  const endpoint = config.buildApiPath('/schema')
  return parseResponse(await fetch(endpoint))
}
