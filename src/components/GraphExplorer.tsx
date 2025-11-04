import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchNodes,
  fetchRelationships,
  fetchSchema,
} from '@/services/exploreService'
import GraphCanvas from '@/components/GraphCanvas'
import SchemaSummary from '@/components/SchemaSummary'
import { normaliseGraphData } from '@/utils/graphNormaliser'

type ExplorerTab = 'nodes' | 'relationships' | 'schema'

const hasValue = (value: unknown): boolean => value !== undefined && value !== null

export const GraphExplorer = () => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('nodes')
  const [nodeLabel, setNodeLabel] = useState('')
  const [nodeResults, setNodeResults] = useState<unknown>(null)
  const [relationshipType, setRelationshipType] = useState('')
  const [relationshipResults, setRelationshipResults] = useState<unknown>(null)
  const [schema, setSchema] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear results when switching tabs
  const handleTabChange = (tab: ExplorerTab) => {
    setActiveTab(tab)
    setError(null)
    // Optionally clear results from other tabs
    if (tab === 'nodes') {
      setRelationshipResults(null)
    } else if (tab === 'relationships') {
      setNodeResults(null)
    }
  }

  // Extract schema options
  const schemaNodeTypes = useMemo(() => {
    if (!schema || typeof schema !== 'object') return []
    const nodeTypes = (schema as Record<string, unknown>).node_types || (schema as Record<string, unknown>).nodeLabels
    return Array.isArray(nodeTypes) ? nodeTypes.filter((t): t is string => typeof t === 'string') : []
  }, [schema])

  const schemaRelationshipTypes = useMemo(() => {
    if (!schema || typeof schema !== 'object') return []
    const relTypes = (schema as Record<string, unknown>).relationship_types || (schema as Record<string, unknown>).relationshipTypes
    return Array.isArray(relTypes) ? relTypes.filter((t): t is string => typeof t === 'string') : []
  }, [schema])

  // Auto-fetch schema on mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const result = await fetchSchema()
        setSchema(result)
      } catch (err) {
        // Schema loading is optional, don't show error
        console.warn('Failed to load schema:', err)
      }
    }
    void loadSchema()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nodeGraph = useMemo(() => normaliseGraphData(nodeResults), [nodeResults])
  const relationshipGraph = useMemo(() => {
    const normalized = normaliseGraphData(relationshipResults)
    console.log('Normalized relationship graph:', normalized)
    console.log('Nodes:', normalized.nodes.length, 'Links:', normalized.links.length)
    return normalized
  }, [relationshipResults])

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
      const results = await fetchNodes({ label: nodeLabel || undefined })
      setNodeResults(results)
    })
  }, [nodeLabel, runSafely])

  const handleFetchRelationships = useCallback(() => {
    void runSafely(async () => {
      const results = await fetchRelationships({ type: relationshipType || undefined })
      console.log('Relationship API response:', results)
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
              onClick={() => handleTabChange('nodes')}
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
              onClick={() => handleTabChange('relationships')}
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
              onClick={() => handleTabChange('schema')}
            >
              Schema
            </button>
          </li>
        </ul>

        <div className="govuk-tabs__panel" hidden={activeTab !== 'nodes'} role="tabpanel">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleFetchNodes()
            }}
          >
            <div className="graph-explorer__form-row">
              <div className="graph-explorer__form-field">
                <label className="govuk-label" htmlFor="node-label">
                  Node type
                </label>
                {schemaNodeTypes.length > 0 ? (
                  <select
                    className="govuk-select"
                    id="node-label"
                    name="node-label"
                    value={nodeLabel}
                    onChange={(event) => {
                      setNodeLabel(event.target.value)
                      setNodeResults(null) // Clear results when filter changes
                    }}
                  >
                    <option value="">All types</option>
                    {schemaNodeTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="govuk-input"
                    id="node-label"
                    name="node-label"
                    value={nodeLabel}
                    onChange={(event) => {
                      setNodeLabel(event.target.value)
                      setNodeResults(null) // Clear results when filter changes
                    }}
                    placeholder="e.g. Patient"
                  />
                )}
              </div>
            </div>
            <div className="graph-explorer__form-actions">
              <button className="govuk-button" type="submit" disabled={isLoading}>
                Fetch nodes
              </button>
              {hasValue(nodeResults) && (
                <button
                  className="govuk-button govuk-button--secondary"
                  type="button"
                  onClick={() => setNodeResults(null)}
                  disabled={isLoading}
                >
                  Clear results
                </button>
              )}
            </div>
          </form>
          {nodeGraph.nodes.length > 0 && (
            <div className="graph-explorer__visual govuk-!-margin-top-4">
              <p className="graph-canvas__caption govuk-body-s">
                Showing {nodeGraph.nodes.length} node{nodeGraph.nodes.length === 1 ? '' : 's'}
                {nodeLabel ? ` of type "${nodeLabel}"` : ''}
              </p>
              <GraphCanvas data={nodeGraph} />
            </div>
          )}
        </div>

        <div className="govuk-tabs__panel" hidden={activeTab !== 'relationships'} role="tabpanel">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleFetchRelationships()
            }}
          >
            <div className="graph-explorer__form-row">
              <div className="graph-explorer__form-field">
                <label className="govuk-label" htmlFor="relationship-type">
                  Relationship type
                </label>
                {schemaRelationshipTypes.length > 0 ? (
                  <select
                    className="govuk-select"
                    id="relationship-type"
                    name="relationship-type"
                    value={relationshipType}
                    onChange={(event) => {
                      setRelationshipType(event.target.value)
                      setRelationshipResults(null) // Clear results when filter changes
                    }}
                  >
                    <option value="">All types</option>
                    {schemaRelationshipTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="govuk-input"
                    id="relationship-type"
                    name="relationship-type"
                    value={relationshipType}
                    onChange={(event) => {
                      setRelationshipType(event.target.value)
                      setRelationshipResults(null) // Clear results when filter changes
                    }}
                    placeholder="e.g. HAS_CONDITION"
                  />
                )}
              </div>
            </div>
            <div className="graph-explorer__form-actions">
              <button className="govuk-button" type="submit" disabled={isLoading}>
                Fetch relationships
              </button>
              {hasValue(relationshipResults) && (
                <button
                  className="govuk-button govuk-button--secondary"
                  type="button"
                  onClick={() => setRelationshipResults(null)}
                  disabled={isLoading}
                >
                  Clear results
                </button>
              )}
            </div>
          </form>
          {relationshipGraph.links.length > 0 ? (
            <div className="graph-explorer__visual govuk-!-margin-top-4">
              <p className="graph-canvas__caption govuk-body-s">
                Showing {relationshipGraph.links.length} relationship{relationshipGraph.links.length === 1 ? '' : 's'}
                {relationshipType ? ` of type "${relationshipType}"` : ''} ({relationshipGraph.nodes.length} node{relationshipGraph.nodes.length === 1 ? '' : 's'})
              </p>
              <GraphCanvas data={relationshipGraph} />
            </div>
          ) : hasValue(relationshipResults) ? (
            <div className="govuk-inset-text govuk-!-margin-top-4">
              <p className="govuk-body">
                The API returned data, but it couldn't be visualized as a graph. 
                Relationships need source and target nodes to display properly.
              </p>
              <p className="govuk-body-s">
                Check the browser console for the raw API response.
              </p>
            </div>
          ) : null}
        </div>

        <div className="govuk-tabs__panel" hidden={activeTab !== 'schema'} role="tabpanel">
          <div className="graph-explorer__form-actions">
            <button
              className="govuk-button"
              type="button"
              disabled={isLoading}
              onClick={handleFetchSchema}
            >
              Refresh schema
            </button>
          </div>
          {hasValue(schema) && (
            <div className="graph-explorer__visual govuk-!-margin-top-4">
              <SchemaSummary value={schema} />
            </div>
          )}
          {!hasValue(schema) && !isLoading && (
            <p className="govuk-body govuk-!-margin-top-3">
              Schema will load automatically. Use the button above to refresh.
            </p>
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
