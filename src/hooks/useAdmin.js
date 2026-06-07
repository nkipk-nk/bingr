import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

export function useAdmin(profile) {
  const isAdmin = profile?.role === 'admin'

  const [users, setUsers] = useState([])
  const [feedback, setFeedback] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { logger.error('loadUsers failed', error); return }
    setUsers(data || [])
  }, [isAdmin])

  const loadFeedback = useCallback(async () => {
    if (!isAdmin) return
    const { data, error } = await supabase
      .from('bingr_feedback')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { logger.error('loadFeedback failed', error); return }
    setFeedback(data || [])
  }, [isAdmin])

  const loadDonations = useCallback(async () => {
    if (!isAdmin) return
    const { data, error } = await supabase
      .from('bingr_donations')
      .select('*')
      .order('donated_at', { ascending: false })
    if (error) { logger.error('loadDonations failed', error); return }
    setDonations(data || [])
  }, [isAdmin])

  const loadAll = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    await Promise.all([loadUsers(), loadFeedback(), loadDonations()])
    setLoading(false)
  }, [isAdmin, loadUsers, loadFeedback, loadDonations])

  const markFeedback = useCallback(async (id, status) => {
    const { error } = await supabase.from('bingr_feedback').update({ status }).eq('id', id)
    if (!error) setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f))
  }, [])

  const addDonation = useCallback(async (donation) => {
    const { data, error } = await supabase.from('bingr_donations').insert(donation).select().single()
    if (!error && data) setDonations(prev => [data, ...prev])
    return { error }
  }, [])

  const updateDonation = useCallback(async (id, patch) => {
    const { error } = await supabase.from('bingr_donations').update(patch).eq('id', id)
    if (!error) setDonations(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
  }, [])

  const deleteDonation = useCallback(async (id) => {
    await supabase.from('bingr_donations').delete().eq('id', id)
    setDonations(prev => prev.filter(d => d.id !== id))
  }, [])

  const promoteUser = useCallback(async (userId, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    return { error }
  }, [])

  const deleteUser = useCallback(async (userId) => {
    const { error } = await supabase.functions.invoke('delete-account', {
      body: { target_user_id: userId }
    })
    if (!error) setUsers(prev => prev.filter(u => u.id !== userId))
    return { error }
  }, [])

  return {
    isAdmin, loading, users, feedback, donations,
    loadAll, loadUsers, loadFeedback, loadDonations,
    markFeedback, addDonation, updateDonation, deleteDonation,
    promoteUser, deleteUser,
  }
}
