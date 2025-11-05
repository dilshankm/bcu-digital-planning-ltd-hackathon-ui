import { useEffect, useState } from 'react'
import { fetchNodeDetail } from '@/services/exploreService'
import type { NormalisedGraphNode } from '@/utils/graphNormaliser'
import { normaliseGraphData } from '@/utils/graphNormaliser'
import GraphCanvas from '@/components/GraphCanvas'

interface NodeDetailsPanelProps {
  node: NormalisedGraphNode | null
  onClose: () => void
  showNeighbors?: boolean // Whether to fetch and show neighbors
}

export const NodeDetailsPanel = ({ node, onClose, showNeighbors = true }: NodeDetailsPanelProps) => {
  const [detailedData, setDetailedData] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNeighborsGraph, setShowNeighborsGraph] = useState(false)

  useEffect(() => {
    if (!node || !showNeighbors) {
      setDetailedData(null)
      return
    }

    const loadNodeDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchNodeDetail(node.id, 1) // depth=1 to get neighbors
        setDetailedData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load node details')
        console.error('Failed to fetch node details:', err)
      } finally {
        setIsLoading(false)
      }
    }

    void loadNodeDetails()
  }, [node, showNeighbors])

  if (!node) return null

  const neighborGraph = detailedData ? normaliseGraphData(detailedData) : null

  return (
    <div className="node-details-panel">
      <div className="node-details-panel__header">
        <h3 className="govuk-heading-s govuk-!-margin-bottom-0">Node Details</h3>
        <button
          className="govuk-button govuk-button--secondary govuk-button--small"
          type="button"
          onClick={onClose}
          aria-label="Close node details"
        >
          ×
        </button>
      </div>
      
      <div className="node-details-panel__content">
        <div className="node-details-panel__section">
          <h4 className="govuk-heading-xs govuk-!-margin-bottom-1">ID</h4>
          <p className="govuk-body-s govuk-!-margin-bottom-2">{node.id}</p>
        </div>

        {node.label && (
          <div className="node-details-panel__section">
            <h4 className="govuk-heading-xs govuk-!-margin-bottom-1">Type</h4>
            <p className="govuk-body-s govuk-!-margin-bottom-2">
              <span className="govuk-tag govuk-tag--blue">{node.label}</span>
            </p>
          </div>
        )}

        {node.properties && Object.keys(node.properties).length > 0 && (
          <div className="node-details-panel__section">
            <h4 className="govuk-heading-xs govuk-!-margin-bottom-1">Properties</h4>
            <dl className="govuk-summary-list govuk-summary-list--no-border govuk-!-margin-bottom-0">
              {Object.entries(node.properties).map(([key, value]) => (
                <div className="govuk-summary-list__row" key={key}>
                  <dt className="govuk-summary-list__key govuk-!-font-weight-bold">{key}</dt>
                  <dd className="govuk-summary-list__value">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {showNeighbors && (
          <div className="node-details-panel__section">
            <div className="node-details-panel__section-header">
              <h4 className="govuk-heading-xs govuk-!-margin-bottom-1">Neighbors</h4>
              {neighborGraph && neighborGraph.nodes.length > 1 && (
                <button
                  className="govuk-button govuk-button--secondary govuk-button--small"
                  type="button"
                  onClick={() => setShowNeighborsGraph(!showNeighborsGraph)}
                >
                  {showNeighborsGraph ? 'Hide' : 'Show'} Graph ({neighborGraph.nodes.length - 1} neighbors)
                </button>
              )}
            </div>
            
            {isLoading && (
              <p className="govuk-body-s govuk-!-margin-bottom-0">Loading neighbors...</p>
            )}
            
            {error && (
              <p className="govuk-body-s govuk-!-margin-bottom-0 govuk-!-color-red">
                {error}
              </p>
            )}
            
            {neighborGraph && neighborGraph.nodes.length > 1 && !isLoading && (
              <div className="node-details-panel__neighbors-info">
                <p className="govuk-body-s govuk-!-margin-bottom-1">
                  Found {neighborGraph.nodes.length - 1} connected node{neighborGraph.nodes.length - 1 === 1 ? '' : 's'} 
                  via {neighborGraph.links.length} relationship{neighborGraph.links.length === 1 ? '' : 's'}.
                </p>
                {showNeighborsGraph && (
                  <div className="node-details-panel__neighbors-graph">
                    <GraphCanvas data={neighborGraph} height={300} />
                  </div>
                )}
              </div>
            )}
            
            {neighborGraph && neighborGraph.nodes.length === 1 && !isLoading && (
              <p className="govuk-body-s govuk-!-margin-bottom-0">No neighbors found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NodeDetailsPanel

