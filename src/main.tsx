import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAll } from 'govuk-frontend'
import App from './App.tsx'
import './styles/main.scss'

if (typeof document !== 'undefined' && document.body) {
  document.body.classList.add('govuk-frontend-supported', 'js-enabled')
}

initAll()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
