import { memo, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from 'react-force-graph-2d'

import type { NormalisedGraph } from '@/utils/graphNormaliser'

interface GraphCanvasProps {
  data: NormalisedGraph
  caption?: string
  height?: number
}

const nodeColour = '#1d70b8'
const nodeHoverColour = '#003078'
const nodeTextColour = '#0b0c0c'
const linkColour = '#505a5f'
const linkHighlightColour = '#1d70b8'

type ForceGraphNode = NodeObject & NormalisedGraph['nodes'][number]
type ForceGraphLink = LinkObject & NormalisedGraph['links'][number]

interface GraphData {
  nodes: NodeObject[]
  links: LinkObject[]
}

export const GraphCanvas = memo(({ data, caption, height = 420 }: GraphCanvasProps) => {
  const graphRef = useRef<ForceGraphMethods | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const graphData = useMemo<GraphData>(() => {
    const nodes: NodeObject[] = data.nodes.map((node) => ({ ...node }))
    const links: LinkObject[] = data.links.map((link) => ({
      ...link,
      source: link.source,
      target: link.target,
    }))

    return { nodes, links }
  }, [data])

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      requestAnimationFrame(() => {
        graphRef.current?.zoomToFit(400, 60)
      })
    }
  }, [graphData])

  if (graphData.nodes.length === 0) {
    return (
      <div className="graph-canvas__empty">
        <p className="govuk-body-s">No visual data available yet.</p>
      </div>
    )
  }

  return (
    <figure className="graph-canvas" style={{ height }}>
      {caption && <figcaption className="graph-canvas__caption govuk-body-s">{caption}</figcaption>}
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        height={Math.max(height - 40, 220)}
        backgroundColor="#f3f2f1"
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkColor={(link: LinkObject) => {
          const typed = link as ForceGraphLink
          const sourceId = typeof typed.source === 'object' ? (typed.source as NodeObject).id : typed.source
          const targetId = typeof typed.target === 'object' ? (typed.target as NodeObject).id : typed.target
          
          if (hoveredNode === sourceId || hoveredNode === targetId) {
            return linkHighlightColour
          }
          if (selectedNode === sourceId || selectedNode === targetId) {
            return linkHighlightColour
          }
          return linkColour
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
          const baseRadius = 10 // Increased from 6 to 10
          const isHovered = hoveredNode === typed.id
          const isSelected = selectedNode === typed.id
          const radius = (isHovered || isSelected) ? baseRadius * 1.3 : baseRadius

          // Draw node circle
          ctx.fillStyle = (isHovered || isSelected) ? nodeHoverColour : nodeColour
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
          setSelectedNode(node ? (node.id?.toString() ?? null) : null)
        }}
        cooldownTicks={80}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 60)}
      />
    </figure>
  )
})

GraphCanvas.displayName = 'GraphCanvas'

export default GraphCanvas

