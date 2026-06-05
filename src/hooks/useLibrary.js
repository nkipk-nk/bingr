import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { withRetry, DatabaseError } from '../lib/errors'

export function useLibrary(session) {
  const [library, setLibrary] = useState({})
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!session) { setLibrary({}); return }
    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('bingr_library')
          .select('*')
          .order('updated_at', { ascending: false })
        if (error) throw new DatabaseError('Failed to load library', { supabaseError: error.message })
        return data
      }, { label: 'loadLibrary' })

      const map = {}
      data.forEach(row => { map[row.tmdb_id] = row })
      setLibrary(map)
      setError(null)
    } catch (err) {
      logger.error('useLibrary.load failed', err, { userId: session.user.id })
      setError('Failed to load your library. Pull to refresh.')
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const upsert = useCallback(async (tmdbId, item, patch) => {
    if (!session) return
    setSyncing(true)
    const existing = library[tmdbId] || {}
    const payload = {
      user_id: session.user.id,
      tmdb_id: Number(tmdbId),
      media_type: item.media_type || 'movie',
      title: (item.title || item.name || '').slice(0, 300),
      poster_path: item.poster_path || null,
      release_date: (item.release_date || item.first_air_date || '').slice(0, 20) || null,
      vote_average: item.vote_average || null,
      status: existing.status || null,
      rating: existing.rating || 0,
      ...patch,
      updated_at: new Date().toISOString(),
    }
    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('bingr_library')
          .upsert(payload, { onConflict: 'user_id,tmdb_id' })
          .select()
          .single()
        if (error) throw new DatabaseError('Upsert failed', { supabaseError: error.message })
        return data
      }, { label: 'upsertLibrary' })
      if (data) setLibrary(prev => ({ ...prev, [tmdbId]: data }))
    } catch (err) {
      logger.error('useLibrary.upsert failed', err, { userId: session.user.id, tmdbId })
    } finally {
      setSyncing(false)
    }
  }, [session, library])

  const remove = useCallback(async (tmdbId) => {
    if (!session) return
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('bingr_library')
          .delete()
          .eq('tmdb_id', tmdbId)
          .eq('user_id', session.user.id)
        if (error) throw new DatabaseError('Delete failed', { supabaseError: error.message })
      }, { label: 'removeLibrary' })
      setLibrary(prev => { const n = { ...prev }; delete n[tmdbId]; return n })
    } catch (err) {
      logger.error('useLibrary.remove failed', err, { userId: session.user.id, tmdbId })
    }
  }, [session])

  const setStatus = useCallback(async (item, status) => {
    const id = item.id
    const existing = library[id]
    if (existing?.status === status) {
      if (existing.rating) await upsert(id, item, { status: null })
      else await remove(id)
    } else {
      await upsert(id, item, { status })
    }
  }, [library, upsert, remove])

  const setRating = useCallback(async (item, rating) => {
    const id = item.id
    const existing = library[id]
    const newRating = existing?.rating === rating ? 0 : rating
    if (!newRating && !existing?.status) await remove(id)
    else await upsert(id, item, { rating: newRating })
  }, [library, upsert, remove])

  const counts = {
    watchlist: Object.values(library).filter(x => x.status === 'watchlist').length,
    watching: Object.values(library).filter(x => x.status === 'watching').length,
    watched: Object.values(library).filter(x => x.status === 'watched').length,
  }

  return { library, syncing, error, setStatus, setRating, remove, counts, reload: load }
}
