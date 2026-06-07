import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { detectCountryCode } from '../lib/geo'

export function useProfile(session) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!session) { setProfile(null); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        // Google OAuth or trigger missed — create profile with temp username
        const tempUsername = 'user_' + session.user.id.replace(/-/g, '').slice(0, 8)
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: session.user.id, username: tempUsername, username_set: false })
          .select()
          .single()
        setProfile(created)
      } else {
        setProfile(data)
        // Detect and store country on first login if not already set
        if (!data.country_code) {
          detectCountryCode().then(async (code) => {
            if (code) {
              const { data: updated } = await supabase
                .from('profiles')
                .update({ country_code: code, last_seen_at: new Date().toISOString() })
                .eq('id', session.user.id)
                .select()
                .single()
              if (updated) setProfile(updated)
            }
          })
        } else {
          supabase.from('profiles')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', session.user.id)
        }
      }
    } catch (err) {
      logger.error('useProfile.load failed', err, { userId: session?.user.id })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const updateProfile = useCallback(async (patch) => {
    if (!session || !profile) return { error: null }
    try {
      // If setting username for the first time, mark username_set = true
      const extra = patch.username ? { username_set: true } : {}
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...patch, ...extra, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .select()
        .single()
      if (error) return { error: error.message }
      setProfile(data)
      if (patch.username) setNeedsUsername(false)
      return { error: null }
    } catch (err) {
      logger.error('updateProfile failed', err, { userId: session.user.id })
      return { error: 'Update failed. Please try again.' }
    }
  }, [session, profile])

  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3) return false
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', session?.user?.id || '') // exclude current user
      .single()
    return !data // true = available
  }, [session])

  return { profile, loading, updateProfile, checkUsername, reload: load }
}
