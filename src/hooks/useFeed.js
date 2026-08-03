import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

export function useFeed(session, following) {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!session || following.length === 0) {
      setFeed([])
      setLoaded(true)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // NOTE: `error` must be read on every query below. PostgREST reports a
      // missing embed (e.g. a absent foreign key) as HTTP 400 with data
      // undefined — discarding `error` here made the feed render an ordinary
      // "nothing yet" empty state for weeks, with nothing reaching Sentry.
      const { data: diaryData, error: diaryErr } = await supabase
        .from('bingr_diary')
        .select('*, profiles!inner(username, display_name)')
        .in('user_id', following)
        .order('watched_date', { ascending: false })
        .limit(60)
      if (diaryErr) throw diaryErr

      // Recent ratings from followed users (library items with rating > 0)
      const { data: ratingData, error: ratingErr } = await supabase
        .from('bingr_library')
        .select('*, profiles!inner(username, display_name)')
        .in('user_id', following)
        .gt('rating', 0)
        .order('updated_at', { ascending: false })
        .limit(40)
      if (ratingErr) throw ratingErr

      // Merge and sort by date
      const diaryItems = (diaryData || []).map(e => ({
        id: `diary-${e.id}`,
        type: 'diary',
        user_id: e.user_id,
        username: e.profiles?.username,
        display_name: e.profiles?.display_name,
        tmdb_id: e.tmdb_id,
        media_type: e.media_type,
        title: e.title,
        poster_path: e.poster_path,
        rating: e.rating,
        rewatch: e.rewatch,
        notes: e.notes,
        date: e.watched_date,
        sortDate: new Date(e.watched_date),
      }))

      const ratingItems = (ratingData || []).map(e => ({
        id: `rating-${e.id}`,
        type: 'rating',
        user_id: e.user_id,
        username: e.profiles?.username,
        display_name: e.profiles?.display_name,
        tmdb_id: e.tmdb_id,
        media_type: e.media_type,
        title: e.title,
        poster_path: e.poster_path,
        rating: e.rating,
        date: e.updated_at,
        sortDate: new Date(e.updated_at),
      }))

      // Deduplicate: if diary entry already has a rating, skip the rating entry for the same title/user
      const diaryKeys = new Set(diaryItems.map(d => `${d.user_id}-${d.tmdb_id}`))
      const filteredRatings = ratingItems.filter(r => !diaryKeys.has(`${r.user_id}-${r.tmdb_id}`))

      const merged = [...diaryItems, ...filteredRatings]
        .sort((a, b) => b.sortDate - a.sortDate)
        .slice(0, 80)

      setFeed(merged)
      setLoaded(true)
    } catch (err) {
      logger.error('useFeed.load failed', err, {
        userId: session?.user.id,
        followingCount: following.length,
      })
      setError("Couldn't load your feed. Please try again.")
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [session, following])

  // Reload whenever the follow list changes. useFollows resolves asynchronously,
  // so on first mount `following` is [] — without this, the feed latched on
  // loaded=true against an empty list and never refreshed once follows arrived.
  useEffect(() => {
    if (session) load()
  }, [load, session])

  return { feed, loading, loaded, error, load }
}
