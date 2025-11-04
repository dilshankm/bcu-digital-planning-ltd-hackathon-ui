declare module 'react-force-graph-2d' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react'

  export interface NodeObject {
    id?: string | number
    x?: number
    y?: number
    [key: string]: unknown
  }

  export interface LinkObject {
    source?: string | number | NodeObject
    target?: string | number | NodeObject
    [key: string]: unknown
  }

  export interface ForceGraphMethods {
    zoomToFit: (ms?: number, padding?: number) => void
  }

  export interface ForceGraphProps<NodeType = NodeObject, LinkType = LinkObject> {
    graphData: {
      nodes: NodeType[]
      links: LinkType[]
    }
    height?: number
    backgroundColor?: string
    linkDirectionalArrowLength?: number
    linkDirectionalArrowRelPos?: number
    linkCurvature?: number
    linkColor?: (link: LinkType) => string
    linkLabel?: (link: LinkType) => string
    nodeLabel?: (node: NodeType) => string
    nodeCanvasObject?: (node: NodeType, ctx: CanvasRenderingContext2D, globalScale: number) => void
    onNodeHover?: (node: NodeType | null) => void
    onNodeClick?: (node: NodeType | null) => void
    cooldownTicks?: number
    onEngineStop?: () => void
  }

  const ForceGraph2D: ForwardRefExoticComponent<ForceGraphProps & RefAttributes<ForceGraphMethods>>

  export default ForceGraph2D
  export { ForceGraphMethods, NodeObject, LinkObject }
}

