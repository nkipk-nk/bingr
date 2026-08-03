import {
  Clapperboard, Star, Tv, Search, Layers, MonitorPlay,
} from 'lucide-react'
import { IMG } from '../lib/tmdb'
import Button from '../components/ui/Button'
import styles from './LandingPage.module.css'

const FEATURES = [
  { icon: Clapperboard, title: 'Track everything', desc: 'Movies, TV shows, individual episodes — all in one place. Never lose track of where you left off.' },
  { icon: Star, title: 'Rate & rank', desc: 'Rate on a 10-point scale and build your personal rankings. Know exactly what was worth your time.' },
  { icon: Tv, title: 'Episode tracking', desc: 'Mark episodes watched one by one. See your progress per season and know exactly what\'s up next.' },
  { icon: Search, title: 'Discover what\'s next', desc: 'Browse trending titles and get smart recommendations based on what you\'ve already watched.' },
  { icon: Layers, title: 'Create lists', desc: 'Curate your own lists — "Best heist films", "Date night picks" — and share them with anyone.' },
  { icon: MonitorPlay, title: 'Find where to watch', desc: 'See exactly which streaming services have what you want. No more jumping between apps.' },
]

const STATS = [
  { num: '500K+', label: 'Titles searchable' },
  { num: '10', label: 'Point rating scale' },
  { num: '100%', label: 'Free, no ads' },
]

const STEPS = [
  { step: '1', title: 'Create a free account', desc: 'Sign up with your email. No payment info needed.' },
  { step: '2', title: 'Search any title', desc: 'Find any movie or TV show from our 500K+ database.' },
  { step: '3', title: 'Track & rate', desc: 'Mark it watched, rate it, track episodes. Build your library.' },
]

export default function LandingPage({ onSignUp, onSignIn, onShowPrivacy, onShowTerms, trending }) {
  // Poster-collage hero (BINGR_DESIGN_SYSTEM.md §9) — reuses the same
  // trending data App.jsx already fetches for Discover, no extra request.
  const collagePosters = [...(trending?.movies || []), ...(trending?.tv || [])]
    .filter(x => x.poster_path)
    .slice(0, 18)

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="bingr" className={styles.brandLogo} />
          <span className={styles.brandName}>bingr</span>
        </div>
        <div className={styles.navActions}>
          <Button variant="secondary" size="sm" onClick={onSignIn}>Sign in</Button>
          <Button variant="primary" size="sm" onClick={onSignUp}>Sign up free</Button>
        </div>
      </nav>

      <section className={styles.hero}>
        {collagePosters.length > 0 && (
          <div className={styles.collage}>
            {collagePosters.map((p, i) => (
              <div key={`${p.id}-${i}`} className={styles.collageTile}>
                <img src={IMG(p.poster_path)} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}
        <div className={styles.scrim} />

        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>Free · No ads · No fluff</div>
          <h1 className={styles.headline}>
            Track your watch life.<br />
            <span className={styles.headlineAccent}>Never miss a moment.</span>
          </h1>
          <p className={styles.subhead}>
            bingr is your personal tracking app for movies and TV shows. Rate what you've seen, track every episode, discover what to watch next, and share curated lists with friends.
          </p>
          <div className={styles.ctaRow}>
            <Button variant="primary" onClick={onSignUp}>Start tracking free →</Button>
            <Button variant="secondary" onClick={onSignIn}>Sign in</Button>
          </div>
          <p className={styles.ctaSub}>No credit card needed · Takes 30 seconds</p>
        </div>
      </section>

      <section className={styles.statsBar}>
        <div className={styles.statsRow}>
          {STATS.map(s => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className={styles.attribution}>Catalogue data provided by The Movie Database (TMDB)</div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Everything you need</h2>
        <p className={styles.sectionSub}>Built for people who take their watching seriously</p>
        <div className={styles.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title}>
              <f.icon size={28} className={styles.featureIcon} />
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>Get started in seconds</h2>
        <div className={`${styles.stepsRow} ${styles.stepsRowSpaced}`}>
          {STEPS.map(s => (
            <div key={s.step} className={styles.step}>
              <div className={styles.stepNum}>{s.step}</div>
              <div className={styles.stepTitle}>{s.title}</div>
              <div className={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.finalCta}`}>
        <h2 className={styles.sectionTitle}>Ready to start tracking?</h2>
        <p className={`${styles.sectionSub} ${styles.finalCtaSub}`}>Join bingr for free. No ads, no nonsense.</p>
        <Button variant="primary" onClick={onSignUp}>Create free account →</Button>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>
          <img src="/logo.png" alt="" className={styles.brandLogo} />
          <span className={styles.footerBrandName}>bingr</span>
        </span>
        <button className={styles.footerLink} onClick={onShowPrivacy}>Privacy Policy</button>
        <button className={styles.footerLink} onClick={onShowTerms}>Terms of Service</button>
        <span className={styles.footerCopy}>© {new Date().getFullYear()} bingr · Made in Nairobi 🇰🇪</span>
      </footer>
    </div>
  )
}
