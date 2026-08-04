import { useState } from 'react'
import { Search, MoreHorizontal, Compass, Rss, Bookmark, BookOpen, UserRound } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import styles from './WelcomeTour.module.css'

const STEPS = [
  {
    icon: Search,
    title: 'Find anything',
    body: 'Search any movie or TV show from the bar up top — results update as you type.',
  },
  {
    icon: MoreHorizontal,
    title: 'Quick actions on any poster',
    body: 'Tap the ⋯ on a poster to mark it Watched, Watching, or Watchlist without opening it.',
  },
  {
    icon: Compass,
    title: 'Five places to go',
    body: 'Discover new titles, catch up on Feed, manage your Library, log your Diary, and see your Stats — all from the bar below.',
    nav: true,
  },
]

// GP2 (BINGR_UI_AUDIT.md) — a first-time user landing on an empty Discover
// got zero orientation. Shown once per browser (localStorage flag, not
// account data — this is presentational, not something worth a DB column)
// right after onboarding completes.
export default function WelcomeTour({ onDone }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const { icon: Icon, title, body, nav } = STEPS[step]

  return (
    <Modal open onClose={onDone} size="compact">
      <div className={styles.wrap}>
        <div className={styles.iconWrap}><Icon size={26} /></div>
        <div className={styles.title}>{title}</div>
        <p className={styles.body}>{body}</p>

        {nav && (
          <div className={styles.navPreview}>
            {[Compass, Rss, Bookmark, BookOpen, UserRound].map((NavIcon, i) => (
              <NavIcon key={i} size={18} />
            ))}
          </div>
        )}

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <span key={i} className={[styles.dot, i === step ? styles.dotActive : ''].filter(Boolean).join(' ')} />
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={onDone}>Skip</Button>
          <Button variant="primary" size="sm" onClick={() => isLast ? onDone() : setStep(s => s + 1)}>
            {isLast ? 'Got it' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
