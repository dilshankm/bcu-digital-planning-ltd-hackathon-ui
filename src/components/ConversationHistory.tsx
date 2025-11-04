import type { ChatMessage } from '@/types/session'

const roleLabels: Record<string, string> = {
  user: 'You',
  assistant: 'Assistant',
  system: 'System',
}

const formatTimestamp = (value?: string) => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toLocaleString()
}

interface ConversationHistoryProps {
  messages: ChatMessage[]
}

export const ConversationHistory = ({ messages }: ConversationHistoryProps) => {
  if (!messages.length) {
    return (
      <div className="conversation-history conversation-history--empty">
        <p className="govuk-body-s">Conversation history will appear here once you ask a question.</p>
      </div>
    )
  }

  return (
    <div className="conversation-history" aria-live="polite">
      <h2 className="govuk-heading-m">Conversation history</h2>
      <ol className="govuk-list conversation-history__list">
        {messages.map((message, index) => {
          const roleLabel = roleLabels[message.role] ?? message.role
          const timestamp = formatTimestamp(message.timestamp)
          return (
            <li key={`${message.role}-${index}`} className="conversation-history__item">
              <div className="conversation-history__meta">
                <span className="conversation-history__role">{roleLabel}</span>
                {timestamp && <span className="conversation-history__timestamp">{timestamp}</span>}
              </div>
              <p className="govuk-body conversation-history__content">{message.content}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default ConversationHistory
