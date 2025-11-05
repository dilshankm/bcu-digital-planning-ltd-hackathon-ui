import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from 'react-force-graph-2d'

import type { NormalisedGraph, NormalisedGraphNode } from '@/utils/graphNormaliser'

interface GraphCanvasProps {
  data: NormalisedGraph
  caption?: string
  height?: number
  onNodeSelect?: (node: NormalisedGraphNode | null) => void
  showControls?: boolean // Control visibility of zoom/play buttons
}

// Color palette for different node types
const nodeTypeColors: Record<string, string> = {
  Patient: '#1d70b8',
  Condition: '#d4351c',
  Encounter: '#00703c',
  Procedure: '#912b88',
  Observation: '#f47738',
  Medication: '#85994b',
  Provider: '#28a197',
  Organization: '#005ea5',
  Location: '#5694ca',
}

const defaultNodeColour = '#1d70b8'
const nodeHoverColour = '#003078'
const nodeTextColour = '#0b0c0c'
const linkColour = '#505a5f'
const linkHighlightColour = '#1d70b8'
const linkOpacity = 0.3
const linkHighlightOpacity = 0.8

type ForceGraphNode = NodeObject & NormalisedGraph['nodes'][number]
type ForceGraphLink = LinkObject & NormalisedGraph['links'][number]

interface GraphData {
  nodes: NodeObject[]
  links: LinkObject[]
}

// Generate color for node based on its label/type
const getNodeColor = (node: ForceGraphNode): string => {
  if (node.label && nodeTypeColors[node.label]) {
    return nodeTypeColors[node.label]
  }
  return defaultNodeColour
}

