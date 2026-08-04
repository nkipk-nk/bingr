import { useState, useEffect, useCallback } from 'react'
import { Flame, Tv, Satellite, X, SlidersHorizontal } from 'lucide-react'
import { tmdb } from '../lib/tmdb'
import MovieCard from '../components/MovieCard'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import styles from './DiscoverPage.module.css'

const CardGrid = ({ items, library, onOpen, onSetStatus, onToggleWatchlist }) => (
  <div className={styles.grid}>
    {items.map(item => (
      <MovieCard key={item.id} item={item} entry={library[item.id] || {}} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
    ))}
  </div>
)

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
]

// Curated, not fetched — TMDB has no "list of well-known networks/studios"
// endpoint the way it does for genres, and a raw company/network search
// would need its own autocomplete UI for a long tail nobody would pick
// anyway. IDs confirmed directly against TMDB's API, not from memory.
const NETWORKS = [
  { id: 213, name: 'Netflix' },
  { id: 49, name: 'HBO' },
  { id: 2739, name: 'Disney+' },
  { id: 2552, name: 'Apple TV+' },
  { id: 1024, name: 'Prime Video' },
  { id: 453, name: 'Hulu' },
]
const STUDIOS = [
  { id: 420, name: 'Marvel Studios' },
  { id: 3, name: 'Pixar' },
  { id: 174, name: 'Warner Bros.' },
  { id: 33, name: 'Universal' },
  { id: 4, name: 'Paramount' },
  { id: 2, name: 'Walt Disney' },
  { id: 34, name: 'Sony Pictures' },
  { id: 25, name: '20th Century Fox' },
  { id: 41077, name: 'A24' },
  { id: 1632, name: 'Lionsgate' },
]

function sortParam(sort, type) {
  if (sort === 'rating') return 'vote_average.desc'
  if (sort === 'newest') return type === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc'
  return 'popularity.desc'
}

