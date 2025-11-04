import { useCallback, useMemo, useState } from 'react'

import {
  fetchNodeDetail,
  fetchNodes,
  fetchRelationships,
  fetchSchema,
} from '@/services/exploreService'
import GraphCanvas from '@/components/GraphCanvas'
import SchemaSummary from '@/components/SchemaSummary'
import { normaliseGraphData } from '@/utils/graphNormaliser'

type ExplorerTab = 'nodes' | 'relationships' | 'schema'

const stringify = (value: unknown) => JSON.stringify(value, null, 2) ?? ''
const hasValue = (value: unknown): boolean => value !== undefined && value !== null

export const GraphExplorer = () => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('nodes')
  const [nodeLabel, setNodeLabel] = useState('Patient')
  const [nodeLimit, setNodeLimit] = useState(10)
  const [nodeResults, setNodeResults] = useState<unknown>(null)
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [nodeDetail, setNodeDetail] = useState<unknown>(null)
  const [relationshipType, setRelationshipType] = useState('')
  const [relationshipResults, setRelationshipResults] = useState<unknown>(null)
  const [schema, setSchema] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nodeGraph = useMemo(() => normaliseGraphData(nodeResults), [nodeResults])
  const nodeDetailGraph = useMemo(() => normaliseGraphData(nodeDetail), [nodeDetail])
  const relationshipGraph = useMemo(() => normaliseGraphData(relationshipResults), [relationshipResults])

  const runSafely = useCallback(async (action: () => Promise<void>) => {
    setIsLoading(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFetchNodes = useCallback(() => {
    void runSafely(async () => {
      const results = await fetchNodes({ label: nodeLabel || undefined, limit: nodeLimit })
      setNodeResults(results)
    })
  }, [nodeLabel, nodeLimit, runSafely])

  const handleFetchNodeDetail = useCallback(() => {
    if (!selectedNodeId) {
      setError('Enter a node identifier to explore its neighbours.')
      return
    }

    void runSafely(async () => {
      const detail = await fetchNodeDetail(selectedNodeId)
      setNodeDetail(detail)
    })
  }, [runSafely, selectedNodeId])

  const handleFetchRelationships = useCallback(() => {
    void runSafely(async () => {
      const results = await fetchRelationships({ type: relationshipType || undefined })
      setRelationshipResults(results)
    })
  }, [relationshipType, runSafely])

  const handleFetchSchema = useCallback(() => {
    void runSafely(async () => {
      const result = await fetchSchema()
      setSchema(result)
    })
  }, [runSafely])

  return (
    <section className="graph-explorer govuk-!-margin-top-6">
      <h2 className="govuk-heading-m">Graph explorer</h2>

      <div className="govuk-tabs" data-module="govuk-tabs">
        <h2 className="govuk-tabs__title">Sections</h2>
        <ul className="govuk-tabs__list" role="tablist">
          <li className="govuk-tabs__list-item" role="presentation">
            <button
              className={`govuk-tabs__tab ${activeTab === 'nodes' ? 'govuk-tabs__tab--selected' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeTab === 'nodes'}
              onClick={() => setActiveTab('nodes')}
            >
              Nodes
            </button>
          </li>
          <li className="govuk-tabs__list-item" role="presentation">
            <button
              className={`govuk-tabs__tab ${
                activeTab === 'relationships' ? 'govuk-tabs__tab--selected' : ''
              }`}
              type="button"
              role="tab"
              aria-selected={activeTab === 'relationships'}
              onClick={() => setActiveTab('relationships')}
            >
              Relationships
            </button>
          </li>
          <li className="govuk-tabs__list-item" role="presentation">
            <button
              className={`govuk-tabs__tab ${activeTab === 'schema' ? 'govuk-tabs__tab--selected' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeTab === 'schema'}
              onClick={() => setActiveTab('schema')}
            >
              Schema
            </button>
          </li>
        </ul>

        <div className="govuk-tabs__panel" hidden={activeTab !== 'nodes'} role="tabpanel">
          <form
            className="govuk-form-group govuk-!-margin-bottom-2"
            onSubmit={(event) => {
              event.preventDefault()
              handleFetchNodes()
            }}
          >
            <label className="govuk-label" htmlFor="node-label">
              Node label (optional)
            </label>
            <input
              className="govuk-input govuk-!-width-one-half"
              id="node-label"
              name="node-label"
              value={nodeLabel}
              onChange={(event) => setNodeLabel(event.target.value)}
              placeholder="Patient"
            />
            <label className="govuk-label govuk-!-margin-top-3" htmlFor="node-limit">
              Limit
            </label>
            <input
              className="govuk-input govuk-!-width-one-quarter"
              id="node-limit"
              name="node-limit"
              type="number"
              min={1}
              max={200}
              value={nodeLimit}
              onChange={(event) => {
                const value = Number(event.target.value)
                setNodeLimit(Number.isNaN(value) ? 10 : value)
              }}
            />
            <button className="govuk-button govuk-!-margin-top-3" type="submit" disabled={isLoading}>
              Fetch nodes
            </button>
          </form>
          {nodeGraph.nodes.length > 0 && (
            <div className="graph-explorer__visual govuk-!-margin-top-4">
              <GraphCanvas data={nodeGraph} caption="Sample nodes" />
            </div>
          )}
          {hasValue(nodeResults) && (
            <details className="govuk-details govuk-!-margin-top-3">
              <summary className="govuk-details__summary">
                <span className="govuk-details__summary-text">Raw response (nodes)</span>
              </summary>
              <div className="govuk-details__text">
                <pre className="graph-explorer__code">{stringify(nodeResults)}</pre>
              </div>
            </details>
          )}

          <div className="govuk-form-group govuk-!-margin-top-6">
            <label className="govuk-label" htmlFor="node-id">
              Inspect a specific node by ID
            </label>
            <input
              className="govuk-input"
              id="node-id"
              name="node-id"
              value={selectedNodeId}
              onChange={(event) => setSelectedNodeId(event.target.value)}
              placeholder="patient-123"
            />
            <button
              className="govuk-button govuk-button--secondary govuk-!-margin-top-3"
              type="button"
              disabled={isLoading}
              onClick={handleFetchNodeDetail}
            >
              Fetch node detail
            </button>
            {nodeDetailGraph.nodes.length > 0 && (
              <div className="graph-explorer__visual govuk-!-margin-top-4">
                <GraphCanvas data={nodeDetailGraph} caption="Neighbourhood" />
              </div>
            )}
            {hasValue(nodeDetail) && (
              <details className="govuk-details govuk-!-margin-top-3">
                <summary className="govuk-details__summary">
                  <span className="govuk-details__summary-text">Raw response (node detail)</span>
                </summary>
                <div className="govuk-details__text">
                  <pre className="graph-explorer__code">{stringify(nodeDetail)}</pre>
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="govuk-tabs__panel" hidden={activeTab !== 'relationships'} role="tabpanel">
          <form
            className="govuk-form-group"
            onSubmit={(event) => {
              event.preventDefault()
              handleFetchRelationships()
            }}
          >
            <label className="govuk-label" htmlFor="relationship-type">
              Relationship type (optional)
            </label>
            <input
              className="govuk-input govuk-!-width-two-thirds"
              id="relationship-type"
              name="relationship-type"
              value={relationshipType}
              onChange={(event) => setRelationshipType(event.target.value)}
              placeholder="HAS_CONDITION"
            />
            <button className="govuk-button govuk-!-margin-top-3" type="submit" disabled={isLoading}>
              Fetch relationships
            </button>
          </form>
          {relationshipGraph.links.length > 0 && (
            <div className="graph-explorer__visual govuk-!-margin-top-4">
              <GraphCanvas data={relationshipGraph} caption="Relationship preview" />
            </div>
          )}
          {hasValue(relationshipResults) && (
            <details className="govuk-details govuk-!-margin-top-3">
              <summary className="govuk-details__summary">
                <span className="govuk-details__summary-text">Raw response (relationships)</span>
              </summary>
              <div className="govuk-details__text">
                <pre className="graph-explorer__code">{stringify(relationshipResults)}</pre>
              </div>
            </details>
          )}
        </div>

        <div className="govuk-tabs__panel" hidden={activeTab !== 'schema'} role="tabpanel">
          <button
            className="govuk-button"
            type="button"
            disabled={isLoading}
            onClick={handleFetchSchema}
          >
            Fetch schema snapshot
          </button>
          {hasValue(schema) && (
            <>
              <div className="graph-explorer__visual govuk-!-margin-top-4">
                <SchemaSummary value={schema} />
              </div>
              <details className="govuk-details govuk-!-margin-top-3">
                <summary className="govuk-details__summary">
                  <span className="govuk-details__summary-text">Raw response (schema)</span>
                </summary>
                <div className="govuk-details__text">
                  <pre className="graph-explorer__code">{stringify(schema)}</pre>
                </div>
              </details>
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="govuk-!-margin-top-3" aria-live="assertive">
          <span className="govuk-tag govuk-tag--blue">Loading data…</span>
        </div>
      )}

      {error && (
        <div className="govuk-error-summary govuk-!-margin-top-3" role="alert">
          <h2 className="govuk-error-summary__title">Unable to fetch graph data</h2>
          <div className="govuk-error-summary__body">
            <p className="govuk-body">{error}</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default GraphExplorer
