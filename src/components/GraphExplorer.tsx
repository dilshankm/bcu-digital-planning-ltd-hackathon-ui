import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchNodes,
  fetchRelationships,
  fetchSchema,
  fetchStats,
} from '@/services/exploreService'
import GraphCanvas from '@/components/GraphCanvas'
import SchemaSummary from '@/components/SchemaSummary'
import NodeDetailsPanel from '@/components/NodeDetailsPanel'
import { normaliseGraphData } from '@/utils/graphNormaliser'
import type { NormalisedGraphNode } from '@/utils/graphNormaliser'

type ExplorerTab = 'nodes' | 'relationships' | 'schema' | 'stats'

const hasValue = (value: unknown): boolean => value !== undefined && value !== null

export const GraphExplorer = () => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('nodes')
  const [nodeLabel, setNodeLabel] = useState('')
  const [nodeResults, setNodeResults] = useState<unknown>(null)
  const [relationshipType, setRelationshipType] = useState('')
  const [relationshipResults, setRelationshipResults] = useState<unknown>(null)
  const [schema, setSchema] = useState<unknown>(null)
  const [stats, setStats] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<NormalisedGraphNode | null>(null)
  
  // Pagination state
  const [nodePage, setNodePage] = useState(0)
  const [nodePageSize] = useState(50)
  const [relationshipPage, setRelationshipPage] = useState(0)
  const [relationshipPageSize] = useState(50)
  
  // Pagination metadata from API
  const nodePagination = useMemo(() => {
    if (!nodeResults || typeof nodeResults !== 'object') return null
    const result = nodeResults as Record<string, unknown>
    return {
      total: typeof result.total === 'number' ? result.total : undefined,
      count: typeof result.count === 'number' ? result.count : undefined,
      skip: typeof result.skip === 'number' ? result.skip : undefined,
      limit: typeof result.limit === 'number' ? result.limit : undefined,
    }
  }, [nodeResults])
  
  const relationshipPagination = useMemo(() => {
    if (!relationshipResults || typeof relationshipResults !== 'object') return null
    const result = relationshipResults as Record<string, unknown>
    return {
      total: typeof result.total === 'number' ? result.total : undefined,
      count: typeof result.count === 'number' ? result.count : undefined,
    }
  }, [relationshipResults])

  // Clear results when switching tabs
  const handleTabChange = (tab: ExplorerTab) => {
    setActiveTab(tab)
    setError(null)
    setSelectedNode(null)
    setNodePage(0)
    setRelationshipPage(0)
    // Optionally clear results from other tabs
    if (tab === 'nodes') {
      setRelationshipResults(null)
    } else if (tab === 'relationships') {
      setNodeResults(null)
    }
  }
  
  // Refetch when pagination changes (only if we have results)
  useEffect(() => {
    if (hasValue(nodeResults) && nodeGraphRaw.nodes.length > 0) {
      handleFetchNodes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodePage])
  
  useEffect(() => {
    if (hasValue(relationshipResults) && relationshipGraphRaw.links.length > 0) {
      handleFetchRelationships()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationshipPage])

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

  const nodeGraphRaw = useMemo(() => normaliseGraphData(nodeResults), [nodeResults])
  const relationshipGraphRaw = useMemo(() => {
    console.log('=== NORMALIZING RELATIONSHIPS ===')
    console.log('Raw relationshipResults:', relationshipResults)
    const normalized = normaliseGraphData(relationshipResults)
    console.log('Normalized graph:', normalized)
    console.log('Normalized nodes count:', normalized.nodes.length)
    console.log('Normalized links count:', normalized.links.length)
    
    if (normalized.links.length > 0) {
      console.log('=== FIRST 5 NORMALIZED LINKS ===')
      normalized.links.slice(0, 5).forEach((link, index) => {
        console.log(`Link ${index + 1}:`, {
          id: link.id,
          label: link.label,
          source: link.source,
          target: link.target,
          properties: link.properties
        })
      })
      
      console.log('=== LINK LABELS SUMMARY ===')
      const labels = normalized.links.map(l => l.label).filter(Boolean)
      console.log('Unique labels:', [...new Set(labels)])
      console.log('Links without labels:', normalized.links.filter(l => !l.label).length)
      console.log('Links with labels:', normalized.links.filter(l => l.label).length)
    }
    
    return normalized
  }, [relationshipResults])

  // Auto-fetch schema and stats on mount
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
    
    const loadStats = async () => {
      try {
        const result = await fetchStats()
        setStats(result)
      } catch (err) {
        // Stats loading is optional, don't show error
        console.warn('Failed to load stats:', err)
      }
    }
    void loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Use raw graph data (no client-side filtering since backend handles search)
  const nodeGraph = nodeGraphRaw
  const relationshipGraph = relationshipGraphRaw

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
      const skip = nodePage * nodePageSize
      const results = await fetchNodes({ 
        label: nodeLabel || undefined,
        limit: nodePageSize,
        skip,
      })
      setNodeResults(results)
    })
  }, [nodeLabel, nodePage, nodePageSize, runSafely])

  const handleFetchRelationships = useCallback(() => {
    void runSafely(async () => {
      const skip = relationshipPage * relationshipPageSize
      const results = await fetchRelationships({ 
        type: relationshipType || undefined,
        limit: relationshipPageSize,
        skip,
      })
      console.log('=== RELATIONSHIP API RESPONSE ===')
      console.log('Full response:', JSON.stringify(results, null, 2))
      console.log('Response type:', typeof results)
      console.log('Is object:', results && typeof results === 'object')
      
      if (results && typeof results === 'object') {
        const resultObj = results as Record<string, unknown>
        console.log('Response keys:', Object.keys(resultObj))
        
        if ('relationships' in resultObj && Array.isArray(resultObj.relationships)) {
          const rels = resultObj.relationships as unknown[]
          console.log('Number of relationships:', rels.length)
          console.log('First 3 relationships:', rels.slice(0, 3))
          if (rels.length > 0) {
            console.log('Sample relationship structure:', JSON.stringify(rels[0], null, 2))
            console.log('Sample relationship keys:', rels[0] && typeof rels[0] === 'object' ? Object.keys(rels[0] as Record<string, unknown>) : 'N/A')
          }
        } else if ('links' in resultObj && Array.isArray(resultObj.links)) {
          const links = resultObj.links as unknown[]
          console.log('Number of links:', links.length)
          console.log('First 3 links:', links.slice(0, 3))
        } else {
          console.log('No relationships or links array found')
          console.log('Response structure:', Object.keys(resultObj))
        }
      }
      
      setRelationshipResults(results)
    })
  }, [relationshipType, relationshipPage, relationshipPageSize, runSafely])
  
  const handleFetchStats = useCallback(() => {
    void runSafely(async () => {
      const result = await fetchStats()
      setStats(result)
    })
  }, [runSafely])

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
          <li className="govuk-tabs__list-item" role="presentation">
            <button
              className={`govuk-tabs__tab ${activeTab === 'stats' ? 'govuk-tabs__tab--selected' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeTab === 'stats'}
              onClick={() => handleTabChange('stats')}
            >
              Statistics
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
                      setNodePage(0) // Reset pagination
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
                      setNodePage(0) // Reset pagination
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
                  onClick={() => {
                    setNodeResults(null)
                    setNodePage(0)
                  }}
                  disabled={isLoading}
                >
                  Clear results
                </button>
              )}
            </div>
          </form>
          {nodeGraphRaw.nodes.length > 0 && (
            <div className="graph-explorer__visual govuk-!-margin-top-4">
              <div className="graph-explorer__visual-header">
                <p className="graph-canvas__caption govuk-body-s">
                  Showing {nodeGraph.nodes.length} node{nodeGraph.nodes.length === 1 ? '' : 's'}
                  {nodePagination?.total !== undefined && ` of ${nodePagination.total.toLocaleString()}`}
                  {nodeLabel ? ` of type "${nodeLabel}"` : ''}
                </p>
              </div>
              {nodePagination && nodePagination.total !== undefined && nodePagination.total > nodePageSize && (
                <div className="graph-explorer__pagination">
                  <button
                    className="govuk-button govuk-button--secondary govuk-button--small"
                    type="button"
                    onClick={() => {
                      setNodePage((prev) => Math.max(0, prev - 1))
                    }}
                    disabled={nodePage === 0 || isLoading}
                  >
                    Previous
                  </button>
                  <span className="govuk-body-s">
                    Page {nodePage + 1} of {Math.ceil((nodePagination.total || 0) / nodePageSize)}
                  </span>
                  <button
                    className="govuk-button govuk-button--secondary govuk-button--small"
                    type="button"
                    onClick={() => {
                      setNodePage((prev) => prev + 1)
                    }}
                    disabled={
                      nodePagination.total === undefined ||
                      (nodePage + 1) * nodePageSize >= nodePagination.total ||
                      isLoading
                    }
                  >
                    Next
                  </button>
                </div>
              )}
              <div className="graph-explorer__visual-container">
                <GraphCanvas 
                  data={nodeGraph} 
                  onNodeSelect={setSelectedNode}
                  height={700}
                  showControls={false}
                />
                {selectedNode && (
                  <NodeDetailsPanel 
                    node={selectedNode} 
                    onClose={() => setSelectedNode(null)} 
                  />
                )}
              </div>
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
              <div className="graph-explorer__visual-header">
                <p className="graph-canvas__caption govuk-body-s">
                  Showing {relationshipGraph.links.length} relationship{relationshipGraph.links.length === 1 ? '' : 's'}
                  {relationshipPagination?.total !== undefined && ` of ${relationshipPagination.total.toLocaleString()}`}
                  {relationshipType ? ` of type "${relationshipType}"` : ''} ({relationshipGraph.nodes.length} node{relationshipGraph.nodes.length === 1 ? '' : 's'})
                </p>
              </div>
              {relationshipPagination && relationshipPagination.total !== undefined && relationshipPagination.total > relationshipPageSize && (
                <div className="graph-explorer__pagination">
                  <button
                    className="govuk-button govuk-button--secondary govuk-button--small"
                    type="button"
                    onClick={() => {
                      setRelationshipPage((prev) => Math.max(0, prev - 1))
                    }}
                    disabled={relationshipPage === 0 || isLoading}
                  >
                    Previous
                  </button>
                  <span className="govuk-body-s">
                    Page {relationshipPage + 1} of {Math.ceil((relationshipPagination.total || 0) / relationshipPageSize)}
                  </span>
                  <button
                    className="govuk-button govuk-button--secondary govuk-button--small"
                    type="button"
                    onClick={() => {
                      setRelationshipPage((prev) => prev + 1)
                    }}
                    disabled={
                      relationshipPagination.total === undefined ||
                      (relationshipPage + 1) * relationshipPageSize >= relationshipPagination.total ||
                      isLoading
                    }
                  >
                    Next
                  </button>
                </div>
              )}
              <div className="graph-explorer__visual-container">
                <GraphCanvas 
                  data={relationshipGraph} 
                  onNodeSelect={setSelectedNode}
                  height={700}
                  showControls={false}
                />
                {selectedNode && (
                  <NodeDetailsPanel 
                    node={selectedNode} 
                    onClose={() => setSelectedNode(null)} 
                  />
                )}
              </div>
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

        <div className="govuk-tabs__panel" hidden={activeTab !== 'stats'} role="tabpanel">
          <div className="graph-explorer__form-actions">
            <button
              className="govuk-button"
              type="button"
              disabled={isLoading}
              onClick={handleFetchStats}
            >
              Refresh statistics
            </button>
          </div>
              {hasValue(stats) && (
                <div className="graph-explorer__visual govuk-!-margin-top-4">
                  <div className="schema-summary">
                    {typeof stats === 'object' && stats !== null && (
                      <>
                        {(() => {
                          const statsObj = stats as Record<string, unknown>
                          const totalNodes = statsObj.total_nodes
                          const totalRelationships = statsObj.total_relationships
                          
                          const formatValue = (value: unknown): string => {
                            if (typeof value === 'number') {
                              return value.toLocaleString()
                            }
                            return String(value ?? '')
                          }
                          
                          return (
                            <>
                              {totalNodes !== undefined && (
                                <div className="schema-summary__stats govuk-!-margin-bottom-4">
                                  <div className="schema-summary__stat">
                                    <span className="schema-summary__stat-label">Total Nodes</span>
                                    <span className="schema-summary__stat-value">
                                      {formatValue(totalNodes)}
                                    </span>
                                  </div>
                                  {totalRelationships !== undefined && (
                                    <div className="schema-summary__stat">
                                      <span className="schema-summary__stat-label">Total Relationships</span>
                                      <span className="schema-summary__stat-value">
                                        {formatValue(totalRelationships)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {statsObj.node_counts && (
                                <div className="schema-summary__section">
                                  <h3 className="govuk-heading-s govuk-!-margin-bottom-2">Node Counts by Type</h3>
                                  <ul className="govuk-list govuk-list--bullet govuk-!-margin-bottom-4">
                                    {Object.entries(
                                      statsObj.node_counts as Record<string, number>
                                    )
                                      .sort(([, a], [, b]) => b - a)
                                      .map(([type, count]) => (
                                        <li key={type}>
                                          {type}: <strong>{count.toLocaleString()}</strong>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                              {statsObj.relationship_counts && (
                                <div className="schema-summary__section">
                                  <h3 className="govuk-heading-s govuk-!-margin-bottom-2">Relationship Counts by Type</h3>
                                  <ul className="govuk-list govuk-list--bullet govuk-!-margin-bottom-4">
                                    {Object.entries(
                                      statsObj.relationship_counts as Record<string, number>
                                    )
                                      .sort(([, a], [, b]) => b - a)
                                      .map(([type, count]) => (
                                        <li key={type}>
                                          {type}: <strong>{count.toLocaleString()}</strong>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </>
                    )}
                  </div>
                </div>
              )}
          {!hasValue(stats) && !isLoading && (
            <p className="govuk-body govuk-!-margin-top-3">
              Statistics will load automatically. Use the button above to refresh.
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
