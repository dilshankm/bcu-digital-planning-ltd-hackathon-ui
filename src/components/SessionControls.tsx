interface SessionControlsProps {
  isLoading: boolean
  onNewSession: () => Promise<string | null> | void
}

export const SessionControls = ({
  isLoading,
  onNewSession,
}: SessionControlsProps) => (
  <div className="session-controls govuk-!-margin-bottom-4">
    <div className="session-controls__actions">
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
