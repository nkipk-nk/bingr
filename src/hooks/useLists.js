import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { withRetry, DatabaseError } from '../lib/errors'

export function useLists(session) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!session) { setLists([]); return }
    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('bingr_lists')
          .select('*, bingr_list_items(count)')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
        if (error) throw new DatabaseError('Failed to load lists', { supabaseError: error.message })
        return data
      }, { label: 'loadLists' })
      setLists(data || [])
    } catch (err) {
      logger.error('useLists.load failed', err, { userId: session?.user.id })
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const createList = useCallback(async (name, description = '', isPublic = false) => {
    if (!session) return null
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bingr_lists')
        .insert({
          user_id: session.user.id,
          name: name.trim().slice(0, 100),
          description: description.trim().slice(0, 500),
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw new DatabaseError('Failed to create list', { supabaseError: error.message })
      setLists(prev => [data, ...prev])
      return data
    } catch (err) {
      logger.error('createList failed', err, { userId: session.user.id })
      return null
    } finally {
      setLoading(false)
    }
  }, [session])

  const updateList = useCallback(async (listId, patch) => {
    if (!session) return
    try {
      const { data, error } = await supabase
        .from('bingr_lists')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', listId)
        .eq('user_id', session.user.id)
        .select()
        .single()
      if (error) throw new DatabaseError('Failed to update list', { supabaseError: error.message })
      setLists(prev => prev.map(l => l.id === listId ? data : l))
    } catch (err) {
      logger.error('updateList failed', err, { userId: session.user.id, listId })
    }
  }, [session])

  const deleteList = useCallback(async (listId) => {
    if (!session) return
    try {
      const { error } = await supabase
        .from('bingr_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', session.user.id)
      if (error) throw new DatabaseError('Failed to delete list', { supabaseError: error.message })
      setLists(prev => prev.filter(l => l.id !== listId))
    } catch (err) {
      logger.error('deleteList failed', err, { userId: session.user.id, listId })
    }
  }, [session])

  const addToList = useCallback(async (listId, item) => {
    if (!session) return false
    try {
      const { error } = await supabase
        .from('bingr_list_items')
        .upsert({
          list_id: listId,
          user_id: session.user.id,
          tmdb_id: Number(item.id),
          media_type: item.media_type || 'movie',
          title: (item.title || item.name || '').slice(0, 300),
          poster_path: item.poster_path || null,
          release_date: (item.release_date || item.first_air_date || '').slice(0, 20) || null,
          vote_average: item.vote_average || null,
        }, { onConflict: 'list_id,tmdb_id' })
      if (error) throw new DatabaseError('Failed to add to list', { supabaseError: error.message })
      // Update count locally
      setLists(prev => prev.map(l => l.id === listId
        ? { ...l, updated_at: new Date().toISOString() }
        : l
      ))
      await load()
      return true
    } catch (err) {
      logger.error('addToList failed', err, { userId: session.user.id, listId })
      return false
    }
  }, [session, load])

  const removeFromList = useCallback(async (listId, tmdbId) => {
    if (!session) return
    try {
      const { error } = await supabase
        .from('bingr_list_items')
        .delete()
        .eq('list_id', listId)
        .eq('tmdb_id', tmdbId)
        .eq('user_id', session.user.id)
      if (error) throw new DatabaseError('Failed to remove from list', { supabaseError: error.message })
      await load()
    } catch (err) {
      logger.error('removeFromList failed', err, { userId: session.user.id, listId })
    }
  }, [session, load])

  const getListItems = useCallback(async (listId) => {
    try {
      const { data, error } = await supabase
        .from('bingr_list_items')
        .select('*')
        .eq('list_id', listId)
        .order('added_at', { ascending: false })
      if (error) throw new DatabaseError('Failed to get list items', { supabaseError: error.message })
      return data || []
    } catch (err) {
      logger.error('getListItems failed', err, { listId })
      return []
    }
  }, [])

  // Get public list by ID (no auth required)
  const getPublicList = useCallback(async (listId) => {
    try {
      const [{ data: list }, { data: items }] = await Promise.all([
        supabase.from('bingr_lists').select('*').eq('id', listId).eq('is_public', true).single(),
        supabase.from('bingr_list_items').select('*').eq('list_id', listId).order('added_at', { ascending: false })
      ])
      return { list, items: items || [] }
    } catch (err) {
      logger.error('getPublicList failed', err, { listId })
      return { list: null, items: [] }
    }
  }, [])

  return { lists, loading, createList, updateList, deleteList, addToList, removeFromList, getListItems, getPublicList, reload: load }
}
