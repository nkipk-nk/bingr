import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { withRetry, DatabaseError } from '../lib/errors'

export function useDiary(session) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!session) { setEntries([]); return }
    setLoading(true)
    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('bingr_diary')
          .select('*')
          .eq('user_id', session.user.id)
          .order('watched_date', { ascending: false })
          .order('created_at', { ascending: false })
        if (error) throw new DatabaseError('Failed to load diary', { supabaseError: error.message })
        return data
      }, { label: 'loadDiary' })
      setEntries(data || [])
    } catch (err) {
      logger.error('useDiary.load failed', err, { userId: session?.user.id })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const logEntry = useCallback(async (item, { watchedDate, rewatch = false, rating = null, notes = '' } = {}) => {
    if (!session) return null
    try {
      const payload = {
        user_id: session.user.id,
        tmdb_id: Number(item.id),
        media_type: item.media_type || 'movie',
        title: (item.title || item.name || '').slice(0, 300),
        poster_path: item.poster_path || null,
        release_date: (item.release_date || item.first_air_date || '').slice(0, 20) || null,
        watched_date: watchedDate || new Date().toISOString().slice(0, 10),
        rewatch,
        rating: rating || null,
        notes: notes.trim().slice(0, 1000) || null,
      }
      const { data, error } = await supabase.from('bingr_diary').insert(payload).select().single()
      if (error) throw error
      setEntries(prev => [data, ...prev].sort((a, b) =>
        new Date(b.watched_date) - new Date(a.watched_date) || new Date(b.created_at) - new Date(a.created_at)
      ))
      return data
    } catch (err) {
      logger.error('logEntry failed', err, { userId: session.user.id })
      return null
    }
  }, [session])

  const deleteEntry = useCallback(async (entryId) => {
    if (!session) return
    try {
      const { error } = await supabase.from('bingr_diary').delete().eq('id', entryId).eq('user_id', session.user.id)
      if (error) throw error
      setEntries(prev => prev.filter(e => e.id !== entryId))
    } catch (err) {
      logger.error('deleteEntry failed', err, { userId: session.user.id, entryId })
    }
  }, [session])

  const updateEntry = useCallback(async (entryId, patch) => {
    if (!session) return
    try {
      const { data, error } = await supabase
        .from('bingr_diary')
        .update(patch)
        .eq('id', entryId)
        .eq('user_id', session.user.id)
        .select()
        .single()
      if (error) throw error
      setEntries(prev => prev.map(e => e.id === entryId ? data : e))
    } catch (err) {
      logger.error('updateEntry failed', err, { userId: session.user.id, entryId })
    }
  }, [session])

  // Get diary entries for a specific title
  const getEntriesForItem = useCallback((tmdbId) => {
    return entries.filter(e => e.tmdb_id === tmdbId)
  }, [entries])

  // Fetch a public user's diary by their user_id
  const getPublicDiary = useCallback(async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('bingr_diary')
        .select('*')
        .eq('user_id', userId)
        .order('watched_date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    } catch (err) {
      logger.error('getPublicDiary failed', err, { userId })
      return []
    }
  }, [])

  return { entries, loading, logEntry, deleteEntry, updateEntry, getEntriesForItem, getPublicDiary, reload: load }
}
