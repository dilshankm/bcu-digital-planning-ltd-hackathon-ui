const SNIPPET_LENGTH = 220

const buildSnippet = (raw: string) => {
  const trimmed = raw.replace(/\s+/g, ' ').trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.length > SNIPPET_LENGTH ? `${trimmed.slice(0, SNIPPET_LENGTH)}…` : trimmed
}

export const buildUnexpectedResponseError = (raw: string) => {
  const snippet = buildSnippet(raw)
  return snippet ? `Unexpected response format: ${snippet}` : 'Unexpected empty response from the service'
}

export interface ParsedResponseBody<T = unknown> {
  json: T | undefined
  raw: string
  isJson: boolean
}

export const parseResponseBody = async <T = unknown>(response: Response): Promise<ParsedResponseBody<T>> => {
  const raw = await response.text()

  if (!raw) {
    return { raw: '', json: undefined, isJson: false }
  }

  try {
    return {
      raw,
      json: JSON.parse(raw) as T,
      isJson: true,
    }
  } catch {
    return {
      raw,
      json: undefined,
      isJson: false,
    }
  }
}

