import type { FormEventHandler } from 'react'
import clsx from 'clsx'

interface QuestionFormProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
  validationError?: string | null
}

export const QuestionForm = ({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  validationError,
}: QuestionFormProps) => {
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    onSubmit()
  }

  const formGroupClassName = clsx('govuk-form-group', {
    'govuk-form-group--error': Boolean(validationError),
  })

  const describedByIds = ['question-hint']

  if (validationError) {
    describedByIds.push('question-error')
  }

  return (
    <form noValidate className="ask-form" onSubmit={handleSubmit}>
      <div className={formGroupClassName}>
        <label className="govuk-label govuk-label--m" htmlFor="question">
          What would you like to know?
        </label>
        <div id="question-hint" className="govuk-hint">
          Enter one clear question about the data set. Avoid sensitive information.
        </div>
        {validationError && (
          <p id="question-error" className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span> {validationError}
          </p>
        )}
        <textarea
          id="question"
          name="question"
          className="govuk-textarea"
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={describedByIds.join(' ')}
          aria-invalid={validationError ? 'true' : undefined}
          spellCheck
          disabled={isLoading}
          required
        />
      </div>
      <div className="ask-form__actions">
        <button className="govuk-button" data-module="govuk-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Sending your question…' : 'Ask question'}
        </button>
      </div>
    </form>
  )
}

export default QuestionForm

