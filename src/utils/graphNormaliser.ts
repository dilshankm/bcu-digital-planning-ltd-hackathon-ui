export interface NormalisedGraphNode {
  id: string
  label?: string
  properties?: Record<string, unknown>
}

export interface NormalisedGraphLink {
  id: string
  source: string
  target: string
  label?: string
  properties?: Record<string, unknown>
}

export interface NormalisedGraph {
  nodes: NormalisedGraphNode[]
  links: NormalisedGraphLink[]
}

const ID_CANDIDATES = ['id', 'ID', 'uuid', 'uid', 'identifier', 'identity']

const extractProperties = (raw: unknown): Record<string, unknown> | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }

  if ('properties' in raw && typeof (raw as { properties?: unknown }).properties === 'object') {
    return (raw as { properties: Record<string, unknown> }).properties
  }

  const entries = Object.entries(raw as Record<string, unknown>).filter(([key]) =>
    !['id', 'ID', 'uuid', 'uid', 'identifier', 'identity', 'labels', 'type', 'label'].includes(key),
  )

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

const extractId = (raw: unknown): string | undefined => {
  if (raw === null || raw === undefined) {
    return undefined
  }

  if (typeof raw === 'string' || typeof raw === 'number') {
    return String(raw)
  }

  if (typeof raw === 'object') {
    for (const key of ID_CANDIDATES) {
      if (key in (raw as Record<string, unknown>)) {
        const value = (raw as Record<string, unknown>)[key]
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value)
        }
      }
    }

    if ('properties' in raw && typeof (raw as { properties?: unknown }).properties === 'object') {
      const properties = (raw as { properties: Record<string, unknown> }).properties
      for (const key of ID_CANDIDATES) {
        const value = properties[key]
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value)
        }
      }
    }
  }

  return undefined
}

const extractLabel = (raw: unknown): string | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }

  if ('label' in raw && typeof (raw as { label?: unknown }).label === 'string') {
    return (raw as { label: string }).label
  }

  if ('type' in raw && typeof (raw as { type?: unknown }).type === 'string') {
    return (raw as { type: string }).type
  }

  if ('labels' in raw && Array.isArray((raw as { labels?: unknown }).labels)) {
    const labels = (raw as { labels: unknown[] }).labels.filter((item): item is string => typeof item === 'string')
    if (labels.length > 0) {
      return labels.join(', ')
    }
  }

  return undefined
}

interface RegisterContext {
  nodes: Map<string, NormalisedGraphNode>
  links: NormalisedGraphLink[]
}

const registerNode = (
  context: RegisterContext,
  raw: unknown,
  fallbackId?: string,
  fallbackLabel?: string,
): NormalisedGraphNode => {
  let id = extractId(raw)
  if (!id && fallbackId) {
    id = fallbackId
  }
  if (!id) {
    id = `node-${context.nodes.size + 1}`
  }

  const existing = context.nodes.get(id)
  if (existing) {
    return existing
  }

  const label = extractLabel(raw) ?? fallbackLabel
  const properties = extractProperties(raw)

  const node: NormalisedGraphNode = {
    id,
    ...(label ? { label } : {}),
    ...(properties && Object.keys(properties).length > 0 ? { properties } : {}),
  }

  context.nodes.set(id, node)
  return node
}

const registerLink = (context: RegisterContext, raw: unknown) => {
  if (!raw || typeof raw !== 'object') {
    return
  }

  const sourceCandidate =
    (raw as Record<string, unknown>).source ??
    (raw as Record<string, unknown>).start ??
    (raw as Record<string, unknown>).startNode ??
    (raw as Record<string, unknown>).from ??
    (raw as Record<string, unknown>).out

  const targetCandidate =
    (raw as Record<string, unknown>).target ??
    (raw as Record<string, unknown>).end ??
    (raw as Record<string, unknown>).endNode ??
    (raw as Record<string, unknown>).to ??
    (raw as Record<string, unknown>).in

  if (!sourceCandidate || !targetCandidate) {
    return
  }

  const source = registerNode(context, sourceCandidate)
  const target = registerNode(context, targetCandidate)

  const id = extractId(raw) ?? `link-${context.links.length + 1}`
  const label = extractLabel(raw)
  const properties = extractProperties(raw)

  context.links.push({
    id,
    source: source.id,
    target: target.id,
    ...(label ? { label } : {}),
    ...(properties && Object.keys(properties).length > 0 ? { properties } : {}),
  })
}

const normaliseValue = (context: RegisterContext, value: unknown) => {
  if (value === null || value === undefined) {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => normaliseValue(context, item))
    return
  }

  if (typeof value !== 'object') {
    registerNode(context, value)
    return
  }

  const record = value as Record<string, unknown>

  if ('nodes' in record && Array.isArray(record.nodes)) {
    record.nodes.forEach((node, index) => registerNode(context, node, `node-${context.nodes.size + index + 1}`))
  }

  if ('relationships' in record && Array.isArray(record.relationships)) {
    record.relationships.forEach((relationship) => registerLink(context, relationship))
  }

  if ('links' in record && Array.isArray(record.links)) {
    record.links.forEach((link) => registerLink(context, link))
  }

  if ('edges' in record && Array.isArray(record.edges)) {
    record.edges.forEach((edge) => registerLink(context, edge))
  }

  if ('node' in record) {
    registerNode(context, record.node)
  }

  if ('neighbors' in record && Array.isArray(record.neighbors)) {
    record.neighbors.forEach((neighbour) => registerNode(context, neighbour))
  }

  if ('neighbours' in record && Array.isArray(record.neighbours)) {
    record.neighbours.forEach((neighbour) => registerNode(context, neighbour))
  }

  if ('source' in record || 'target' in record || 'start' in record || 'end' in record) {
    registerLink(context, record)
  }

  if ('items' in record && Array.isArray(record.items)) {
    record.items.forEach((item) => normaliseValue(context, item))
  }
}

export const normaliseGraphData = (input: unknown): NormalisedGraph => {
  const context: RegisterContext = {
    nodes: new Map<string, NormalisedGraphNode>(),
    links: [],
  }

  normaliseValue(context, input)

  if (context.nodes.size === 0 && input && typeof input === 'object') {
    registerNode(context, input)
  }

  return {
    nodes: Array.from(context.nodes.values()),
    links: context.links,
  }
}

