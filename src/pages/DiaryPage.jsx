import { IMG } from '../lib/tmdb'

const RATING_LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']

export default function DiaryPage({ diaryHook, onOpen }) {
  const { entries, loading, deleteEntry } = diaryHook

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>

  if (!entries.length) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📔</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Your diary is empty</div>
      <div style={{ fontSize: 14 }}>Log when you watch something from the title's detail page</div>
    </div>
  )

  // Group entries by month
  const groups = {}
  entries.forEach(e => {
    const d = new Date(e.watched_date)
    const key = d.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>📔 My Diary</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} logged</div>

      {Object.entries(groups).map(([month, monthEntries]) => (
        <div key={month} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{month}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monthEntries.map(e => {
              const day = new Date(e.watched_date).getDate()
              const poster = IMG(e.poster_path)
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{day}</div>
                  </div>
                  <div onClick={() => onOpen({ id: e.tmdb_id, media_type: e.media_type, title: e.title, poster_path: e.poster_path, release_date: e.release_date })}
                    style={{ width: 36, height: 54, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)', cursor: 'pointer' }}>
                    {poster
                      ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎬</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => onOpen({ id: e.tmdb_id, media_type: e.media_type, title: e.title, poster_path: e.poster_path, release_date: e.release_date })}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.title}{e.rewatch && <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 6 }}>🔁 Rewatch</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {(e.release_date || '').slice(0, 4)} · {e.media_type === 'tv' ? 'TV' : 'Film'}
                      {e.rating ? ` · ★ ${e.rating}/10` : ''}
                    </div>
                    {e.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>"{e.notes}"</div>}
                  </div>
                  <button onClick={() => deleteEntry(e.id)} title="Remove entry"
                    style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-input)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    onMouseEnter={e2 => { e2.currentTarget.style.background = '#e24b4a'; e2.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e2 => { e2.currentTarget.style.background = 'var(--bg-input)'; e2.currentTarget.style.color = 'var(--text-muted)' }}>✕</button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
