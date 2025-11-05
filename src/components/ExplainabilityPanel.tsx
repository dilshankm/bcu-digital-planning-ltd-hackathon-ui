interface ExplainabilityPanelProps {
  stepsTaken?: number
  confidence?: number
  plan?: string
  nodesUsed?: string[]
  similarNodesFound?: string[]
}

export const ExplainabilityPanel = ({
  stepsTaken,
  confidence,
  plan,
  nodesUsed,
  similarNodesFound,
}: ExplainabilityPanelProps) => {
  const hasData =
    stepsTaken !== undefined ||
    confidence !== undefined ||
    plan ||
    (nodesUsed && nodesUsed.length > 0) ||
    (similarNodesFound && similarNodesFound.length > 0)

  if (!hasData) {
    return null
  }

  const confidencePercentage = confidence ? Math.round(confidence * 100) : null
  const confidenceClass =
    confidencePercentage !== null
      ? confidencePercentage >= 80
        ? 'explainability-panel__confidence--high'
        : confidencePercentage >= 60
          ? 'explainability-panel__confidence--medium'
          : 'explainability-panel__confidence--low'
      : ''

  return (
    <details className="govuk-details explainability-panel govuk-!-margin-top-4" open>
      <summary className="govuk-details__summary">
        <span className="govuk-details__summary-text">Explainability & Execution Details</span>
      </summary>
      <div className="govuk-details__text">
        <dl className="explainability-panel__list">
          {stepsTaken !== undefined && (
            <>
              <dt className="explainability-panel__term">Execution Steps</dt>
              <dd className="explainability-panel__definition">{stepsTaken}</dd>
            </>
          )}

          {confidencePercentage !== null && (
            <>
              <dt className="explainability-panel__term">Confidence</dt>
              <dd className={`explainability-panel__definition ${confidenceClass}`}>
                <strong>{confidencePercentage}%</strong>
                {confidencePercentage >= 80 && ' (High)'}
                {confidencePercentage >= 60 && confidencePercentage < 80 && ' (Medium)'}
                {confidencePercentage < 60 && ' (Low)'}
              </dd>
            </>
          )}

          {nodesUsed && nodesUsed.length > 0 && (
            <>
              <dt className="explainability-panel__term">Nodes Explored</dt>
              <dd className="explainability-panel__definition">{nodesUsed.length}</dd>
            </>
          )}

          {similarNodesFound && similarNodesFound.length > 0 && (
            <>
              <dt className="explainability-panel__term">Similar Nodes Found</dt>
              <dd className="explainability-panel__definition">{similarNodesFound.length}</dd>
            </>
          )}

          {plan && (
            <>
              <dt className="explainability-panel__term">Execution Plan</dt>
              <dd className="explainability-panel__definition">
                <code className="explainability-panel__plan">{plan}</code>
              </dd>
            </>
          )}
        </dl>
      </div>
    </details>
  )
}

export default ExplainabilityPanel