// Browse: genre/studio/language/sort catalog discovery, alongside (not
// replacing) the trending view above. Trending answers "what's hot right
// now" — this answers "comedy shows on HBO" or "Korean movies" — a real gap
// when the only other way to find something was already knowing its exact
// title (header search) or waiting for it to trend. Deliberately
// progressive disclosure (a single small button, not a persistent filter
// bar) so the default trending glance stays exactly as clean as it was
// before this existed.
export default function DiscoverPage({
  library, trending, trendingError,
  searchResults, searchLoading, query, onClearSearch,
  onOpen, onSetStatus, onToggleWatchlist, onFindPeople,
}) {
  const [browseOpen, setBrowseOpen] = useState(false)
  const [type, setType] = useState('movie')
  const [genres, setGenres] = useState([])
  const [genreId, setGenreId] = useState('')
  const [company, setCompany] = useState('') // network id (tv) or studio id (movie)
  const [languages, setLanguages] = useState([])
  const [lang, setLang] = useState('')
  const [sort, setSort] = useState('popularity')
  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [browseError, setBrowseError] = useState(false)

  // Genre IDs aren't shared between movies and TV in TMDB's own model (e.g.
  // TV's combined "Sci-Fi & Fantasy" vs movies' split categories) — refetch
  // the list, and reset the selection, whenever Type changes. The
  // network/studio picker is likewise type-specific (a TV network id means
  // nothing as a movie company id) — reset alongside it, no fetch needed
  // since NETWORKS/STUDIOS are static.
  useEffect(() => {
    if (!browseOpen) return
    let cancelled = false
    setGenreId(''); setCompany('')
    const fetchGenres = type === 'tv' ? tmdb.genresTV() : tmdb.genresMovie()
    fetchGenres
      .then(data => { if (!cancelled) setGenres(data.genres || []) })
      .catch(() => { if (!cancelled) setGenres([]) })
    return () => { cancelled = true }
  }, [browseOpen, type])

  // Languages aren't type-specific and rarely change — fetch once per
  // Browse session rather than on every filter change.
  useEffect(() => {
    if (!browseOpen || languages.length) return
    tmdb.languages()
      .then(data => setLanguages((data || []).filter(l => l.english_name).sort((a, b) => a.english_name.localeCompare(b.english_name))))
      .catch(() => {})
  }, [browseOpen, languages.length])

  const fetchPage = useCallback((pageNum) => {
    const params = {
      sort_by: sortParam(sort, type),
      page: pageNum,
      with_genres: genreId || undefined,
      with_original_language: lang || undefined,
      // Sorting by rating alone surfaces obscure titles with a handful of
      // votes and a fluke 10/10 — a minimum vote count keeps results real.
      'vote_count.gte': sort === 'rating' ? 100 : undefined,
    }
    if (type === 'tv') {
      params.with_networks = company || undefined
      return tmdb.discoverTV(params)
    }
    params.with_companies = company || undefined
    return tmdb.discoverMovies(params)
  }, [type, genreId, company, lang, sort])

  // Filters changed (or Browse just opened) — replace results from page 1.
  useEffect(() => {
    if (!browseOpen) return
    let cancelled = false
    setLoading(true); setBrowseError(false); setPage(1)
    fetchPage(1)
      .then(data => {
        if (cancelled) return
        setResults((data.results || []).map(r => ({ ...r, media_type: type })))
      })
      .catch(() => { if (!cancelled) setBrowseError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [browseOpen, fetchPage, type])

  const loadMore = () => {
    const nextPage = page + 1
    setLoadingMore(true)
    fetchPage(nextPage)
      .then(data => {
        setResults(prev => [...prev, ...(data.results || []).map(r => ({ ...r, media_type: type }))])
        setPage(nextPage)
      })
      .catch(() => setBrowseError(true))
      .finally(() => setLoadingMore(false))
  }

  if (searchLoading) return <div className={styles.centeredMsg}>Searching…</div>

  if (searchResults) return (
    <div>
      <div className={styles.resultsHeader}>
        Search results ({searchResults.length})
        <button onClick={onClearSearch} className={styles.clearBtn}><X size={12} className={styles.clearIcon} /> Clear</button>
      </div>
      {searchResults.length ? (
        <CardGrid items={searchResults} library={library} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
      ) : (
        <div className={styles.centeredMsg}>
          No results for "{query}".
          {/* RD8 (BINGR_UI_AUDIT.md) — this search covers titles only; point
              people-searchers at where that actually lives. */}
          <div className={styles.peopleHint}>
            Looking for a person?{' '}
            <button onClick={onFindPeople} className={styles.peopleHintLink}>Search people in Feed →</button>
          </div>
        </div>
      )}
    </div>
  )

  if (trendingError) return (
    <div className={styles.centeredMsg}>
      <Satellite size={36} className={styles.errorIcon} />
      <div className={styles.errorTitle}>Couldn't load trending</div>
      <Button variant="primary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
    </div>
  )

  return (
    <div>
      <div className={styles.browseBar}>
        <Button variant="secondary" size="sm" onClick={() => setBrowseOpen(v => !v)}>
          <SlidersHorizontal size={14} /> {browseOpen ? 'Back to Trending' : 'Browse & filter'}
        </Button>
      </div>

      {browseOpen ? (
        <div>
          <div className={styles.filterRow}>
            <Select className={styles.filterSelect} value={type} onChange={e => setType(e.target.value)}>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </Select>
            <Select className={styles.filterSelect} value={genreId} onChange={e => setGenreId(e.target.value)}>
              <option value="">All genres</option>
              {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
            <Select className={styles.filterSelect} value={company} onChange={e => setCompany(e.target.value)}>
              <option value="">{type === 'tv' ? 'All networks' : 'All studios'}</option>
              {(type === 'tv' ? NETWORKS : STUDIOS).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select className={styles.filterSelect} value={lang} onChange={e => setLang(e.target.value)}>
              <option value="">All languages</option>
              {languages.map(l => <option key={l.iso_639_1} value={l.iso_639_1}>{l.english_name}</option>)}
            </Select>
            <Select className={styles.filterSelect} value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>

          {loading ? (
            <div className={styles.centeredMsg}>Loading…</div>
          ) : browseError ? (
            <div className={styles.centeredMsg}>
              <Satellite size={36} className={styles.errorIcon} />
              <div className={styles.errorTitle}>Couldn't load results</div>
            </div>
          ) : results.length === 0 ? (
            <div className={styles.centeredMsg}>No titles match these filters.</div>
          ) : (
            <>
              <CardGrid items={results} library={library} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
              <div className={styles.loadMoreRow}>
                <Button variant="secondary" size="sm" onClick={loadMore} loading={loadingMore}>Load more</Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <div className={styles.sectionHeader}><Flame size={24} className={styles.sectionIcon} /> Trending movies this week</div>
            <CardGrid items={trending.movies} library={library} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeader}><Tv size={24} className={styles.sectionIcon} /> Trending TV shows this week</div>
            <CardGrid items={trending.tv} library={library} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
          </div>
        </>
      )}
    </div>
  )
}
