import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { IMG } from '../lib/tmdb'
import { computeStats, formatHours } from '../lib/stats'

const RATING_LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']

export default function UserProfilePage({ username, onOpenItem, onSignUp, currentUserId }) {
  const [profile, setProfile] = useState(null)
  const [library, setLibrary] = useState([])
  const [libraryMap, setLibraryMap] = useState({})
  const stats = useMemo(() => computeStats(diary, libraryMap, {}), [diary, libraryMap])
  const [diary, setDiary] = useState([])
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('rankings')

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return }

    supabase.from('profiles').select('*').eq('username', username).single()
      .then(async ({ data: profileData, error }) => {
        if (error || !profileData) { setNotFound(true); setLoading(false); return }
        if (profileData.profile_public === false) { setNotFound(true); setLoading(false); return }
        setProfile(profileData)

        const [libRes, diaryRes, listsRes] = await Promise.all([
          supabase.from('bingr_library').select('*').eq('user_id', profileData.id).order('rating', { ascending: false }),
          supabase.from('bingr_diary').select('*').eq('user_id', profileData.id).order('watched_date', { ascending: false }).limit(20),
          supabase.from('bingr_lists').select('*, bingr_list_items(count)').eq('user_id', profileData.id).eq('is_public', true).order('updated_at', { ascending: false }),
        ])
        const libData = libRes.data || []
        setLibrary(libData.filter(x => x.rating > 0).sort((a,b) => b.rating - a.rating))
        // Build map for stats computation
        const map = {}
        libData.forEach(row => { map[row.tmdb_id] = row })
        setLibraryMap(map)
        setDiary(diaryRes.data || [])
        setLists(listsRes.data || [])
        setLoading(false)
      })
  }, [username])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading profile…</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Profile not found</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>This user doesn't exist or has a private profile.</p>
        <button onClick={() => window.location.href = '/'} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Go to bingr</button>
      </div>
    </div>
  )

  const movieCount = library.filter(x => x.media_type === 'movie' && x.status === 'watched').length
  const tvCount = library.filter(x => x.media_type === 'tv' && x.status === 'watched').length
  const isOwnProfile = currentUserId === profile.id

  const TABS = [
    { id: 'rankings', label: `🏆 Top Rated (${library.length})` },
    { id: 'stats', label: '📊 Stats' },
    { id: 'diary', label: `📔 Recent Activity (${diary.length})` },
    { id: 'lists', label: `📋 Lists (${lists.length})` },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <img src="/logo.png" alt="bingr" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: -0.5 }}>bingr</span>
        </div>
        {!currentUserId && (
          <button onClick={onSignUp} style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign up free
          </button>
        )}
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Profile header */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
            {(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{profile.display_name || profile.username}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{profile.username}{isOwnProfile && ' (you)'}</div>
            {profile.bio && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>{profile.bio}</p>}
          </div>
          <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{movieCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Movies</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{tvCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TV Shows</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{library.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rated</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`, color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: tab === t.id ? 600 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Rankings tab */}
        {tab === 'rankings' && (
          library.length === 0 ? <Empty icon="🏆" text="No ratings yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {library.map((item, i) => (
                <div key={item.tmdb_id} onClick={() => onOpenItem({ ...item, id: item.tmdb_id })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text-muted)', minWidth: 24, textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ width: 36, height: 54, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)' }}>
                    {item.poster_path
                      ? <img src={IMG(item.poster_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎬</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(item.release_date || '').slice(0, 4)} · {item.media_type === 'tv' ? 'TV' : 'Film'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ef9f27' }}>★ {item.rating}/10</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{RATING_LABELS[item.rating]}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Diary tab */}
        {tab === 'stats' && (
          <div>
            {/* Compact stats for public profile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { icon: '🎬', value: stats.totalMovies, label: 'Movies watched' },
                { icon: '📺', value: stats.totalShows, label: 'TV shows tracked' },
                { icon: '▶️', value: stats.totalEpisodes, label: 'Episodes watched' },
                { icon: '⏱️', value: formatHours(stats.totalHours), label: 'Watch time est.' },
                { icon: '⭐', value: stats.avgRating > 0 ? `${stats.avgRating}/10` : '—', label: 'Avg rating' },
                { icon: '📔', value: stats.diaryTotal, label: 'Diary entries' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Activity chart */}
            {stats.monthlyActivity.some(m => m.count > 0) && (() => {
              const maxM = Math.max(...stats.monthlyActivity.map(m => m.count), 1)
              return (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>📅 Activity — last 12 months</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 70 }}>
                    {stats.monthlyActivity.map(m => {
                      const h = Math.max((m.count / maxM) * 50, m.count > 0 ? 5 : 2)
                      return (
                        <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          {m.count > 0 && <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{m.count}</div>}
                          <div style={{ width: '100%', borderRadius: 2, background: m.count > 0 ? 'var(--accent)' : 'var(--border)', height: `${h}px`, opacity: m.count > 0 ? 1 : 0.4 }} />
                          <div style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center' }}>{m.label}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {tab === 'diary' && (
          diary.length === 0 ? <Empty icon="📔" text="No activity yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {diary.map(e => (
                <div key={e.id} onClick={() => onOpenItem({ id: e.tmdb_id, media_type: e.media_type, title: e.title, poster_path: e.poster_path, release_date: e.release_date })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 54, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-input)' }}>
                    {e.poster_path
                      ? <img src={IMG(e.poster_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎬</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.title}{e.rewatch && <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 6 }}>🔁</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(e.watched_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {e.rating ? ` · ★ ${e.rating}/10` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Lists tab */}
        {tab === 'lists' && (
          lists.length === 0 ? <Empty icon="📋" text="No public lists yet" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {lists.map(list => (
                <div key={list.id} onClick={() => window.location.href = `/list/${list.id}`}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', cursor: 'pointer' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{list.name}</div>
                  {list.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{list.description}</div>}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{list.bingr_list_items?.[0]?.count ?? 0} titles</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* CTA for visitors */}
        {!currentUserId && (
          <div style={{ marginTop: 40, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Track your own watch life</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>bingr is free. Rate movies, track episodes, build your own profile.</p>
            <button onClick={onSignUp} style={{ padding: '11px 28px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sign up free →</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  )
}
