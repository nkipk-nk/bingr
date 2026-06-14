import { useMemo } from 'react'
import { computeStats, formatHours } from '../lib/stats'
import { IMG } from '../lib/tmdb'

function StatCard({ icon, value, label, sub, accent }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--text)', lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: sub ? 2 : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color || 'var(--accent)', borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  )
}

export default function StatsPage({ library, diary, episodes }) {
  const stats = useMemo(() => computeStats(diary, library, episodes), [diary, library, episodes])

  const maxMonthly = Math.max(...stats.monthlyActivity.map(m => m.count), 1)
  const maxRating = Math.max(...stats.ratingDist.slice(1), 1)

  const hasAnyData = stats.totalMovies > 0 || stats.totalShows > 0 || stats.diaryTotal > 0

  if (!hasAnyData) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No stats yet</div>
      <div style={{ fontSize: 14 }}>Start tracking movies and TV shows to see your stats here</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>📊 My Stats</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your complete bingr history at a glance</div>
      </div>

      {/* Headline stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10, marginBottom: 24 }}>
        <StatCard icon="🎬" value={stats.totalMovies} label="Movies watched" accent />
        <StatCard icon="📺" value={stats.totalShows} label="TV shows tracked" />
        <StatCard icon="▶️" value={stats.totalEpisodes.toLocaleString()} label="Episodes watched" />
        <StatCard icon="⏱️" value={formatHours(stats.totalHours)} label="Estimated watch time" sub="based on avg runtimes" />
        <StatCard icon="⭐" value={stats.avgRating > 0 ? `${stats.avgRating}/10` : '—'} label="Average rating" sub={stats.totalRated ? `from ${stats.totalRated} ratings` : 'No ratings yet'} />
        <StatCard icon="📔" value={stats.diaryTotal} label="Diary entries" sub={stats.rewatchCount ? `incl. ${stats.rewatchCount} rewatch${stats.rewatchCount > 1 ? 'es' : ''}` : null} />
      </div>

      {/* This Year Wrapped */}
      {stats.thisYear.total > 0 && (
        <div style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #7c1a10 100%)', borderRadius: 16, padding: '1.75rem', marginBottom: 24, color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            🎉 {stats.thisYear.year} Wrapped
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{stats.thisYear.total}</div>
              <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>titles this year</div>
            </div>
            {stats.thisYear.movies > 0 && (
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{stats.thisYear.movies}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>movies</div>
              </div>
            )}
            {stats.thisYear.tvEntries > 0 && (
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{stats.thisYear.tvEntries}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>TV watches</div>
              </div>
            )}
            {stats.thisYear.busiestMonth && (
              <div style={{ marginLeft: 'auto' }}>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Most active month</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.thisYear.busiestMonth}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{stats.thisYear.busiestCount} titles</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity chart */}
      {stats.monthlyActivity.some(m => m.count > 0) && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>📅 Activity — last 12 months</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
            {stats.monthlyActivity.map(m => {
              const pct = m.count / maxMonthly
              const barH = Math.max(pct * 64, m.count > 0 ? 6 : 2)
              return (
                <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {m.count > 0 && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{m.count}</div>}
                  <div style={{ width: '100%', borderRadius: 3, background: m.count > 0 ? 'var(--accent)' : 'var(--border)', height: `${barH}px`, opacity: m.count > 0 ? 1 : 0.4, transition: 'height 0.4s' }} />
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Rating distribution */}
        {stats.totalRated > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>⭐ Rating breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[10,9,8,7,6,5,4,3,2,1].map(n => {
                const color = n >= 8 ? '#1d9e75' : n >= 5 ? '#ba7517' : '#e24b4a'
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 14, textAlign: 'right', flexShrink: 0 }}>{n}</div>
                    <Bar value={stats.ratingDist[n]} max={maxRating} color={color} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 18, flexShrink: 0, textAlign: 'right' }}>
                      {stats.ratingDist[n] || ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top 5 rated */}
        {stats.topRated.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>🏆 Your top rated</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.topRated.map((item, i) => (
                <div key={item.tmdb_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text-muted)', width: 18, flexShrink: 0, textAlign: 'center' }}>{i + 1}</div>
                  <div style={{ width: 30, height: 44, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)' }}>
                    {item.poster_path
                      ? <img src={IMG(item.poster_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🎬</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title || item.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#ef9f27' }}>★ {item.rating}/10</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fun footer fact */}
      {stats.totalHours >= 24 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            You've spent an estimated{' '}
            <strong style={{ color: 'var(--text)' }}>{formatHours(stats.totalHours)}</strong>{' '}
            watching movies and TV on bingr.
            {stats.totalHours >= 168 && (
              <> That's over <strong style={{ color: 'var(--text)' }}>{Math.floor(stats.totalHours / 168)} week{Math.floor(stats.totalHours / 168) > 1 ? 's' : ''}</strong> of your life — worth every second 🍿</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
