interface SessionControlsProps {
  sessionId: string | null
  isLoading: boolean
  onRefresh: () => Promise<void> | void
  onNewSession: () => Promise<string | null> | void
}

export const SessionControls = ({
  sessionId,
  isLoading,
  onRefresh,
  onNewSession,
}: SessionControlsProps) => (
  <div className="session-controls govuk-!-margin-bottom-4">
    {sessionId && (
      <div className="session-controls__details">
        <span className="govuk-body-s govuk-!-font-weight-bold">Session</span>
        <span className="govuk-body-s" data-testid="current-session-id">
          {sessionId}
        </span>
        {isLoading && <span className="govuk-tag govuk-tag--blue">Loading</span>}
      </div>
    )}
    <div className="session-controls__actions">
      <button
        className="govuk-button govuk-button--secondary"
        type="button"
        onClick={() => {
          void onRefresh()
        }}
        disabled={isLoading || !sessionId}
      >
        Refresh history
      </button>
      <button
        className="govuk-button govuk-button--secondary"
        type="button"
        onClick={() => {
          void onNewSession()
        }}
        disabled={isLoading}
      >
        Start new session
      </button>
    </div>
  </div>
)

export default SessionControls
