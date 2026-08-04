import { Flame, Tv, Satellite, X } from 'lucide-react'
import MovieCard from '../components/MovieCard'
import Button from '../components/ui/Button'
import styles from './DiscoverPage.module.css'

const CardGrid = ({ items, library, onOpen, onSetStatus, onToggleWatchlist }) => (
  <div className={styles.grid}>
    {items.map(item => (
      <MovieCard key={item.id} item={item} entry={library[item.id] || {}} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
    ))}
  </div>
)

export default function DiscoverPage({
  library, trending, trendingError,
  searchResults, searchLoading, query, onClearSearch,
  onOpen, onSetStatus, onToggleWatchlist, onFindPeople,
}) {
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
      <div className={styles.section}>
        <div className={styles.sectionHeader}><Flame size={24} className={styles.sectionIcon} /> Trending movies this week</div>
        <CardGrid items={trending.movies} library={library} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHeader}><Tv size={24} className={styles.sectionIcon} /> Trending TV shows this week</div>
        <CardGrid items={trending.tv} library={library} onOpen={onOpen} onSetStatus={onSetStatus} onToggleWatchlist={onToggleWatchlist} />
      </div>
    </div>
  )
}
