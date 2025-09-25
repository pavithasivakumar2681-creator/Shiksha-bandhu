import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <div style={{ position: 'fixed', top: 8, right: 8, background: '#f97316', color: 'white', borderRadius: 16, padding: '4px 10px', fontSize: 12 }}>Shiksha Bandhu</div>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
