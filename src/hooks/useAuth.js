import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { friendlyAuthError } from '../lib/errors'

// Simple in-memory rate limiter for auth attempts
const authAttempts = { count: 0, resetAt: 0 }
const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function checkRateLimit() {
  const now = Date.now()
  if (now > authAttempts.resetAt) {
    authAttempts.count = 0
    authAttempts.resetAt = now + WINDOW_MS
  }
  authAttempts.count++
  if (authAttempts.count > MAX_ATTEMPTS) {
    const waitMin = Math.ceil((authAttempts.resetAt - now) / 60000)
    throw new Error(`Too many attempts. Please wait ${waitMin} minute${waitMin > 1 ? 's' : ''}.`)
  }
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore existing session
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) logger.error('Failed to restore session', error)
        setSession(data.session)
      })
      .catch(err => logger.error('getSession threw', err))
      .finally(() => setLoading(false))

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_OUT') logger.info('User signed out')
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    try {
      checkRateLimit()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // Redirect to the actual site after email confirmation
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        logger.warn('Sign up failed', { email: email.split('@')[1], message: error.message })
        return { data: null, error: { message: friendlyAuthError(error.message) } }
      }
      logger.info('User signed up')
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const signIn = async (email, password) => {
    try {
      checkRateLimit()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) {
        logger.warn('Sign in failed', { message: error.message })
        return { data: null, error: { message: friendlyAuthError(error.message) } }
      }
      logger.info('User signed in')
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) logger.error('Sign out error', error)
    } catch (err) {
      logger.error('Sign out threw', err)
    }
  }

  /**
   * Permanently delete the current user's account and all their data.
   * Calls a Supabase Edge Function that runs with service role privileges.
   * Returns { error } or null.
   */
  const deleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) {
        logger.error('Account deletion failed', error)
        return { error: 'Deletion failed. Please contact support@bingr.app.' }
      }
      await supabase.auth.signOut()
      logger.info('Account deleted')
      return { error: null }
    } catch (err) {
      logger.error('deleteAccount threw', err)
      return { error: 'Unexpected error. Please contact support@bingr.app.' }
    }
  }

  return { session, loading, signUp, signIn, signOut, deleteAccount }
}
