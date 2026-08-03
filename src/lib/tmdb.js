import { withRetry } from './errors'
import { logger } from './logger'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'

export const IMG = (path, size = 'w300') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// TMDB catalogue metadata is effectively static within a session — a movie's
// runtime or a show's season list doesn't change minute to minute. Caching it
// avoids the N+1 fan-out in App.jsx (one request per TV show in the library,
// re-fired on every rating/status change) and means reopening a title you
// already viewed this session doesn't refetch details + providers + recs.
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours
const cache = new Map() // path -> { at, data }
const inflight = new Map() // path -> in-flight promise, deduplicates concurrent callers

async function get(path) {
  const cached = cache.get(path)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data

  if (inflight.has(path)) return inflight.get(path)

  const sep = path.includes('?') ? '&' : '?'
  const promise = withRetry(async () => {
    const res = await fetch(`${BASE}${path}${sep}api_key=${API_KEY}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      const err = new Error(`TMDB ${res.status}`)
      err.status = res.status
      throw err
    }
    return res.json()
  }, { retries: 2, label: `tmdb:${path}` })
    .then(data => { cache.set(path, { at: Date.now(), data }); return data })
    .catch(err => {
      // 4xx (bad id, not found) won't succeed on retry and shouldn't poison
      // the cache — but do let the caller's own .catch()/try-catch see it.
      logger.warn('TMDB request failed', { path, status: err?.status, message: err?.message })
      throw err
    })
    .finally(() => inflight.delete(path))

  inflight.set(path, promise)
  return promise
}

// Runs a bounded number of TMDB calls at once instead of firing them all in
// parallel — used for the per-show season fan-out in App.jsx, which
// previously sent one request per TV show in a user's library simultaneously
// and could trip TMDB's rate limit on a library of any real size.
export async function mapWithConcurrency(items, limit, fn) {
  const results = []
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx]).catch(() => undefined)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export const tmdb = {
  trendingMovies: () => get('/trending/movie/week'),
  trendingTV: () => get('/trending/tv/week'),
  search: (query, type = 'multi') => get(`/search/${type}?query=${encodeURIComponent(query)}`),
  movieDetails: (id) => get(`/movie/${id}`),
  tvDetails: (id) => get(`/tv/${id}`),
  seasonDetails: (showId, season) => get(`/tv/${showId}/season/${season}`),
  providers: (type, id) => get(`/${type}/${id}/watch/providers`),
  recommendations: (type, id) => get(`/${type}/${id}/recommendations`),
}
