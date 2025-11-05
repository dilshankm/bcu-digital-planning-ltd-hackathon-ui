import { useMemo, useState } from 'react'

import AnswerPanel from '@/components/AnswerPanel'
import ConversationHistory from '@/components/ConversationHistory'
// import CsvImportForm from '@/components/CsvImportForm'
import GraphExplorer from '@/components/GraphExplorer'
import LoadingIndicator from '@/components/LoadingIndicator'
import PageLayout from '@/components/PageLayout'
import QuestionForm from '@/components/QuestionForm'
import SessionControls from '@/components/SessionControls'
import { useAskQuestion } from '@/hooks/useAskQuestion'
import { useSession } from '@/hooks/useSession'

type ActivePanel = 'ask' | 'explore' // | 'import'

const App = () => {
  const { sessionId, history, isLoading: sessionLoading, error: sessionError, refreshHistory, startNewSession } =
    useSession()
  const [question, setQuestion] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>('ask')
  const [askNotice, setAskNotice] = useState<string | null>(null)

  const { state, ask, reset: resetAskState, isLoading } = useAskQuestion({
    onSuccess: async () => {
      await refreshHistory()
      setAskNotice(null)
    },
    onError: (message) => {
      setAskNotice(message)
    },
  })

  const handleSubmit = async () => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion) {
      setValidationError('Enter a question to continue')
      return
    }

    setValidationError(null)
    let activeSessionId = sessionId

    if (!activeSessionId) {
      activeSessionId = await startNewSession()

      if (!activeSessionId) {
        setAskNotice('Unable to start a conversation session. Please try again or check the API endpoint.')
        return
      }
    }

    await ask(trimmedQuestion, activeSessionId)
  }

  const description = useMemo(
    () => (
      <>
        Ask questions about healthcare patient data. This intelligent assistant helps you explore
        information about patients, conditions, procedures, and clinical observations.
      </>
    ),
    [],
  )

  return (
    <PageLayout title="Healthcare Assistant" description={description}>
      <nav className="app-navigation" aria-label="Primary">
        <ul className="app-navigation__list">
          <li className="app-navigation__item">
            <button
              type="button"
              className={`app-navigation__button ${activePanel === 'ask' ? 'app-navigation__button--active' : ''}`}
              onClick={() => setActivePanel('ask')}
            >
              Ask assistant
            </button>
          </li>
          <li className="app-navigation__item">
            <button
              type="button"
              className={`app-navigation__button ${
                activePanel === 'explore' ? 'app-navigation__button--active' : ''
              }`}
              onClick={() => setActivePanel('explore')}
            >
              Explore graph
            </button>
          </li>
          {/* <li className="app-navigation__item">
            <button
              type="button"
              className={`app-navigation__button ${
                activePanel === 'import' ? 'app-navigation__button--active' : ''
              }`}
              onClick={() => setActivePanel('import')}
            >
              Extend schema
            </button>
          </li> */}
        </ul>
      </nav>

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

      {sessionError && (
        <div className="govuk-warning-text govuk-!-margin-bottom-4" role="alert">
          <span className="govuk-warning-text__icon" aria-hidden="true">
            !
          </span>
          <strong className="govuk-warning-text__text">
            <span className="govuk-warning-text__assistive">Warning</span>
            {sessionError}
          </strong>
        </div>
      )}

      {activePanel === 'ask' && (
        <div>
          <SessionControls
            isLoading={sessionLoading}
            onNewSession={async () => {
              const id = await startNewSession()
              if (id) {
                setQuestion('')
                resetAskState() // Clear the answer and results
                setValidationError(null)
                setAskNotice('Started a new session. Ask your next question to build context.')
              }
              return id
            }}
          />

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

          {askNotice && (
            <div className="govuk-inset-text govuk-!-margin-top-2" role="status">
              {askNotice}
            </div>
          )}

          {(isLoading || sessionLoading) && (
            <div className="govuk-!-margin-top-3" aria-live="polite">
              <LoadingIndicator message={sessionLoading ? 'Preparing conversation session…' : undefined} />
            </div>
          )}

          {state.status === 'success' && state.data && <AnswerPanel response={state.data} />}

          <ConversationHistory messages={history} />
        </div>
      )}

      {activePanel === 'explore' && <GraphExplorer />}

      {/* {activePanel === 'import' && <CsvImportForm />} */}
    </PageLayout>
  )
}

export default App
