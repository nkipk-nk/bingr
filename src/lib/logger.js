/**
 * Bingr structured logger
 * - In development: console output with context
 * - In production: forwards to Sentry (if initialised)
 * - Never throws — logging must never crash the app
 */

const isDev = import.meta.env.DEV

function getContext() {
  try {
    return {
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 80),
    }
  } catch {
    return {}
  }
}

export const logger = {
  /**
   * Log an informational event (not an error)
   */
  info(message, data = {}) {
    if (isDev) {
      console.info(`[bingr] ${message}`, data)
    }
  },

  /**
   * Log a warning — something unexpected but not fatal
   */
  warn(message, data = {}) {
    if (isDev) {
      console.warn(`[bingr:warn] ${message}`, data)
    }
    try {
      if (window.__Sentry__) {
        window.__Sentry__.captureMessage(message, {
          level: 'warning',
          extra: { ...data, ...getContext() },
        })
      }
    } catch {}
  },

  /**
   * Log an error with full context
   * @param {string} message - human readable description of what failed
   * @param {Error|unknown} error - the actual error object
   * @param {object} context - extra context (userId, action, itemId etc.)
   */
  error(message, error, context = {}) {
    const ctx = { ...getContext(), ...context }

    if (isDev) {
      console.error(`[bingr:error] ${message}`, { error, context: ctx })
    }

    try {
      if (window.__Sentry__) {
        window.__Sentry__.withScope(scope => {
          scope.setTag('source', 'bingr-client')
          scope.setContext('bingr', ctx)
          if (context.userId) scope.setUser({ id: context.userId })
          if (error instanceof Error) {
            window.__Sentry__.captureException(error)
          } else {
            window.__Sentry__.captureMessage(`${message}: ${JSON.stringify(error)}`, 'error')
          }
        })
      }
    } catch {}
  },

  /**
   * Set the current user for Sentry session context
   */
  setUser(userId, email) {
    try {
      if (window.__Sentry__) {
        window.__Sentry__.setUser({ id: userId, email })
      }
    } catch {}
  },

  /**
   * Clear user context on sign out
   */
  clearUser() {
    try {
      if (window.__Sentry__) {
        window.__Sentry__.setUser(null)
      }
    } catch {}
  },
}
