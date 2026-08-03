import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { sanitise } from '../lib/errors'

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

      // Update last_seen_at silently. NOTE: this was previously fired without
      // awaiting the query builder (a lazy thenable), so no request was ever
      // sent — last_seen_at was null for every user, which also made
      // FindPeople's "recently active" ordering meaningless.
      supabase.from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .then(({ error }) => {
          if (error) logger.warn('last_seen_at update failed', { message: error.message })
        })

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
      // Sanitise free-text fields at the boundary that actually reaches
      // Supabase, regardless of what the caller already trimmed.
      const cleanPatch = { ...patch }
      if ('display_name' in cleanPatch) cleanPatch.display_name = sanitise(cleanPatch.display_name, 50) || null
      if ('bio' in cleanPatch) cleanPatch.bio = sanitise(cleanPatch.bio, 300) || null
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...cleanPatch, ...extra, updated_at: new Date().toISOString() })
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
    // .maybeSingle() — .single() throws (and logs a 406) for the expected
    // "no row" case, which is the common outcome of an availability check.
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', session?.user?.id || '')
      .maybeSingle()
    return !data
  }, [session])

  // Full-account data export — the self-service half of the Privacy
  // Policy's portability promise. Queries every table that stores something
  // tied to this user; a table failing doesn't block the others (matches the
  // fault-tolerant Promise.allSettled pattern already used for public
  // profiles), so a partial export is still possible and the caller is told
  // exactly which sections came back incomplete.
  const exportAllData = useCallback(async () => {
    if (!session) return { error: 'You must be signed in.' }
    const uid = session.user.id

    const queries = {
      profile: supabase.from('profiles').select('*').eq('id', uid).single(),
      library: supabase.from('bingr_library').select('*').eq('user_id', uid),
      diary: supabase.from('bingr_diary').select('*').eq('user_id', uid),
      episodes: supabase.from('bingr_episodes').select('*').eq('user_id', uid),
      lists: supabase.from('bingr_lists').select('*').eq('user_id', uid),
      list_items: supabase.from('bingr_list_items').select('*').eq('user_id', uid),
      comments: supabase.from('bingr_comments').select('*').eq('user_id', uid),
      following: supabase.from('bingr_follows').select('following_id, created_at').eq('follower_id', uid),
      followers: supabase.from('bingr_follows').select('follower_id, created_at').eq('following_id', uid),
    }

    const keys = Object.keys(queries)
    const results = await Promise.allSettled(Object.values(queries))

    const bundle = {}
    const incomplete = []
    keys.forEach((key, i) => {
      const res = results[i]
      if (res.status === 'fulfilled' && !res.value.error) {
        bundle[key] = res.value.data
      } else {
        bundle[key] = null
        incomplete.push(key)
        logger.error('exportAllData: section failed', res.status === 'fulfilled' ? res.value.error : res.reason, { userId: uid, section: key })
      }
    })

    if (incomplete.length === keys.length) {
      return { error: 'Export failed. Please try again.' }
    }
    return { error: null, bundle, incomplete }
  }, [session])

  return { profile, loading, updateProfile, checkUsername, exportAllData, reload: load }
}
