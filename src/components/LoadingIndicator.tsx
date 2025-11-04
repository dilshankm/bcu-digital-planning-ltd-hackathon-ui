interface LoadingIndicatorProps {
  message?: string
}

export const LoadingIndicator = ({ message = 'Working on your answer...' }: LoadingIndicatorProps) => (
  <div className="loading-indicator" role="status" aria-live="polite">
    <span className="loading-indicator__spinner" aria-hidden="true" />
    <span>{message}</span>
  </div>
)

export default LoadingIndicator

