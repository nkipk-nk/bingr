import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import WatchLogCard from '../components/WatchLogCard'
import LogEntryModal from '../components/LogEntryModal'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../contexts/useToast'
import { formatDate } from '../lib/dates'
import { sanitise } from '../lib/errors'
import styles from './DiaryPage.module.css'

export default function DiaryPage({ diaryHook, onOpen, onGoDiscover }) {
  const { entries, loading, deleteEntry, updateEntry } = diaryHook
  const { showToast } = useToast()
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  if (loading) return <div className={styles.centeredMsg}>Loading…</div>

  if (!entries.length) return (
    <EmptyState
      icon={BookOpen} title="Your diary is empty" description="Log when you watch something from the title's detail page"
      actionLabel={onGoDiscover ? 'Browse Discover' : undefined} onAction={onGoDiscover}
    />
  )

  // Group entries by month
  const groups = {}
  entries.forEach(e => {
    const key = formatDate(e.watched_date, 'month')
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })

  const openEntry = (e) => onOpen({ id: e.tmdb_id, media_type: e.media_type, title: e.title, poster_path: e.poster_path, release_date: e.release_date })

  return (
    <div>
      <div className={styles.header}><BookOpen size={18} /> My Diary</div>
      <div className={styles.sub}>{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} logged</div>

      {Object.entries(groups).map(([month, monthEntries]) => (
        <div key={month} className={styles.monthGroup}>
          <div className={styles.monthLabel}>{month}</div>
          <div className={styles.list}>
            {monthEntries.map(e => (
              <WatchLogCard
                key={e.id}
                variant="diary"
                day={new Date(e.watched_date).getDate()}
                posterPath={e.poster_path}
                title={e.title}
                year={(e.release_date || '').slice(0, 4)}
                mediaType={e.media_type}
                rating={e.rating}
                notes={e.notes}
                rewatch={e.rewatch}
                onOpenTitle={() => openEntry(e)}
                onDelete={() => setConfirmTarget(e)}
                onEdit={() => setEditTarget(e)}
              />
            ))}
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => { deleteEntry(confirmTarget.id); setConfirmTarget(null) }}
        title="Remove diary entry?"
        message={confirmTarget ? `Remove this diary entry for "${confirmTarget.title}"?` : ''}
      />

      {editTarget && (
        <LogEntryModal
          item={{ id: editTarget.tmdb_id, media_type: editTarget.media_type, title: editTarget.title, poster_path: editTarget.poster_path, release_date: editTarget.release_date }}
          editEntry={editTarget}
          isRewatch={editTarget.rewatch}
          onSave={async ({ watchedDate, rating, notes }) => {
            await updateEntry(editTarget.id, { watched_date: watchedDate, rating, notes: sanitise(notes, 1000) || null })
            showToast('Diary entry updated', { tone: 'success' })
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
