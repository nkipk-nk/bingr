import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { friendlyAuthError } from '../lib/errors'

// NOTE (M20): this is a UX nicety, not a security control — it lives in
// module state that resets on every page reload, so it stops nothing a
// motivated attacker couldn't trivially bypass. Its only real job is to give
// a user who's fat-fingered their password a few times an immediate,
// friendly "slow down" message without waiting on a round trip. The actual
// defence against credential-stuffing/brute-force is Supabase Auth's own
// server-side rate limiting, which this cannot weaken or replace and which
// applies regardless of what this function does.
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

  const signUp = async (email, password, username, country) => {
    try {
      checkRateLimit()
      // Check username availability before creating account.
      // .maybeSingle() — .single() throws (and logs a 406) for the expected
      // "no row" case, which is the common outcome here.
      if (username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.toLowerCase())
          .maybeSingle()
        if (existing) return { data: null, error: { message: 'That username is already taken.' } }
      }

      const cleanUsername = username ? username.toLowerCase().trim() : null

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          // Carried into auth.users.raw_user_meta_data so the handle_new_user()
          // trigger can populate the profile server-side. This is the only path
          // that works when email confirmation is enabled — in that mode signUp
          // returns no session, so the client UPDATE below is unauthenticated
          // and RLS filters it to zero rows.
          data: {
            ...(cleanUsername ? { username: cleanUsername } : {}),
            ...(country ? { country_code: country } : {}),
          },
        },
      })
      if (error) return { data: null, error: { message: friendlyAuthError(error.message) } }

      // Belt-and-braces: if we did get a session (email confirmation disabled),
      // write the profile directly too, in case the trigger hasn't been updated
      // to read the metadata yet. Retries cover trigger latency on row creation.
      if (data.user?.id && data.session && cleanUsername) {
        let saved = false
        for (let attempt = 1; attempt <= 5; attempt++) {
          await new Promise(r => setTimeout(r, attempt * 400))
          // .select() matters: an RLS-filtered UPDATE returns no error and no
          // rows, which the previous code counted as success and broke out of
          // the retry loop on the first attempt.
          const { data: rows, error: updateErr } = await supabase
            .from('profiles')
            .update({
              username: cleanUsername,
              username_set: true,
              ...(country ? { country_code: country } : {}),
            })
            .eq('id', data.user.id)
            .select()
          if (!updateErr && rows?.length) { saved = true; break }
        }
        if (!saved) {
          logger.error('Username save failed after retries', new Error('profile_update_no_rows'), {
            userId: data.user.id, hasSession: !!data.session,
          })
        }
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

  const updatePassword = async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: friendlyAuthError(error.message) }
      logger.info('Password updated')
      return { error: null }
    } catch (err) {
      logger.error('updatePassword threw', err)
      return { error: 'Unexpected error. Please try again.' }
    }
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

  return { session, loading, signUp, signIn, signOut, updatePassword, deleteAccount }
}
