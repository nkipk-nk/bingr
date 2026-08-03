import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Pinned to the app origin rather than '*'. Set ALLOWED_ORIGIN in the function's
// environment when moving to a custom domain.
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://bingr-tawny.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    // Client bound to the caller's token — establishes who is asking.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Invalid session' }, 401)

    // Service-role client — required to delete the auth user itself.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Resolve the deletion target ──────────────────────────────────────────
    // The admin panel may pass target_user_id to delete someone else. Previously
    // the body was never read, so an admin-initiated deletion would silently
    // have deleted the *admin's own* account. The target is now explicit, and
    // when it differs from the caller the caller must genuinely be an admin.
    let targetUserId = user.id

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const requested = body?.target_user_id

      if (typeof requested === 'string' && requested && requested !== user.id) {
        const { data: callerProfile, error: roleErr } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleErr || callerProfile?.role !== 'admin') {
          return json({ error: 'Forbidden — admin role required' }, 403)
        }
        targetUserId = requested
      }
    }

    // ── Delete owned data ────────────────────────────────────────────────────
    // Most of these cascade from auth.users, but deleting explicitly means the
    // behaviour cannot silently change if a foreign key is ever altered.
    for (const table of [
      'bingr_comment_flags',
      'bingr_comments',
      'bingr_diary',
      'bingr_episodes',
      'bingr_list_items',
      'bingr_lists',
      'bingr_library',
    ]) {
      const { error } = await adminClient.from(table).delete().eq('user_id', targetUserId)
      if (error) console.error(`delete-account: ${table} failed`, error.message)
    }

    // Follows are keyed on two columns — both directions must go.
    await adminClient.from('bingr_follows').delete().eq('follower_id', targetUserId)
    await adminClient.from('bingr_follows').delete().eq('following_id', targetUserId)

    // ── Anonymise records kept for legitimate business reasons ───────────────
    // bingr_feedback and bingr_donations use ON DELETE SET NULL, so their rows
    // survive with username and email intact. Verified during the audit: a
    // deleted probe account left its email address behind. The Privacy Policy
    // promises erasure, so strip the identifiers while keeping the row for
    // support history and donation accounting.
    await adminClient.from('bingr_feedback')
      .update({ username: null, email: null })
      .eq('user_id', targetUserId)

    await adminClient.from('bingr_donations')
      .update({ username: 'Deleted user' })
      .eq('user_id', targetUserId)

    // Profile last — other tables reference it.
    await adminClient.from('profiles').delete().eq('id', targetUserId)

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)
    if (deleteError) throw deleteError

    return json({ success: true }, 200)
  } catch (err) {
    console.error('delete-account error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
