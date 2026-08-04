import { useMemo } from 'react'
import { BarChart3, PartyPopper, Clapperboard, Tv, Play, Clock, Star, BookOpen, Trophy } from 'lucide-react'
import { computeStats, formatHours } from '../lib/stats'
import { IMG } from '../lib/tmdb'
import { StatTileGrid } from '../components/stats/StatTile'
import ActivityChart from '../components/stats/ActivityChart'
import RatingBreakdown from '../components/stats/RatingBreakdown'
import Card from '../components/ui/Card'
import PosterTile from '../components/ui/PosterTile'
import EmptyState from '../components/ui/EmptyState'
import styles from './StatsPage.module.css'

export default function StatsPage({ library, diary, episodes, onGoDiscover }) {
  const stats = useMemo(() => computeStats(diary, library, episodes), [diary, library, episodes])
  const hasAnyData = stats.totalMovies > 0 || stats.totalShows > 0 || stats.diaryTotal > 0

  if (!hasAnyData) return (
    <EmptyState
      icon={BarChart3} title="No stats yet" description="Start tracking movies and TV shows to see your stats here"
      actionLabel={onGoDiscover ? 'Browse Discover' : undefined} onAction={onGoDiscover}
    />
  )

  const tiles = [
    { icon: Clapperboard, value: stats.totalMovies, label: 'Movies watched' },
    { icon: Tv, value: stats.totalShows, label: 'TV shows tracked' },
    { icon: Play, value: stats.totalEpisodes.toLocaleString(), label: 'Episodes watched' },
    { icon: Clock, value: formatHours(stats.totalHours), label: 'Watch time', sub: 'based on avg runtimes' },
    { icon: Star, value: stats.avgRating > 0 ? `${stats.avgRating}/10` : '—', label: 'Average rating', sub: stats.totalRated ? `from ${stats.totalRated} ratings` : 'No ratings yet' },
    { icon: BookOpen, value: stats.diaryTotal, label: 'Diary entries', sub: stats.rewatchCount ? `incl. ${stats.rewatchCount} rewatch${stats.rewatchCount > 1 ? 'es' : ''}` : null },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerTitle}><BarChart3 size={22} /> My Stats</div>
        <div className={styles.headerSub}>Your complete bingr history at a glance</div>
      </div>

      <div className={styles.tiles}><StatTileGrid tiles={tiles} /></div>

      {stats.thisYear.total > 0 && (
        <div className={styles.wrapped}>
          <div className={styles.wrappedLabel}><PartyPopper size={14} /> {stats.thisYear.year} Wrapped</div>
          <div className={styles.wrappedRow}>
            <div>
              <div className={styles.wrappedHero}>{stats.thisYear.total}</div>
              <div className={styles.wrappedHeroLabel}>titles this year</div>
            </div>
            {stats.thisYear.movies > 0 && (
              <div>
                <div className={styles.wrappedStat}>{stats.thisYear.movies}</div>
                <div className={styles.wrappedStatLabel}>movies</div>
              </div>
            )}
            {stats.thisYear.tvEntries > 0 && (
              <div>
                <div className={styles.wrappedStat}>{stats.thisYear.tvEntries}</div>
                <div className={styles.wrappedStatLabel}>TV watches</div>
              </div>
            )}
            {stats.thisYear.busiestMonth && (
              <div className={styles.wrappedBusiest}>
                <div className={styles.wrappedBusiestLabel}>Most active month</div>
                <div className={styles.wrappedBusiestValue}>{stats.thisYear.busiestMonth}</div>
                <div className={styles.wrappedBusiestCount}>{stats.thisYear.busiestCount} titles</div>
              </div>
            )}
          </div>
        </div>
      )}

      {stats.monthlyActivity.some(m => m.count > 0) && (
        <Card className={styles.chartCard}><ActivityChart months={stats.monthlyActivity} /></Card>
      )}

      <div className={styles.splitRow}>
        {stats.totalRated > 0 && (
          <Card><RatingBreakdown dist={stats.ratingDist} /></Card>
        )}
        {stats.topRated.length > 0 && (
          <Card>
            <div className={styles.topRatedTitle}><Trophy size={16} /> Your top rated</div>
            {stats.topRated.map((item, i) => (
              <div key={item.tmdb_id} className={styles.topRatedRow}>
                <div className={[styles.topRatedRank, i < 3 ? styles.topRatedRankHot : styles.topRatedRankCold].join(' ')}>{i + 1}</div>
                <PosterTile size="sm" src={item.poster_path ? IMG(item.poster_path) : null} alt="" />
                <div className={styles.topRatedBody}>
                  <div className={styles.topRatedTitleText}>{item.title || item.name}</div>
                  <div className={styles.topRatedRating}>★ {item.rating}/10</div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {stats.totalHours >= 24 && (
        <Card>
          <div className={styles.footerFact}>
            You've spent an estimated <strong>{formatHours(stats.totalHours)}</strong> watching movies and TV on bingr.
            {stats.totalHours >= 168 && (
              <> That's over <strong>{Math.floor(stats.totalHours / 168)} week{Math.floor(stats.totalHours / 168) > 1 ? 's' : ''}</strong> of your life — worth every second 🍿</>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
