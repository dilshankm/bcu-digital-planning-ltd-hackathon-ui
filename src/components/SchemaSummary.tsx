interface SchemaSummaryProps {
  value: unknown
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const renderList = (heading: string, items: string[], testId?: string) => (
  <div className="schema-summary__section" data-testid={testId}>
    <h3 className="govuk-heading-s govuk-!-margin-bottom-2">{heading}</h3>
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
    extractDistinctStrings(record.nodeLabels) || extractDistinctStrings(record.labels) || extractDistinctStrings(record.nodes)
  const relationshipTypes =
    extractDistinctStrings(record.relationshipTypes) || extractDistinctStrings(record.relationships) || extractDistinctStrings(record.edges)
  const propertyKeys = extractDistinctStrings(record.propertyKeys)

  return (
    <div className="schema-summary">
      {nodeLabels.length > 0 && renderList('Node labels', nodeLabels, 'schema-node-labels')}
      {relationshipTypes.length > 0 &&
        renderList('Relationship types', relationshipTypes, 'schema-relationship-types')}
      {propertyKeys.length > 0 && renderList('Property keys', propertyKeys, 'schema-property-keys')}

      {nodeLabels.length === 0 && relationshipTypes.length === 0 && propertyKeys.length === 0 && (
        <p className="govuk-body-s govuk-!-margin-top-2">
          No structured schema summary detected. Use the raw response for further inspection.
        </p>
      )}
    </div>
  )
}

export default SchemaSummary

