import { memo, useEffect, useMemo, useRef } from 'react'
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
const nodeTextColour = '#0b0c0c'
const linkColour = '#505a5f'

type ForceGraphNode = NodeObject & NormalisedGraph['nodes'][number]
type ForceGraphLink = LinkObject & NormalisedGraph['links'][number]

interface GraphData {
  nodes: NodeObject[]
  links: LinkObject[]
}

export const GraphCanvas = memo(({ data, caption, height = 420 }: GraphCanvasProps) => {
  const graphRef = useRef<ForceGraphMethods | null>(null)

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
        linkColor={() => linkColour}
        linkCurvature={0.1}
        linkLabel={(link) => {
          const typed = link as ForceGraphLink
          return typed.label ?? ''
        }}
        nodeLabel={(node) => {
          const typed = node as ForceGraphNode
          const properties = typed.properties ? `\n${JSON.stringify(typed.properties, null, 2)}` : ''
          return `${typed.label ?? typed.id}${properties}`
        }}
        nodeCanvasObject={(node, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const typed = node as ForceGraphNode
          const label = typed.label ?? typed.id
          const fontSize = Math.max(12 / globalScale, 6)
          const radius = 6

          ctx.fillStyle = nodeColour
          ctx.beginPath()
          ctx.arc(typed.x ?? 0, typed.y ?? 0, radius, 0, 2 * Math.PI, false)
          ctx.fill()

          ctx.font = `${fontSize}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = nodeTextColour
          ctx.fillText(label, typed.x ?? 0, (typed.y ?? 0) + radius + 2)
        }}
        cooldownTicks={80}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 60)}
      />
    </figure>
  )
})

GraphCanvas.displayName = 'GraphCanvas'

export default GraphCanvas

