import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

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
        // Profile doesn't exist yet — create it (handles accounts created before the trigger)
        const generated = 'user_' + session.user.id.replace(/-/g, '').slice(0, 8)
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: session.user.id, username: generated })
          .select()
          .single()
        setProfile(created)
      } else {
        setProfile(data)
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
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .select()
        .single()
      if (error) return { error: error.message }
      setProfile(data)
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
      .single()
    return !data // true = available
  }, [])

  return { profile, loading, updateProfile, checkUsername, reload: load }
}
