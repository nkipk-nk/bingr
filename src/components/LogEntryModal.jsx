import { useState } from 'react'
import { Star, Repeat2, BookOpen } from 'lucide-react'
import { RATING_LABELS } from '../lib/constants'
import Modal from './ui/Modal'
import Button from './ui/Button'
import starStyles from './StarRating.module.css'
import styles from './LogEntryModal.module.css'

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
    <Modal
      open onClose={onClose} size="compact"
      title={<>{isRewatch ? <Repeat2 size={18} className={styles.titleIcon} /> : <BookOpen size={18} className={styles.titleIcon} />}{isRewatch ? 'Log a rewatch' : 'Log to diary'}</>}
    >
      <div className={styles.subtitle}>{title}</div>

      <div className={styles.field}>
        <label className={styles.label}>Watched on</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} className={styles.dateInput} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Rating {isRewatch ? '(optional — updates your overall rating)' : ''}</label>
        <div className={styles.ratingRow}>
          <div className={starStyles.stars}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setRating(rating === n ? 0 : n)}
                onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                className={[starStyles.star, displayRating >= n ? starStyles.starFilled : ''].filter(Boolean).join(' ')}>
                <Star size={20} fill={displayRating >= n ? 'currentColor' : 'none'} strokeWidth={displayRating >= n ? 0 : 1.5} />
              </button>
            ))}
          </div>
          <span className={styles.ratingLabel}>{displayRating ? `${displayRating}/10 — ${RATING_LABELS[displayRating]}` : 'No rating'}</span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={1000}
          placeholder="Your thoughts on this watch…" className={styles.textarea} />
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" className={styles.cancelBtn} onClick={onClose}>Cancel</Button>
        <Button variant="primary" className={styles.saveBtn} onClick={save} loading={saving}>Save to diary</Button>
      </div>
    </Modal>
  )
}
