import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Initialize Sentry only when VITE_SENTRY_DSN is configured
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn && typeof sentryDsn === 'string' && sentryDsn.trim() !== '') {
  Sentry.init({
    dsn: sentryDsn.trim(),
    environment: import.meta.env.MODE || 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary moduleName="Root Application">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

