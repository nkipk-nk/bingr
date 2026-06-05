import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Initialise Sentry — replace VITE_SENTRY_DSN in .env / Vercel env vars
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: 'bingr@1.0.0',
    // Sample 20% of normal traffic for performance, 100% of errors
    tracesSampleRate: 0.2,
    // Don't capture locally — only prod & staging
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Scrub sensitive fields from payloads before sending
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies
      if (event.user?.email) {
        // Hash email in Sentry — we get the domain for debugging but not PII
        event.user.email = event.user.email.replace(/^[^@]+/, '***')
      }
      return event
    },
  })
  // Expose Sentry on window so logger.js can reach it without a hard import cycle
  window.__Sentry__ = Sentry
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
