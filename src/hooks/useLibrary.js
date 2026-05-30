import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLibrary(session) {
  const [library, setLibrary] = useState({})
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    if (!session) { setLibrary({}); return }
    const { data } = await supabase
      .from('bingr_library')
      .select('*')
      .order('updated_at', { ascending: false })
    if (data) {
      const map = {}
      data.forEach(row => { map[row.tmdb_id] = row })
      setLibrary(map)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const upsert = useCallback(async (tmdbId, item, patch) => {
    if (!session) return
    setSyncing(true)
    const existing = library[tmdbId] || {}
    const payload = {
      user_id: session.user.id,
      tmdb_id: tmdbId,
      media_type: item.media_type || 'movie',
      title: item.title || item.name || '',
      poster_path: item.poster_path || null,
      release_date: item.release_date || item.first_air_date || null,
      vote_average: item.vote_average || null,
      status: existing.status || null,
      rating: existing.rating || 0,
      ...patch,
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase
      .from('bingr_library')
      .upsert(payload, { onConflict: 'user_id,tmdb_id' })
      .select()
      .single()
    if (data) setLibrary(prev => ({ ...prev, [tmdbId]: data }))
    setSyncing(false)
  }, [session, library])

  const remove = useCallback(async (tmdbId) => {
    if (!session) return
    await supabase
      .from('bingr_library')
      .delete()
      .eq('tmdb_id', tmdbId)
      .eq('user_id', session.user.id)
    setLibrary(prev => { const n = { ...prev }; delete n[tmdbId]; return n })
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

  return { library, syncing, setStatus, setRating, remove, counts, reload: load }
}
