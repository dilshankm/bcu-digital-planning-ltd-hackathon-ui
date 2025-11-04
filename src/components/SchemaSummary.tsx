interface SchemaSummaryProps {
  value: unknown
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const renderList = (heading: string, items: string[], count?: number, testId?: string) => (
  <div className="schema-summary__section" data-testid={testId}>
    <h3 className="govuk-heading-s govuk-!-margin-bottom-2">
      {heading} {count !== undefined && <span className="schema-summary__count">({count})</span>}
    </h3>
    <ul className="govuk-list govuk-list--bullet govuk-!-margin-bottom-4">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
)

const extractDistinctStrings = (value: unknown): string[] => {
  if (isStringArray(value)) {
    return Array.from(new Set(value)).sort()
  }

  if (Array.isArray(value)) {
    const variants = value
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }
        if (item && typeof item === 'object') {
          if ('label' in item && typeof (item as { label: unknown }).label === 'string') {
            return (item as { label: string }).label
          }
          if ('name' in item && typeof (item as { name: unknown }).name === 'string') {
            return (item as { name: string }).name
          }
          if ('type' in item && typeof (item as { type: unknown }).type === 'string') {
            return (item as { type: string }).type
          }
        }
        return undefined
      })
      .filter((item): item is string => Boolean(item))

    return Array.from(new Set(variants)).sort()
  }

  return []
}

export const SchemaSummary = ({ value }: SchemaSummaryProps) => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>

  const nodeLabels =
    extractDistinctStrings(record.node_types) ||
    extractDistinctStrings(record.nodeLabels) ||
    extractDistinctStrings(record.labels) ||
    extractDistinctStrings(record.nodes)
  const relationshipTypes =
    extractDistinctStrings(record.relationship_types) ||
    extractDistinctStrings(record.relationshipTypes) ||
    extractDistinctStrings(record.relationships) ||
    extractDistinctStrings(record.edges)
  const propertyKeys = extractDistinctStrings(record.propertyKeys) || extractDistinctStrings(record.property_keys)

  // Extract counts from the schema if available
  const nodeCounts = record.node_counts as Record<string, number> | undefined
  const relationshipCounts = record.relationship_counts as Record<string, number> | undefined
  const totalNodes = typeof record.total_nodes === 'number' ? record.total_nodes : undefined
  const totalRelationships = typeof record.total_relationships === 'number' ? record.total_relationships : undefined

  const schemaDescription =
    typeof record.schema_description === 'string'
      ? record.schema_description
      : typeof record.description === 'string'
        ? record.description
        : null

  return (
    <div className="schema-summary">
      {schemaDescription && (
        <div className="govuk-!-margin-bottom-4">
          <p className="govuk-body">{schemaDescription}</p>
        </div>
      )}

      {/* Display statistics if available */}
      {(totalNodes !== undefined || totalRelationships !== undefined) && (
        <div className="schema-summary__stats govuk-!-margin-bottom-4">
          {totalNodes !== undefined && (
            <div className="schema-summary__stat">
              <span className="schema-summary__stat-label">Total Nodes:</span>
              <span className="schema-summary__stat-value">{totalNodes.toLocaleString()}</span>
            </div>
          )}
          {totalRelationships !== undefined && (
            <div className="schema-summary__stat">
              <span className="schema-summary__stat-label">Total Relationships:</span>
              <span className="schema-summary__stat-value">{totalRelationships.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {nodeLabels.length > 0 && (
        <div className="schema-summary__section">
          <h3 className="govuk-heading-s govuk-!-margin-bottom-2">
            Node types <span className="schema-summary__count">({nodeLabels.length})</span>
          </h3>
          <ul className="govuk-list govuk-list--bullet govuk-!-margin-bottom-4">
            {nodeLabels.map((item) => (
              <li key={item}>
                {item}
                {nodeCounts && nodeCounts[item] !== undefined && (
                  <span className="schema-summary__item-count"> - {nodeCounts[item].toLocaleString()} nodes</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {relationshipTypes.length > 0 && (
        <div className="schema-summary__section">
          <h3 className="govuk-heading-s govuk-!-margin-bottom-2">
            Relationship types <span className="schema-summary__count">({relationshipTypes.length})</span>
          </h3>
          <ul className="govuk-list govuk-list--bullet govuk-!-margin-bottom-4">
            {relationshipTypes.map((item) => (
              <li key={item}>
                {item}
                {relationshipCounts && relationshipCounts[item] !== undefined && (
                  <span className="schema-summary__item-count"> - {relationshipCounts[item].toLocaleString()} relationships</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {propertyKeys.length > 0 && renderList('Property keys', propertyKeys, propertyKeys.length, 'schema-property-keys')}

      {nodeLabels.length === 0 && relationshipTypes.length === 0 && propertyKeys.length === 0 && (
        <p className="govuk-body-s govuk-!-margin-top-2">
          No structured schema summary detected. Use the raw response for further inspection.
        </p>
      )}
    </div>
  )
}

export default SchemaSummary

