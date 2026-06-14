/**
 * Compute viewing statistics from diary entries and library data.
 * All calculations done client-side from already-loaded data.
 */

const AVG_MOVIE_RUNTIME = 110 // minutes
const AVG_EPISODE_RUNTIME = 42 // minutes

export function computeStats(diary = [], library = {}, episodes = {}) {
  const libValues = Object.values(library)
  const watchedMovies = libValues.filter(x => x.media_type === 'movie' && x.status === 'watched')
  const watchedShows = libValues.filter(x => x.media_type === 'tv')
  const rated = libValues.filter(x => x.rating > 0)

  const totalEpisodesWatched = Object.keys(episodes).length

  const movieMinutes = watchedMovies.length * AVG_MOVIE_RUNTIME
  const episodeMinutes = totalEpisodesWatched * AVG_EPISODE_RUNTIME
  const totalHours = Math.round((movieMinutes + episodeMinutes) / 60)

  // Rating distribution
  const ratingDist = Array(11).fill(0)
  rated.forEach(item => { ratingDist[item.rating]++ })

  const avgRating = rated.length
    ? (rated.reduce((sum, x) => sum + x.rating, 0) / rated.length).toFixed(1)
    : 0

  const topRated = [...rated].sort((a, b) => b.rating - a.rating).slice(0, 5)

  // Monthly activity — last 12 months
  const now = new Date()
  const monthlyActivity = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en-KE', { month: 'short' })
    const count = diary.filter(e => e.watched_date?.startsWith(key)).length
    monthlyActivity.push({ key, label, count })
  }

  const rewatchCount = diary.filter(e => e.rewatch).length

  // This year
  const thisYear = now.getFullYear()
  const thisYearEntries = diary.filter(e => e.watched_date?.startsWith(String(thisYear)))
  const monthCounts = {}
  thisYearEntries.forEach(e => {
    const month = e.watched_date.slice(0, 7)
    monthCounts[month] = (monthCounts[month] || 0) + 1
  })
  let busiestMonth = null, busiestCount = 0
  Object.entries(monthCounts).forEach(([month, count]) => {
    if (count > busiestCount) { busiestCount = count; busiestMonth = month }
  })

  return {
    totalMovies: watchedMovies.length,
    totalShows: watchedShows.length,
    totalEpisodes: totalEpisodesWatched,
    totalHours,
    totalRated: rated.length,
    avgRating,
    ratingDist,
    topRated,
    monthlyActivity,
    rewatchCount,
    diaryTotal: diary.length,
    thisYear: {
      year: thisYear,
      total: thisYearEntries.length,
      movies: thisYearEntries.filter(e => e.media_type === 'movie').length,
      tvEntries: thisYearEntries.filter(e => e.media_type === 'tv').length,
      busiestMonth: busiestMonth
        ? new Date(busiestMonth + '-01').toLocaleDateString('en-KE', { month: 'long' })
        : null,
      busiestCount,
    },
  }
}

export function formatHours(hours) {
  if (hours === 0) return '0 hours'
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  const rem = hours % 24
  return `${days} day${days !== 1 ? 's' : ''}${rem ? `, ${rem}h` : ''}`
}
