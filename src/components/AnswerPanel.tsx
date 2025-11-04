import type { AskQuestionResponse } from '@/types/ask'
import CypherQueryDisplay from './CypherQueryDisplay'
import TraversalPathsDisplay from './TraversalPathsDisplay'
import ExplainabilityPanel from './ExplainabilityPanel'
import RefinementTimeline from './RefinementTimeline'

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

export const AnswerPanel = ({ response }: AnswerPanelProps) => {
  return (
    <section className="ask-answer" aria-live="polite">
      <h2 className="govuk-heading-m">Answer</h2>
      <div className="ask-answer__content">{response.answer}</div>
      {renderSources(response.sources)}

      {/* Cypher Query Display */}
      {response.cypher_query && <CypherQueryDisplay query={response.cypher_query} />}

      {/* Traversal Paths & Graph Dependencies */}
      {response.traversal_paths && response.traversal_paths.length > 0 && (
        <TraversalPathsDisplay paths={response.traversal_paths} nodesUsed={response.nodes_used} />
      )}

      {/* Explainability Panel */}
      <ExplainabilityPanel
        stepsTaken={response.steps_taken}
        confidence={response.confidence}
        plan={response.plan}
        nodesUsed={response.nodes_used}
        similarNodesFound={response.similar_nodes_found}
      />

      {/* Refinements Timeline */}
      {Array.isArray(response.refinements) && response.refinements.length > 0 && (
        <RefinementTimeline steps={response.refinements} />
      )}
    </section>
  )
}

export default AnswerPanel

