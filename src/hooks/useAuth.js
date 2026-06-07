import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { friendlyAuthError } from '../lib/errors'

const authAttempts = { count: 0, resetAt: 0 }
const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000

function checkRateLimit() {
  const now = Date.now()
  if (now > authAttempts.resetAt) { authAttempts.count = 0; authAttempts.resetAt = now + WINDOW_MS }
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
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) logger.error('Failed to restore session', error)
        setSession(data.session)
      })
      .catch(err => logger.error('getSession threw', err))
      .finally(() => setLoading(false))

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_OUT') logger.clearUser()
      if (event === 'SIGNED_IN' && session?.user) logger.setUser(session.user.id, session.user.email)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, username) => {
    try {
      checkRateLimit()
      // Check username availability before creating account
      if (username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.toLowerCase())
          .single()
        if (existing) return { data: null, error: { message: 'That username is already taken.' } }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) return { data: null, error: { message: friendlyAuthError(error.message) } }

      // Save username immediately if we have user.id
      // Works whether email confirm is on or off
      if (data.user?.id && username) {
        await supabase.from('profiles')
          .upsert({
            id: data.user.id,
            username: username.toLowerCase(),
            username_set: true,
          }, { onConflict: 'id' })
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
        email: email.trim().toLowerCase(), password,
      })
      if (error) return { data: null, error: { message: friendlyAuthError(error.message) } }
      logger.info('User signed in')
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }

  const signOut = async () => {
    try { await supabase.auth.signOut() }
    catch (err) { logger.error('Sign out threw', err) }
  }

  const deleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) { logger.error('Account deletion failed', error); return { error: 'Deletion failed. Please contact support@bingr.app.' } }
      await supabase.auth.signOut()
      return { error: null }
    } catch (err) {
      logger.error('deleteAccount threw', err)
      return { error: 'Unexpected error. Please contact support@bingr.app.' }
    }
  }

  return { session, loading, signUp, signIn, signOut, deleteAccount }
}
