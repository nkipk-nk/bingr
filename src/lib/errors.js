/**
 * Bingr error utilities
 * - Typed errors for different failure modes
 * - Retry logic with exponential backoff
 * - User-friendly message mapping
 */

export class BingrError extends Error {
  constructor(message, code, context = {}) {
    super(message)
    this.name = 'BingrError'
    this.code = code
    this.context = context
  }
}

export class NetworkError extends BingrError {
  constructor(message, context) {
    super(message, 'NETWORK_ERROR', context)
    this.name = 'NetworkError'
  }
}

export class AuthError extends BingrError {
  constructor(message, context) {
    super(message, 'AUTH_ERROR', context)
    this.name = 'AuthError'
  }
}

export class DatabaseError extends BingrError {
  constructor(message, context) {
    super(message, 'DATABASE_ERROR', context)
    this.name = 'DatabaseError'
  }
}

/**
 * Assert that a Supabase mutation actually affected a row.
 *
 * PostgREST returns 200/204 with NO error when RLS filters a write down to
 * zero rows. Checking only `error` therefore reports success for writes that
 * silently did nothing — this is what hid the signup username loss (C4) and
 * the undeletable-hidden-comment bug (C8) in the audit.
 *
 * Usage: pass a query that ends in `.select()` so rows come back.
 *
 *   const { data, error } = await supabase.from('x').delete().eq(...).select()
 *   assertAffected({ data, error }, 'deleteComment', { commentId })
 *
 * @throws {DatabaseError} if the query errored or matched no rows
 */
export function assertAffected({ data, error }, label, context = {}) {
  if (error) {
    throw new DatabaseError(`${label} failed`, { supabaseError: error.message, ...context })
  }
  const rows = Array.isArray(data) ? data.length : data ? 1 : 0
  if (rows === 0) {
    throw new DatabaseError(
      `${label} affected no rows — the record is missing or blocked by access rules`,
      { ...context, zeroRows: true },
    )
  }
  return data
}

/**
 * Retry an async function with exponential backoff
 * @param {function} fn - async function to retry
 * @param {object} opts
 * @param {number} opts.retries - max attempts (default 3)
 * @param {number} opts.baseDelay - initial delay ms (default 500)
 * @param {string} opts.label - label for logging
 */
export async function withRetry(fn, { retries = 3, baseDelay = 500, label = 'operation' } = {}) {
  let lastError
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const isLast = attempt === retries
      if (!isLast) {
        // `label` was previously accepted by every caller and silently
        // discarded — a retried operation's failures had no context at all
        // in dev console or Sentry until the final throw.
        console.warn(`[bingr] ${label} failed (attempt ${attempt}/${retries}), retrying…`, err)
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

/**
 * Map Supabase/auth error messages to friendly user-facing strings
 */
export function friendlyAuthError(message = '') {
  const m = message.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Incorrect email or password.'
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if (m.includes('user already registered')) return 'An account with this email already exists.'
  if (m.includes('password should be')) return 'Password must be at least 6 characters.'
  if (m.includes('rate limit') || m.includes('too many requests')) return 'Too many attempts. Please wait a few minutes and try again.'
  if (m.includes('network') || m.includes('fetch')) return 'Network error. Please check your connection.'
  if (m.includes('email rate limit')) return 'Email sending limit reached. Please wait before requesting another email.'
  return message || 'Something went wrong. Please try again.'
}

/**
 * Sanitise user-provided strings before storing
 * - Trims whitespace
 * - Strips null bytes
 * - Caps length
 */
export function sanitise(str, maxLength = 500) {
  if (typeof str !== 'string') return ''
  return str.trim().replace(/\0/g, '').slice(0, maxLength)
}
