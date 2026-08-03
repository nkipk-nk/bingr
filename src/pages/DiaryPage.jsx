import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import WatchLogCard from '../components/WatchLogCard'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import styles from './DiaryPage.module.css'

export default function DiaryPage({ diaryHook, onOpen }) {
  const { entries, loading, deleteEntry } = diaryHook
  const [confirmTarget, setConfirmTarget] = useState(null)

  if (loading) return <div className={styles.centeredMsg}>Loading…</div>

  if (!entries.length) return (
    <EmptyState icon={BookOpen} title="Your diary is empty" description="Log when you watch something from the title's detail page" />
  )

  // Group entries by month
  const groups = {}
  entries.forEach(e => {
    const d = new Date(e.watched_date)
    const key = d.toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
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
    </div>
  )
}
