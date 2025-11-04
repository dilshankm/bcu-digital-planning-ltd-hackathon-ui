import { config } from '@/config'

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

  try {
    const body = await response.json()

    if (!response.ok) {
      const message =
        (body && typeof body === 'object' && 'error' in body
          ? String((body as Record<string, unknown>).error)
          : response.statusText) || 'CSV import failed'
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
