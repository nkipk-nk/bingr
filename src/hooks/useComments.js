import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { moderateComment, checkCommentRateLimit } from '../lib/moderation'
import { assertAffected } from '../lib/errors'

export function useComments(tmdbId, mediaType, session, profile) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    if (!tmdbId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bingr_comments')
        .select('*')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
      if (error) throw error
      setComments(data || [])
    } catch (err) {
      logger.error('useComments.load failed', err, { tmdbId, mediaType })
    } finally {
      setLoading(false)
    }
  }, [tmdbId, mediaType])

  useEffect(() => { load() }, [load])

  const postComment = useCallback(async (text) => {
    if (!session || !profile) return { error: 'You must be signed in to comment.' }

    const rateCheck = checkCommentRateLimit()
    if (!rateCheck.ok) return { error: rateCheck.reason }

    const modCheck = moderateComment(text)
    if (!modCheck.ok) return { error: modCheck.reason }

    setPosting(true)
    try {
      const { data, error } = await supabase
        .from('bingr_comments')
        .insert({
          user_id: session.user.id,
          username: profile.username,
          tmdb_id: tmdbId,
          media_type: mediaType,
          comment: modCheck.text,
        })
        .select()
        .single()
      if (error) throw error
      setComments(prev => [data, ...prev])
      return { error: null }
    } catch (err) {
      logger.error('postComment failed', err, { userId: session.user.id, tmdbId })
      return { error: 'Failed to post comment. Please try again.' }
    } finally {
      setPosting(false)
    }
  }, [session, profile, tmdbId, mediaType])

  const deleteComment = useCallback(async (commentId) => {
    if (!session) return { error: 'You must be signed in.' }
    try {
      // .select() so we can tell a real delete from an RLS-filtered no-op —
      // PostgREST returns 204 for both. Without this the comment vanished from
      // the UI while still living in the database.
      const res = await supabase
        .from('bingr_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session.user.id)
        .select()
      assertAffected(res, 'deleteComment', { commentId, userId: session.user.id })
      setComments(prev => prev.filter(c => c.id !== commentId))
      return { error: null }
    } catch (err) {
      logger.error('deleteComment failed', err, { commentId })
      return { error: 'Could not delete that comment. Please refresh and try again.' }
    }
  }, [session])

  const flagComment = useCallback(async (commentId, reason = '') => {
    if (!session) return { error: 'You must be signed in to report comments.' }
    try {
      const { error } = await supabase
        .from('bingr_comment_flags')
        .insert({ comment_id: commentId, user_id: session.user.id, reason })
      if (error) {
        if (error.code === '23505') return { error: 'You have already reported this comment.' }
        throw error
      }
      // Optimistically hide it from this user's view
      setComments(prev => prev.filter(c => c.id !== commentId))
      return { error: null }
    } catch (err) {
      logger.error('flagComment failed', err, { commentId })
      return { error: 'Failed to report comment.' }
    }
  }, [session])

  return { comments, loading, posting, postComment, deleteComment, flagComment, reload: load }
}
