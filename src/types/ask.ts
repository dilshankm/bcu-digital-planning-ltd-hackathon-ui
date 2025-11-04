export interface AskQuestionRequest {
  question: string
}

export interface AskQuestionResponse {
  answer: string
  sources?: string[]
  [key: string]: unknown
}

