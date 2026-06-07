import { Component } from 'react'
import { logger } from '../lib/logger'

/**
 * React Error Boundary
 * Catches any unhandled render/lifecycle errors in the tree below.
 * Logs to Sentry and shows a friendly fallback UI.
 * The app NEVER white-screens.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorId: null }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    const errorId = `err_${Date.now()}`
    this.setState({ errorId })
    logger.error('React render error caught by ErrorBoundary', error, {
      componentStack: info?.componentStack?.slice(0, 500),
      errorId,
    })
  }

  handleReset() {
    this.setState({ hasError: false, errorId: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-page)', fontFamily: 'var(--font)', padding: '2rem',
      }}>
        <div style={{
          maxWidth: 480, width: '100%', textAlign: 'center',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '2.5rem 2rem',
        }}>
          <img src="/android-chrome-192x192.png" alt="bingr" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'contain', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            bingr hit an unexpected error. Your watchlist and data are safe —
            this is just a display issue. Try refreshing the page.
          </p>
          {this.state.errorId && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20, fontFamily: 'monospace' }}>
              Error ID: {this.state.errorId}
            </p>
          )}
          <button
            onClick={() => this.handleReset()}
            style={{
              padding: '10px 24px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}
          >Reload bingr</button>
        </div>
      </div>
    )
  }
}
