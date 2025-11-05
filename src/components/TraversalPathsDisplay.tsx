import type { TraversalPath } from '@/types/ask'

interface TraversalPathsDisplayProps {
  paths: TraversalPath[]
  nodesUsed?: string[]
}

// Helper to extract meaningful node display from path data
const getNodeDisplay = (path: TraversalPath, key: 'start' | 'end'): { id: string; label?: string; type?: string } => {
  const id = String(path[key] || '')
  
  // Check for enhanced node data with labels/types
  const startNodeKey = key === 'start' ? 'start_node' : 'end_node'
  const nodeKey = key === 'start' ? 'source_node' : 'target_node'
  
  const nodeData = (path[startNodeKey] || path[nodeKey]) as Record<string, unknown> | undefined
  
  if (nodeData && typeof nodeData === 'object') {
    return {
      id,
      label: typeof nodeData.label === 'string' ? nodeData.label : 
             typeof nodeData.name === 'string' ? nodeData.name :
             Array.isArray(nodeData.labels) && nodeData.labels[0] ? String(nodeData.labels[0]) : undefined,
      type: typeof nodeData.type === 'string' ? nodeData.type : undefined,
    }
  }
  
  // Fallback: try to extract from path properties
  const labelKey = key === 'start' ? 'start_label' : 'end_label'
  const typeKey = key === 'start' ? 'start_type' : 'end_type'
  
  return {
    id,
    label: typeof path[labelKey] === 'string' ? path[labelKey] as string : undefined,
    type: typeof path[typeKey] === 'string' ? path[typeKey] as string : undefined,
  }
}

const NodeDisplay = ({ node }: { node: { id: string; label?: string; type?: string } }) => {
  // If we have type or label, show those
  if (node.label || node.type) {
    return (
      <span className="traversal-paths-display__node">
        {node.type && <span className="traversal-paths-display__node-type">{node.type}</span>}
        {node.label && <span className="traversal-paths-display__node-label">{node.type ? ': ' : ''}{node.label}</span>}
      </span>
    )
  }
  
  // Fallback: show just the ID if no other info available
  return <span className="traversal-paths-display__node">{node.id}</span>
}

export const TraversalPathsDisplay = ({ paths, nodesUsed }: TraversalPathsDisplayProps) => {
  if (!paths || paths.length === 0) {
    return null
  }

  return (
    <div className="traversal-paths-display govuk-!-margin-top-4">
      <h3 className="govuk-heading-s govuk-!-margin-bottom-2">Traversal Paths</h3>

      <div className="traversal-paths-display__paths">
        {paths.map((path, index) => {
          const startNode = getNodeDisplay(path, 'start')
          const endNode = getNodeDisplay(path, 'end')
          
          return (
            <div key={index} className="traversal-paths-display__path">
              <NodeDisplay node={startNode} />
              <span className="traversal-paths-display__arrow">→</span>
              <span className="traversal-paths-display__relationship">{path.type}</span>
              <span className="traversal-paths-display__arrow">→</span>
              <NodeDisplay node={endNode} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TraversalPathsDisplay

