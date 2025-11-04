import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAll } from 'govuk-frontend'
import App from './App.tsx'
import './styles/main.scss'

initAll()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
