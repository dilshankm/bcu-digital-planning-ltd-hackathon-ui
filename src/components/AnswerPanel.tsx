import type { AskQuestionResponse } from '@/types/ask'

interface AnswerPanelProps {
  response: AskQuestionResponse
}

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

export const AnswerPanel = ({ response }: AnswerPanelProps) => (
  <section className="ask-answer" aria-live="polite">
    <h2 className="govuk-heading-m">Answer</h2>
    <div className="ask-answer__content">
      {response.answer}
    </div>
    {renderSources(response.sources)}
  </section>
)

export default AnswerPanel

