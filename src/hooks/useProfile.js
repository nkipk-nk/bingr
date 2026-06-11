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
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        const tempUsername = 'tmp_' + session.user.id.replace(/-/g, '').slice(0, 12)
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: session.user.id, username: tempUsername, username_set: false })
          .select()
          .single()
        data = created
      }

      setProfile(data)

      // Update last_seen_at silently
      supabase.from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', session.user.id)

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
      const extra = patch.username ? { username_set: true } : {}
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...patch, ...extra, updated_at: new Date().toISOString() })
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
      .neq('id', session?.user?.id || '')
      .single()
    return !data
  }, [session])

  return { profile, loading, updateProfile, checkUsername, reload: load }
}
