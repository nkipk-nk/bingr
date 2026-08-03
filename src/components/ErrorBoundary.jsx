import { Component } from 'react'
import { logger } from '../lib/logger'
import Button from './ui/Button'
import styles from './ErrorBoundary.module.css'

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
      <div className={styles.wrap}>
        <div className={styles.card}>
          <img src="/logo.png" alt="bingr" className={styles.logo} />
          <div className={styles.title}>Something went wrong</div>
          <p className={styles.desc}>
            bingr hit an unexpected error. Your watchlist and data are safe —
            this is just a display issue. Try refreshing the page.
          </p>
          {this.state.errorId && (
            <p className={styles.errorId}>Error ID: {this.state.errorId}</p>
          )}
          <Button variant="primary" onClick={() => this.handleReset()}>Reload bingr</Button>
        </div>
      </div>
    )
  }
}
