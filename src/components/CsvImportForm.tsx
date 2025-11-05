import { useState } from 'react'

import { importCsv } from '@/services/importService'

const serialise = (value: unknown) => JSON.stringify(value, null, 2) ?? ''

export const CsvImportForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [targetLabel, setTargetLabel] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [properties, setProperties] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<unknown>(null)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (!file) {
      setStatus('error')
      setMessage('Choose a CSV file before importing.')
      return
    }

    setStatus('loading')
    setMessage('Importing data…')

    try {
      const response = await importCsv(file, {
        nodeType: targetLabel || undefined,
        relationshipType: relationshipType || undefined,
        properties: properties || undefined,
      })
      setStatus('success')
      setMessage('CSV imported successfully. Review the server response below.')
      setResult(response)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import CSV file'
      setStatus('error')
      setMessage(message)
      setResult(null)
    }
  }

  const hasResult = result !== null && result !== undefined

  return (
    <section className="csv-import govuk-!-margin-top-6">
      <h2 className="govuk-heading-m">Extend schema with CSV data</h2>
      <p className="govuk-body">
        Upload additional data to expand the knowledge graph. Provide a CSV file and optional
        metadata to control how new nodes or relationships are created.
      </p>

      <form className="govuk-form-group" onSubmit={handleSubmit} noValidate>
        <label className="govuk-label" htmlFor="csv-file">
          CSV file
        </label>
        <input
          className="govuk-file-upload"
          id="csv-file"
          name="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const selectedFile = event.currentTarget.files?.[0] ?? null
            setFile(selectedFile)
          }}
        />

        <label className="govuk-label govuk-!-margin-top-3" htmlFor="target-label">
          Node type (optional)
        </label>
        <input
          className="govuk-input govuk-!-width-one-half"
          id="target-label"
          name="target-label"
          value={targetLabel}
          onChange={(event) => setTargetLabel(event.target.value)}
          placeholder="Medication"
        />

        <label className="govuk-label govuk-!-margin-top-3" htmlFor="relationship-type">
          Relationship type (optional)
        </label>
        <input
          className="govuk-input govuk-!-width-one-half"
          id="relationship-type"
          name="relationship-type"
          value={relationshipType}
          onChange={(event) => setRelationshipType(event.target.value)}
          placeholder="ASSOCIATED_WITH"
        />

        <label className="govuk-label govuk-!-margin-top-3" htmlFor="properties">
          Properties (optional, comma-separated)
        </label>
        <input
          className="govuk-input govuk-!-width-one-half"
          id="properties"
          name="properties"
          value={properties}
          onChange={(event) => setProperties(event.target.value)}
          placeholder="id,name,dosage"
        />

        <button className="govuk-button govuk-!-margin-top-3" type="submit" disabled={status === 'loading'}>
          Import CSV
        </button>
      </form>

      {status !== 'idle' && (
        <div
          className={`csv-import__status ${
            status === 'error'
              ? 'csv-import__status--error'
              : status === 'success'
                ? 'csv-import__status--success'
                : 'csv-import__status--info'
          }`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          <p className="govuk-body">{message}</p>
        </div>
      )}

      {hasResult && (
        <details className="govuk-details govuk-!-margin-top-3" open>
          <summary className="govuk-details__summary">
            <span className="govuk-details__summary-text">Import response</span>
          </summary>
          <div className="govuk-details__text">
            <pre className="csv-import__code">{serialise(result)}</pre>
          </div>
        </details>
      )}
    </section>
  )
}

export default CsvImportForm
