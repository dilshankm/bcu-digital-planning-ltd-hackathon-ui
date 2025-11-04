import { useMemo, useState } from 'react'

import { useAskQuestion } from '@/hooks/useAskQuestion'
import AnswerPanel from '@/components/AnswerPanel'
import LoadingIndicator from '@/components/LoadingIndicator'
import PageLayout from '@/components/PageLayout'
import QuestionForm from '@/components/QuestionForm'

const App = () => {
  const [question, setQuestion] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const { state, ask, isLoading } = useAskQuestion()

  const handleSubmit = async () => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion) {
      setValidationError('Enter a question to continue')
      return
    }

    setValidationError(null)
    await ask(trimmedQuestion)
  }

  const description = useMemo(
    () => (
      <>
        Ask the WMHTIA discovery knowledge base a single question. We return an
        evidence-backed answer along with any available sources to support rapid
        decision-making across the accelerator network.
      </>
    ),
    [],
  )

  return (
    <PageLayout title="Innovation insight" description={description}>
      {state.status === 'error' && state.error && (
        <div
          className="govuk-error-summary"
          aria-labelledby="error-summary-title"
          role="alert"
          tabIndex={-1}
          data-module="govuk-error-summary"
        >
          <h2 className="govuk-error-summary__title" id="error-summary-title">
            There is a problem
          </h2>
          <div className="govuk-error-summary__body">
            <ul className="govuk-list govuk-error-summary__list">
              <li>
                <a href="#question">{state.error}</a>
              </li>
            </ul>
          </div>
        </div>
      )}

      <QuestionForm
        value={question}
        onChange={(value) => {
          setQuestion(value)
          if (validationError && value.trim()) {
            setValidationError(null)
          }
        }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        validationError={validationError}
      />

      {isLoading && (
        <div className="govuk-!-margin-top-3" aria-live="polite">
          <LoadingIndicator />
        </div>
      )}

      {state.status === 'success' && state.data && <AnswerPanel response={state.data} />}
    </PageLayout>
  )
}

export default App
