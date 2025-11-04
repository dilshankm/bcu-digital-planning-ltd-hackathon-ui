import { config } from '@/config'
import { buildUnexpectedResponseError, parseResponseBody } from '@/utils/http'

export interface CsvImportOptions {
  targetLabel?: string
  relationshipType?: string
}

export const importCsv = async (file: File, options: CsvImportOptions = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  if (options.targetLabel) {
    formData.append('target_label', options.targetLabel)
  }
  if (options.relationshipType) {
    formData.append('relationship_type', options.relationshipType)
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
