import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase environment variables', new Error('Missing env vars'), {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage with automatic refresh
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Reduce session storage attack surface — use pkce flow
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'bingr-web',
    },
  },
  // Realtime disabled — we don't use it, no need to open extra sockets
  realtime: {
    params: { eventsPerSecond: 0 },
  },
})

// Listen for auth errors globally and log them
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    logger.info('Auth token refreshed')
  }
  if (event === 'SIGNED_OUT') {
    logger.clearUser()
  }
  if (event === 'SIGNED_IN' && session?.user) {
    logger.setUser(session.user.id, session.user.email)
  }
})
