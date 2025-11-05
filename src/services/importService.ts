import { config } from '@/config'
import { buildUnexpectedResponseError, parseResponseBody } from '@/utils/http'

export interface CsvImportOptions {
  targetLabel?: string // Legacy alias
  nodeType?: string // Backend parameter name
  relationshipType?: string
  properties?: string // Comma-separated list of property names
}

export const importCsv = async (file: File, options: CsvImportOptions = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  // Use nodeType if provided, otherwise fall back to targetLabel
  const nodeType = options.nodeType || options.targetLabel
  if (nodeType) {
    formData.append('node_type', nodeType)
  }
  
  if (options.relationshipType) {
    formData.append('relationship_type', options.relationshipType)
  }
  
  if (options.properties) {
    formData.append('properties', options.properties)
  }

  const endpoint = config.buildApiPath('/import/csv')

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

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
