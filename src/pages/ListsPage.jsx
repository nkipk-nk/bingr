import { useState, useEffect } from 'react'
import { IMG } from '../lib/tmdb'
import { exportListTXT, exportListCSV } from '../lib/export'

function CreateListModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim(), description.trim(), isPublic)
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 440 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: '1.25rem' }}>New List</h2>

        <div style={{ marginBottom: 14 }}>
          <label style={L}>List name *</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="e.g. Best heist movies, Date night picks…"
            maxLength={100} style={I} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={L}>Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="What's this list about?" maxLength={500} rows={3}
            style={{ ...I, resize: 'vertical', minHeight: 72 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px', background: 'var(--bg-input)', borderRadius: 10, border: `1px solid ${isPublic ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer' }}
          onClick={() => setIsPublic(v => !v)}>
          <div style={{ width: 36, height: 20, borderRadius: 10, background: isPublic ? 'var(--accent)' : 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 2, left: isPublic ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{isPublic ? '🌐 Public list' : '🔒 Private list'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isPublic ? 'Anyone with the link can view this list' : 'Only you can see this list'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim() || loading} style={{ flex: 1, padding: '10px', background: name.trim() ? 'var(--accent)' : 'var(--border)', color: name.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
            {loading ? 'Creating…' : 'Create list'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ListDetailView({ list, onBack, onDelete, onUpdate, getListItems, removeFromList, onOpenItem }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [editDesc, setEditDesc] = useState(list.description || '')
  const [editPublic, setEditPublic] = useState(list.is_public)
  const [copied, setCopied] = useState(false)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    getListItems(list.id).then(data => { setItems(data); setLoading(false) })
  }, [list.id])

  const shareUrl = `${window.location.origin}/list/${list.id}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemove = async (tmdbId) => {
    await removeFromList(list.id, tmdbId)
    setItems(prev => prev.filter(x => x.tmdb_id !== tmdbId))
  }

  const saveEdit = async () => {
    await onUpdate(list.id, { name: editName.trim(), description: editDesc.trim(), is_public: editPublic })
    setEditing(false)
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 16, fontFamily: 'inherit' }}>← Back to Lists</button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', marginBottom: 16 }}>
        {editing ? (
          <div>
            <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...I, fontSize: 18, fontWeight: 700, marginBottom: 10 }} maxLength={100} />
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ ...I, resize: 'vertical', marginBottom: 10 }} rows={2} maxLength={500} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }} onClick={() => setEditPublic(v => !v)}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: editPublic ? 'var(--accent)' : 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 2, left: editPublic ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{editPublic ? '🌐 Public' : '🔒 Private'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
              <button onClick={saveEdit} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{list.name}</h1>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => setEditing(true)} style={IconBtn} title="Edit">✏️</button>
                <button onClick={() => { if (window.confirm(`Delete "${list.name}"? This cannot be undone.`)) onDelete(list.id) }} style={{ ...IconBtn, fontSize: 13 }} title="Delete">🗑️</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              {list.is_public ? '🌐 Public' : '🔒 Private'} · {items.length} title{items.length !== 1 ? 's' : ''}
            </div>
            {list.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 12 }}>{list.description}</p>}

            {list.is_public && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
                <button onClick={handleCopyLink} style={{ padding: '5px 12px', background: copied ? '#1d9e75' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'background 0.2s' }}>
                  {copied ? '✓ Copied' : 'Copy link'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export controls */}
      {items.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>📤 Export this list</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => exportListTXT(list.name, items)} style={ExportBtn}>Download TXT</button>
              <button onClick={() => exportListCSV(list.name, items)} style={ExportBtn}>Download CSV</button>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎬</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>This list is empty</div>
          <div style={{ fontSize: 14 }}>Open any movie or TV show and click "Add to list"</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {items.map(item => (
            <div key={item.tmdb_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div onClick={() => onOpenItem({ ...item, id: item.tmdb_id })} style={{ cursor: 'pointer' }}>
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
              <button onClick={() => handleRemove(item.tmdb_id)} title="Remove from list"
                style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ListsPage({ listsHook, onOpenItem }) {
  const { lists, loading, createList, updateList, deleteList, addToList, removeFromList, getListItems } = listsHook
  const [showCreate, setShowCreate] = useState(false)
  const [activeList, setActiveList] = useState(null)

  const handleDelete = async (listId) => {
    await deleteList(listId)
    setActiveList(null)
  }

  if (activeList) {
    const list = lists.find(l => l.id === activeList) || activeList
    return (
      <ListDetailView
        list={list}
        onBack={() => setActiveList(null)}
        onDelete={handleDelete}
        onUpdate={updateList}
        getListItems={getListItems}
        removeFromList={removeFromList}
        onOpenItem={onOpenItem}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>📋 My Lists</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Curate and share your favourite titles</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '9px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          + New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>No lists yet</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>Create a list to curate and share your favourite titles</div>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create your first list</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {lists.map(list => {
            const count = list.bingr_list_items?.[0]?.count ?? 0
            return (
              <div key={list.id} onClick={() => setActiveList(list.id)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{list.name}</div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-input)', color: 'var(--text-muted)', flexShrink: 0, border: '1px solid var(--border)' }}>
                    {list.is_public ? '🌐' : '🔒'}
                  </span>
                </div>
                {list.description && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{list.description}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{count} title{count !== 1 ? 's' : ''}</div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && <CreateListModal onClose={() => setShowCreate(false)} onCreate={createList} />}
    </div>
  )
}

const L = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }
const I = { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const IconBtn = { width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }
const ExportBtn = { padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }
