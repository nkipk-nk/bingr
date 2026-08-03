import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './styles/tokens.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'

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

// Dev-only design-system component sandbox (Phase 0 of the implementation
// plan) — verify each primitive in isolation before wiring it into any
// production screen. Dynamic import behind a static DEV check so it's fully
// tree-shaken out of production builds, not just unreachable at runtime.
async function renderRoot() {
  const root = createRoot(document.getElementById('root'))
  if (import.meta.env.DEV && window.location.pathname === '/_dev/components') {
    const { default: ComponentPlayground } = await import('./dev/ComponentPlayground.jsx')
    root.render(<StrictMode><ComponentPlayground /></StrictMode>)
    return
  }
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
renderRoot()
