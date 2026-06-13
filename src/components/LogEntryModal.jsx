import { useState } from 'react'

const RATING_LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']

export default function LogEntryModal({ item, currentRating, onSave, onClose, isRewatch }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [rating, setRating] = useState(currentRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const title = item.title || item.name || ''
  const displayRating = hoverRating || rating

  const save = async () => {
    setSaving(true)
    await onSave({ watchedDate: date, rewatch: isRewatch, rating: rating || null, notes })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 800, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '1.75rem 1.5rem 2.5rem', width: '100%', maxWidth: 480, border: '1px solid var(--border)', borderBottom: 'none', animation: 'slideUp 0.25s ease' }}>
        <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 1.5rem' }} />

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {isRewatch ? '🔁 Log a rewatch' : '📔 Log to diary'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{title}</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={Lbl}>Watched on</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)}
            style={Inp} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={Lbl}>Rating {isRewatch ? '(optional — updates your overall rating)' : ''}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setRating(rating === n ? 0 : n)}
                  onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                  style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: displayRating >= n ? '#ef9f27' : 'var(--border-strong)', padding: '0 1px', lineHeight: 1 }}>★</button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayRating ? `${displayRating}/10 — ${RATING_LABELS[displayRating]}` : 'No rating'}</span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={Lbl}>Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={1000}
            placeholder="Your thoughts on this watch…" style={{ ...Inp, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save to diary'}
          </button>
        </div>
      </div>
    </div>
  )
}

const Lbl = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }
const Inp = { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
