import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { withRetry, DatabaseError, assertAffected } from '../lib/errors'

export function useLibrary(session) {
  const [library, setLibrary] = useState({})
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  // upsert/setStatus/setRating read the current library through this ref
  // instead of closing over the `library` state value directly. Closing over
  // it meant every mutation recreated upsert (new library reference in its
  // deps), which recreated setStatus/setRating, which are passed to every
  // MovieCard in the Discover grid — so rating one title re-rendered every
  // card on screen. The ref keeps their identity stable across renders while
  // still always reading the latest data.
  const libraryRef = useRef(library)
  useEffect(() => { libraryRef.current = library }, [library])

  const load = useCallback(async () => {
    if (!session) { setLibrary({}); return }
    try {
      const data = await withRetry(async () => {
        // Explicit .eq('user_id', ...) alongside RLS, not instead of it — RLS is
        // still the real access boundary, but a query that only asks for what
        // it needs fails safe if a future policy change is ever too permissive.
        const { data, error } = await supabase
          .from('bingr_library')
          .select('*')
          .eq('user_id', session.user.id)
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
    const existing = libraryRef.current[tmdbId] || {}
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
  }, [session])

  const remove = useCallback(async (tmdbId) => {
    if (!session) return
    try {
      await withRetry(async () => {
        // .select() lets an RLS-filtered no-op be told apart from a real
        // delete (M21) — otherwise the item disappears from the UI while
        // remaining in the database.
        const res = await supabase
          .from('bingr_library')
          .delete()
          .eq('tmdb_id', tmdbId)
          .eq('user_id', session.user.id)
          .select()
        assertAffected(res, 'removeLibrary', { tmdbId, userId: session.user.id })
      }, { label: 'removeLibrary' })
      setLibrary(prev => { const n = { ...prev }; delete n[tmdbId]; return n })
    } catch (err) {
      logger.error('useLibrary.remove failed', err, { userId: session.user.id, tmdbId })
    }
  }, [session])

  const setStatus = useCallback(async (item, status) => {
    const id = item.id
    const existing = libraryRef.current[id]
    if (existing?.status === status) {
      if (existing.rating) await upsert(id, item, { status: null })
      else await remove(id)
    } else {
      await upsert(id, item, { status })
    }
  }, [upsert, remove])

  const setRating = useCallback(async (item, rating) => {
    const id = item.id
    const existing = libraryRef.current[id]
    const newRating = existing?.rating === rating ? 0 : rating
    if (!newRating && !existing?.status) await remove(id)
    else await upsert(id, item, { rating: newRating })
  }, [upsert, remove])

  const counts = {
    watchlist: Object.values(library).filter(x => x.status === 'watchlist').length,
    watching: Object.values(library).filter(x => x.status === 'watching').length,
    watched: Object.values(library).filter(x => x.status === 'watched').length,
  }

  return { library, syncing, error, setStatus, setRating, remove, counts, reload: load }
}
