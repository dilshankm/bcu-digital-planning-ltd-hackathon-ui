import { useState } from 'react'

interface CypherQueryDisplayProps {
  query: string
}

export const CypherQueryDisplay = ({ query }: CypherQueryDisplayProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(query)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="cypher-query-display govuk-!-margin-top-4">
      <div className="cypher-query-display__header">
        <h3 className="govuk-heading-s govuk-!-margin-bottom-2">Generated Cypher Query</h3>
        <button
          className="govuk-button govuk-button--secondary cypher-query-display__copy-btn"
          type="button"
          onClick={handleCopy}
          aria-label="Copy Cypher query to clipboard"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="cypher-query-display__code">
        <code>{query}</code>
      </pre>
    </div>
  )
}

export default CypherQueryDisplay


