import type { AskQuestionResponse } from '@/types/ask'

import RefinementTimeline from './RefinementTimeline'

interface AnswerPanelProps {
  response: AskQuestionResponse
}

const serialise = (value: unknown) => JSON.stringify(value, null, 2) ?? ''

const renderSources = (sources?: unknown) => {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null
  }

  const items = sources.filter((item): item is string => typeof item === 'string')

  if (items.length === 0) {
    return null
  }

  return (
    <div className="govuk-!-margin-top-4">
      <h3 className="govuk-heading-s govuk-!-margin-bottom-2">Sources</h3>
      <ul className="govuk-list govuk-list--bullet">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export const AnswerPanel = ({ response }: AnswerPanelProps) => {
  const hasData = response.data !== undefined && response.data !== null
  const hasMetadata = response.metadata !== undefined && response.metadata !== null
  const additionalEntries = Object.entries(response).filter(
    ([key]) => !['answer', 'sources', 'refinements', 'data', 'metadata'].includes(key),
  )

  const showDetail = hasData || hasMetadata || additionalEntries.length > 0

  return (
    <section className="ask-answer" aria-live="polite">
      <h2 className="govuk-heading-m">Answer</h2>
      <div className="ask-answer__content">
        {response.answer}
      </div>
      {renderSources(response.sources)}
      {Array.isArray(response.refinements) && response.refinements.length > 0 && (
        <RefinementTimeline steps={response.refinements} />
      )}

      {showDetail && (
        <details className="govuk-details govuk-!-margin-top-4" open>
          <summary className="govuk-details__summary">
            <span className="govuk-details__summary-text">More detail</span>
          </summary>
          <div className="govuk-details__text ask-answer__details">
            {hasData && (
              <div className="ask-answer__details-block">
                <h4 className="govuk-heading-s">Structured data</h4>
                <pre className="ask-answer__code-block">{serialise(response.data)}</pre>
              </div>
            )}
            {hasMetadata && (
              <div className="ask-answer__details-block">
                <h4 className="govuk-heading-s">Metadata</h4>
                <pre className="ask-answer__code-block">{serialise(response.metadata)}</pre>
              </div>
            )}
            {additionalEntries.map(([key, value]) => (
              <div className="ask-answer__details-block" key={key}>
                <h4 className="govuk-heading-s">{key}</h4>
                <pre className="ask-answer__code-block">{serialise(value)}</pre>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}

export default AnswerPanel

