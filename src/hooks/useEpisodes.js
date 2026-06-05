import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { withRetry, DatabaseError } from '../lib/errors'

export function useEpisodes(session) {
  const [episodes, setEpisodes] = useState({})

  const load = useCallback(async () => {
    if (!session) { setEpisodes({}); return }
    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase.from('bingr_episodes').select('*')
        if (error) throw new DatabaseError('Failed to load episodes', { supabaseError: error.message })
        return data
      }, { label: 'loadEpisodes' })
      const map = {}
      data.forEach(row => {
        map[`${row.tmdb_show_id}-${row.season_number}-${row.episode_number}`] = row
      })
      setEpisodes(map)
    } catch (err) {
      logger.error('useEpisodes.load failed', err, { userId: session?.user.id })
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const isWatched = useCallback((showId, season, episode) =>
    !!episodes[`${showId}-${season}-${episode}`],
  [episodes])

  const toggleEpisode = useCallback(async (showId, season, episode) => {
    if (!session) return
    const key = `${showId}-${season}-${episode}`
    try {
      if (episodes[key]) {
        await withRetry(async () => {
          const { error } = await supabase.from('bingr_episodes').delete()
            .eq('user_id', session.user.id)
            .eq('tmdb_show_id', showId)
            .eq('season_number', season)
            .eq('episode_number', episode)
          if (error) throw new DatabaseError('Delete episode failed', { supabaseError: error.message })
        }, { label: 'deleteEpisode' })
        setEpisodes(prev => { const n = { ...prev }; delete n[key]; return n })
      } else {
        const payload = {
          user_id: session.user.id,
          tmdb_show_id: Number(showId),
          season_number: Number(season),
          episode_number: Number(episode),
          watched_at: new Date().toISOString(),
        }
        const data = await withRetry(async () => {
          const { data, error } = await supabase.from('bingr_episodes')
            .insert(payload).select().single()
          if (error) throw new DatabaseError('Insert episode failed', { supabaseError: error.message })
          return data
        }, { label: 'insertEpisode' })
        if (data) setEpisodes(prev => ({ ...prev, [key]: data }))
      }
    } catch (err) {
      logger.error('toggleEpisode failed', err, { userId: session.user.id, showId, season, episode })
    }
  }, [session, episodes])

  const markSeasonWatched = useCallback(async (showId, season, episodeList) => {
    if (!session) return
    const unwatched = episodeList.filter(ep => !episodes[`${showId}-${season}-${ep.episode_number}`])
    try {
      if (!unwatched.length) {
        await withRetry(async () => {
          const { error } = await supabase.from('bingr_episodes').delete()
            .eq('user_id', session.user.id).eq('tmdb_show_id', showId).eq('season_number', season)
          if (error) throw new DatabaseError('Bulk delete season failed', { supabaseError: error.message })
        }, { label: 'deleteSeasonEpisodes' })
        setEpisodes(prev => {
          const n = { ...prev }
          episodeList.forEach(ep => delete n[`${showId}-${season}-${ep.episode_number}`])
          return n
        })
      } else {
        const rows = unwatched.map(ep => ({
          user_id: session.user.id,
          tmdb_show_id: Number(showId),
          season_number: Number(season),
          episode_number: Number(ep.episode_number),
          watched_at: new Date().toISOString(),
        }))
        const data = await withRetry(async () => {
          const { data, error } = await supabase.from('bingr_episodes')
            .upsert(rows, { onConflict: 'user_id,tmdb_show_id,season_number,episode_number' }).select()
          if (error) throw new DatabaseError('Bulk insert season failed', { supabaseError: error.message })
          return data
        }, { label: 'upsertSeasonEpisodes' })
        if (data) {
          const patch = {}
          data.forEach(row => { patch[`${row.tmdb_show_id}-${row.season_number}-${row.episode_number}`] = row })
          setEpisodes(prev => ({ ...prev, ...patch }))
        }
      }
    } catch (err) {
      logger.error('markSeasonWatched failed', err, { userId: session.user.id, showId, season })
    }
  }, [session, episodes])

  const getNextEpisode = useCallback((showId, seasons) => {
    if (!seasons) return null
    for (const season of seasons) {
      if (season.season_number === 0) continue
      for (let e = 1; e <= season.episode_count; e++) {
        if (!episodes[`${showId}-${season.season_number}-${e}`]) {
          return { season: season.season_number, episode: e }
        }
      }
    }
    return null
  }, [episodes])

  const getShowProgress = useCallback((showId, seasons) => {
    if (!seasons) return { watched: 0, total: 0 }
    let watched = 0, total = 0
    seasons.forEach(s => {
      if (s.season_number === 0) return
      total += s.episode_count
      for (let e = 1; e <= s.episode_count; e++) {
        if (episodes[`${showId}-${s.season_number}-${e}`]) watched++
      }
    })
    return { watched, total }
  }, [episodes])

  const getSeasonProgress = useCallback((showId, seasonNumber, episodeCount) => {
    let watched = 0
    for (let e = 1; e <= episodeCount; e++) {
      if (episodes[`${showId}-${seasonNumber}-${e}`]) watched++
    }
    return { watched, total: episodeCount }
  }, [episodes])

  return { episodes, isWatched, toggleEpisode, markSeasonWatched, getNextEpisode, getShowProgress, getSeasonProgress, reload: load }
}
