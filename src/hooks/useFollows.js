import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

export function useFollows(session) {
  const [following, setFollowing] = useState([]) // user IDs I follow
  const [followers, setFollowers] = useState([]) // user IDs who follow me
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!session) { setFollowing([]); setFollowers([]); return }
    setLoading(true)
    try {
      const [followingRes, followersRes] = await Promise.all([
        supabase.from('bingr_follows').select('following_id').eq('follower_id', session.user.id),
        supabase.from('bingr_follows').select('follower_id').eq('following_id', session.user.id),
      ])
      setFollowing((followingRes.data || []).map(r => r.following_id))
      setFollowers((followersRes.data || []).map(r => r.follower_id))
    } catch (err) {
      logger.error('useFollows.load failed', err, { userId: session?.user.id })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const isFollowing = useCallback((userId) => following.includes(userId), [following])

  const follow = useCallback(async (userId) => {
    if (!session || userId === session.user.id) return
    try {
      const { error } = await supabase.from('bingr_follows').insert({
        follower_id: session.user.id,
        following_id: userId,
      })
      if (error) throw error
      setFollowing(prev => [...prev, userId])
    } catch (err) {
      logger.error('follow failed', err, { userId })
    }
  }, [session])

  const unfollow = useCallback(async (userId) => {
    if (!session) return
    try {
      const { error } = await supabase.from('bingr_follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
      if (error) throw error
      setFollowing(prev => prev.filter(id => id !== userId))
    } catch (err) {
      logger.error('unfollow failed', err, { userId })
    }
  }, [session])

  const toggleFollow = useCallback(async (userId) => {
    if (isFollowing(userId)) await unfollow(userId)
    else await follow(userId)
  }, [isFollowing, follow, unfollow])

  // Get follower/following counts for any user
  const getCounts = useCallback(async (userId) => {
    try {
      const [fwing, fwers] = await Promise.all([
        supabase.from('bingr_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('bingr_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      ])
      return { following: fwing.count || 0, followers: fwers.count || 0 }
    } catch (err) {
      logger.warn('getCounts failed — bingr_follows table may not exist yet', { message: err.message })
      return { following: 0, followers: 0 }
    }
  }, [])

  return {
    following,
    followers,
    loading,
    isFollowing,
    follow,
    unfollow,
    toggleFollow,
    getCounts,
    reload: load,
  }
}
