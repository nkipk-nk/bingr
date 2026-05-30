const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'

export const IMG = (path, size = 'w300') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

async function get(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}api_key=${API_KEY}`)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

export const tmdb = {
  trendingMovies: () => get('/trending/movie/week'),
  trendingTV: () => get('/trending/tv/week'),
  search: (query, type = 'multi') => get(`/search/${type}?query=${encodeURIComponent(query)}`),
  movieDetails: (id) => get(`/movie/${id}`),
  tvDetails: (id) => get(`/tv/${id}`),
  providers: (type, id) => get(`/${type}/${id}/watch/providers`),
  recommendations: (type, id) => get(`/${type}/${id}/recommendations`),
}