export const GraphCanvas = memo(({ data, caption, height = 700, onNodeSelect, showControls = false }: GraphCanvasProps) => {
  const graphRef = useRef<ForceGraphMethods | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [hiddenNodeTypes, setHiddenNodeTypes] = useState<Set<string>>(new Set())
  const [hiddenLinkTypes, setHiddenLinkTypes] = useState<Set<string>>(new Set())
  const [showLegend, setShowLegend] = useState(true)

  const graphData = useMemo<GraphData>(() => {
    const nodes: NodeObject[] = data.nodes.map((node) => ({ ...node }))
    const links: LinkObject[] = data.links.map((link) => ({
      ...link,
      source: link.source,
      target: link.target,
    }))

    return { nodes, links }
  }, [data])

  // Filter nodes and links based on hidden types
  const filteredGraphData = useMemo<GraphData>(() => {
    const filteredNodes = graphData.nodes.filter((node) => {
      const typed = node as ForceGraphNode
      return !hiddenNodeTypes.has(typed.label || '')
    })

    const filteredNodeIds = new Set(filteredNodes.map((n) => String(n.id ?? '')))
    const filteredLinks = graphData.links.filter((link) => {
      const typed = link as ForceGraphLink
      const sourceId = typeof typed.source === 'object' ? String((typed.source as NodeObject).id ?? '') : String(typed.source ?? '')
      const targetId = typeof typed.target === 'object' ? String((typed.target as NodeObject).id ?? '') : String(typed.target ?? '')
      
      // Check if link type is hidden
      if (typed.label && hiddenLinkTypes.has(typed.label)) {
        return false
      }
      
      // Check if both source and target nodes are visible
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId)
    })

    return { nodes: filteredNodes, links: filteredLinks }
  }, [graphData, hiddenNodeTypes, hiddenLinkTypes])

  // Get unique node and link types for legend
  const nodeTypes = useMemo(() => {
    const types = new Set<string>()
    graphData.nodes.forEach((node) => {
      const typed = node as ForceGraphNode
      if (typed.label) {
        types.add(typed.label)
      }
    })
    return Array.from(types).sort()
  }, [graphData.nodes])

  const linkTypes = useMemo(() => {
    const types = new Set<string>()
    graphData.links.forEach((link) => {
      const typed = link as ForceGraphLink
      if (typed.label) {
        types.add(typed.label)
      }
    })
    return Array.from(types).sort()
  }, [graphData.links])

  // Find connected nodes for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode && !hoveredNode) return new Set<string>()
    
    const targetId = selectedNode || hoveredNode
    if (!targetId) return new Set<string>()
    
    const connected = new Set<string>([targetId])
    
    filteredGraphData.links.forEach((link) => {
      const typed = link as ForceGraphLink
      const sourceId = typeof typed.source === 'object' ? String((typed.source as NodeObject).id ?? '') : String(typed.source ?? '')
      const linkTargetId = typeof typed.target === 'object' ? String((typed.target as NodeObject).id ?? '') : String(typed.target ?? '')
      
      if (sourceId === targetId) {
        connected.add(linkTargetId)
      } else if (linkTargetId === targetId) {
        connected.add(sourceId)
      }
    })
    
    return connected
  }, [selectedNode, hoveredNode, filteredGraphData.links])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom * 1.2)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom * 0.8)
    }
  }, [])

  const handleZoomToFit = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 60)
    }
  }, [])

  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0)
      graphRef.current.zoom(1)
      setSelectedNode(null)
      setHoveredNode(null)
    }
  }, [])

  useEffect(() => {
    if (graphRef.current && filteredGraphData.nodes.length > 0) {
      requestAnimationFrame(() => {
        graphRef.current?.zoomToFit(400, 60)
      })
    }
  }, [filteredGraphData])

  // Pause/resume simulation
  useEffect(() => {
    if (graphRef.current) {
      if (paused) {
        graphRef.current.pauseAnimation()
      } else {
        graphRef.current.resumeAnimation()
      }
    }
  }, [paused])

  // Handle node selection callback
  useEffect(() => {
    if (onNodeSelect && selectedNode) {
      const node = filteredGraphData.nodes.find((n) => n.id === selectedNode) as ForceGraphNode | undefined
      if (node) {
        const normalizedNode = data.nodes.find((n) => n.id === selectedNode)
        onNodeSelect(normalizedNode || null)
      }
    } else if (onNodeSelect && !selectedNode) {
      onNodeSelect(null)
    }
  }, [selectedNode, filteredGraphData.nodes, data.nodes, onNodeSelect])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // Don't handle shortcuts when typing in inputs
      }

      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault()
          handleZoomIn()
          break
        case '-':
        case '_':
          event.preventDefault()
          handleZoomOut()
          break
        case '0':
          event.preventDefault()
          handleZoomToFit()
          break
        case 'r':
        case 'R':
          event.preventDefault()
          handleResetView()
          break
        case ' ':
          event.preventDefault()
          setPaused(!paused)
          break
        case 'Escape':
          event.preventDefault()
          setSelectedNode(null)
          setHoveredNode(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [paused, handleZoomIn, handleZoomOut, handleZoomToFit, handleResetView])

  const toggleNodeType = useCallback((type: string) => {
    setHiddenNodeTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }, [])

  const toggleLinkType = useCallback((type: string) => {
    setHiddenLinkTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }, [])

  if (filteredGraphData.nodes.length === 0) {
    return (
      <div className="graph-canvas__empty">
        <p className="govuk-body-s">No visual data available. Try adjusting filters.</p>
      </div>
    )
  }

  return (
    <figure className="graph-canvas" style={{ height }}>
      {caption && <figcaption className="graph-canvas__caption govuk-body-s">{caption}</figcaption>}
      
      {/* Graph Controls - Only show if showControls is true */}
      {showControls && (
        <div className="graph-canvas__controls">
          <button
            className="govuk-button govuk-button--secondary govuk-button--small"
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            className="govuk-button govuk-button--secondary govuk-button--small"
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            className="govuk-button govuk-button--secondary govuk-button--small"
            type="button"
            onClick={handleZoomToFit}
            title="Zoom to fit"
            aria-label="Zoom to fit"
          >
            Fit
          </button>
          <button
            className="govuk-button govuk-button--secondary govuk-button--small"
            type="button"
            onClick={handleResetView}
            title="Reset view"
            aria-label="Reset view"
          >
            Reset
          </button>
          <button
            className={`govuk-button govuk-button--secondary govuk-button--small ${paused ? 'graph-canvas__play-btn' : ''}`}
            type="button"
            onClick={() => setPaused(!paused)}
            title={paused ? 'Resume animation' : 'Pause animation'}
            aria-label={paused ? 'Resume animation' : 'Pause animation'}
          >
            {paused ? '▶' : '⏸'}
          </button>
        </div>
      )}

      <ForceGraph2D
        ref={graphRef}
        graphData={filteredGraphData}
        height={Math.max(height - 40, 400)}
        backgroundColor="#f3f2f1"
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkColor={(link: LinkObject) => {
          const typed = link as ForceGraphLink
          const sourceId = typeof typed.source === 'object' ? String((typed.source as NodeObject).id ?? '') : String(typed.source ?? '')
          const targetId = typeof typed.target === 'object' ? String((typed.target as NodeObject).id ?? '') : String(typed.target ?? '')
          
          const isHighlighted = hoveredNode === sourceId || hoveredNode === targetId || 
                               selectedNode === sourceId || selectedNode === targetId ||
                               connectedNodeIds.has(sourceId) || connectedNodeIds.has(targetId)
          
          return isHighlighted ? linkHighlightColour : linkColour
        }}
        linkOpacity={(link: LinkObject) => {
          const typed = link as ForceGraphLink
          const sourceId = typeof typed.source === 'object' ? String((typed.source as NodeObject).id ?? '') : String(typed.source ?? '')
          const targetId = typeof typed.target === 'object' ? String((typed.target as NodeObject).id ?? '') : String(typed.target ?? '')
          
          const isHighlighted = hoveredNode === sourceId || hoveredNode === targetId || 
                               selectedNode === sourceId || selectedNode === targetId ||
                               connectedNodeIds.has(sourceId) || connectedNodeIds.has(targetId)
          
          return isHighlighted ? linkHighlightOpacity : linkOpacity
        }}
        linkWidth={(link: LinkObject) => {
          const typed = link as ForceGraphLink
          const sourceId = typeof typed.source === 'object' ? String((typed.source as NodeObject).id ?? '') : String(typed.source ?? '')
          const targetId = typeof typed.target === 'object' ? String((typed.target as NodeObject).id ?? '') : String(typed.target ?? '')
          
          const isHighlighted = hoveredNode === sourceId || hoveredNode === targetId || 
                               selectedNode === sourceId || selectedNode === targetId ||
                               connectedNodeIds.has(sourceId) || connectedNodeIds.has(targetId)
          
          return isHighlighted ? 2 : 1
        }}
        linkCurvature={0.1}
        linkLabel={(link) => {
          const typed = link as ForceGraphLink
          return typed.label ?? ''
        }}
        nodeLabel={(node) => {
          const typed = node as ForceGraphNode
          const label = typed.label ?? typed.id
          
          // Format properties nicely
          if (typed.properties && typeof typed.properties === 'object') {
            const props = Object.entries(typed.properties)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n')
            return `${label}\n\n${props}`
          }
          
          return label
        }}
        nodeCanvasObject={(node, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const typed = node as ForceGraphNode
          const label = typed.label ?? typed.id
          const fontSize = Math.max(12 / globalScale, 6)
          const baseRadius = 10
          const isHovered = hoveredNode === typed.id
          const isSelected = selectedNode === typed.id
          const isConnected = connectedNodeIds.has(typed.id)
          const radius = (isHovered || isSelected) ? baseRadius * 1.3 : baseRadius

          // Determine node color based on type
          const nodeColor = getNodeColor(typed)
          
          // Draw node circle with appropriate color
          if (isHovered || isSelected) {
            ctx.fillStyle = nodeHoverColour
          } else if (isConnected) {
            // Connected nodes get slightly darker version of their color
            ctx.fillStyle = nodeColor
          } else {
            ctx.fillStyle = nodeColor
          }
          
          ctx.beginPath()
          ctx.arc(typed.x ?? 0, typed.y ?? 0, radius, 0, 2 * Math.PI, false)
          ctx.fill()

          // Draw selection ring
          if (isSelected) {
            ctx.strokeStyle = nodeHoverColour
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(typed.x ?? 0, typed.y ?? 0, radius + 2, 0, 2 * Math.PI, false)
            ctx.stroke()
          }

          // Draw label
          ctx.font = `${fontSize}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = nodeTextColour
          ctx.fillText(label, typed.x ?? 0, (typed.y ?? 0) + radius + 2)
        }}
        onNodeHover={(node: NodeObject | null) => {
          setHoveredNode(node ? (node.id?.toString() ?? null) : null)
        }}
        onNodeClick={(node: NodeObject | null) => {
          const clickedId = node ? (node.id?.toString() ?? null) : null
          // Toggle selection if clicking the same node
          setSelectedNode((prev) => prev === clickedId ? null : clickedId)
        }}
        onNodeDoubleClick={(node: NodeObject | null) => {
          if (node && graphRef.current) {
            // Center and zoom to node
            const typed = node as ForceGraphNode
            graphRef.current.centerAt(typed.x ?? 0, typed.y ?? 0, 300)
            graphRef.current.zoom(2)
            setSelectedNode(typed.id?.toString() ?? null)
          }
        }}
        onBackgroundClick={() => {
          setSelectedNode(null)
        }}
        cooldownTicks={80}
        onEngineStop={() => {
          if (!paused) {
            graphRef.current?.zoomToFit(400, 60)
          }
        }}
      />

      {/* Legend */}
      {showLegend && (nodeTypes.length > 0 || linkTypes.length > 0) && (
        <div className="graph-canvas__legend">
          <div className="graph-canvas__legend-header">
            <h4 className="govuk-heading-xs govuk-!-margin-bottom-1">Filters</h4>
            <button
              className="govuk-button govuk-button--secondary govuk-button--small"
              type="button"
              onClick={() => setShowLegend(false)}
              aria-label="Hide legend"
            >
              ×
            </button>
          </div>
          
          {nodeTypes.length > 0 && (
            <div className="graph-canvas__legend-section">
              <h5 className="govuk-heading-xs govuk-!-margin-bottom-1">Node Types</h5>
              <div className="graph-canvas__legend-items">
                {nodeTypes.map((type) => {
                  const isHidden = hiddenNodeTypes.has(type)
                  const color = nodeTypeColors[type] || defaultNodeColour
                  const count = filteredGraphData.nodes.filter((n) => (n as ForceGraphNode).label === type).length
                  
                  return (
                    <label key={type} className="graph-canvas__legend-item">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleNodeType(type)}
                        className="govuk-checkboxes__input"
                      />
                      <span
                        className="graph-canvas__legend-color"
                        style={{ backgroundColor: color }}
                      />
                      <span className="graph-canvas__legend-label">
                        {type} ({count})
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {linkTypes.length > 0 && (
            <div className="graph-canvas__legend-section">
              <h5 className="govuk-heading-xs govuk-!-margin-bottom-1">Relationship Types</h5>
              <div className="graph-canvas__legend-items">
                {linkTypes.map((type) => {
                  const isHidden = hiddenLinkTypes.has(type)
                  const count = filteredGraphData.links.filter((l) => (l as ForceGraphLink).label === type).length
                  
                  return (
                    <label key={type} className="graph-canvas__legend-item">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleLinkType(type)}
                        className="govuk-checkboxes__input"
                      />
                      <span className="graph-canvas__legend-label">
                        {type} ({count})
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="graph-canvas__legend-shortcuts">
            <p className="govuk-body-s govuk-!-margin-bottom-0">
              <strong>Shortcuts:</strong> +/- zoom, 0 fit, R reset, Space pause, Esc deselect
            </p>
          </div>
        </div>
      )}

      {!showLegend && (
        <button
          className="govuk-button govuk-button--secondary govuk-button--small graph-canvas__legend-toggle"
          type="button"
          onClick={() => setShowLegend(true)}
          title="Show filters"
        >
          Show Filters
        </button>
      )}
    </figure>
  )
})

GraphCanvas.displayName = 'GraphCanvas'

export default GraphCanvas

