import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IMG } from '../lib/tmdb'

export default function PublicListPage({ listId, onSignUp }) {
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!listId) { setNotFound(true); setLoading(false); return }
    Promise.all([
      supabase.from('bingr_lists').select('*').eq('id', listId).eq('is_public', true).single(),
      supabase.from('bingr_list_items').select('*').eq('list_id', listId).order('added_at', { ascending: false })
    ]).then(([{ data: listData }, { data: itemData }]) => {
      if (!listData) { setNotFound(true); setLoading(false); return }
      setList(listData)
      setItems(itemData || [])
      setLoading(false)
    }).catch(() => { setNotFound(true); setLoading(false) })
  }, [listId])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading list…</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>List not found</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>This list is private or doesn't exist.</p>
        <button onClick={() => window.location.href = '/'} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Go to bingr</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <img src="/logo.png" alt="bingr" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: -0.5 }}>bingr</span>
        </div>
        <button onClick={onSignUp} style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign up free
        </button>
      </header>

      {/* List header */}
      <div style={{ padding: '2rem 1.5rem 1rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{list.name}</h1>
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)', flexShrink: 0 }}>🌐 Public list</span>
          </div>
          {list.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 10 }}>{list.description}</p>}
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{items.length} title{items.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Items grid */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>This list is empty.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {items.map(item => (
              <div key={item.tmdb_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2/3', background: 'var(--bg-input)', overflow: 'hidden' }}>
                  {item.poster_path
                    ? <img src={IMG(item.poster_path)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎬</div>
                  }
                </div>
                <div style={{ padding: '7px 9px 9px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.title || item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{(item.release_date || '').slice(0, 4)} · {item.media_type === 'tv' ? 'TV' : 'Film'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA for non-users */}
        <div style={{ marginTop: 40, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
          <img src="/logo.png" alt="bingr" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', marginBottom: 10 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Track your own watch life</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
            bingr is free. Rate movies, track episodes, create your own lists and share them.
          </p>
          <button onClick={onSignUp} style={{ padding: '11px 28px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign up free →
          </button>
        </div>
      </div>
    </div>
  )
}
