import type { RefinementStep } from '@/types/ask'

interface RefinementTimelineProps {
  steps: RefinementStep[]
}

export const RefinementTimeline = ({ steps }: RefinementTimelineProps) => {
  if (!steps.length) {
    return null
  }

  return (
    <section className="refinement-timeline govuk-!-margin-top-5" aria-label="Query refinement steps">
      <h3 className="govuk-heading-s">Query refinement</h3>
      <ol className="govuk-list refinement-timeline__list">
        {steps.map((step, index) => (
          <li key={`${step.query}-${index}`} className="refinement-timeline__item">
            <div className="refinement-timeline__badge" aria-hidden="true">
              {index + 1}
            </div>
            <div className="refinement-timeline__details">
              <pre className="refinement-timeline__query" aria-label={`Refined query ${index + 1}`}>
{step.query}
              </pre>
              {step.reason && <p className="govuk-body-s refinement-timeline__reason">{step.reason}</p>}
              {typeof step.resultCount === 'number' && (
                <p className="govuk-body-s govuk-!-font-weight-bold">
                  Result count: {step.resultCount}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default RefinementTimeline

