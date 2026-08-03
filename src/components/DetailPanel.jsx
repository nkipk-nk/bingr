import { useEffect, useState } from 'react'
import {
  ArrowLeft, CheckCircle2, Play, Bookmark, BookOpen, Repeat2,
  Layers, MonitorPlay, Globe, Lock,
} from 'lucide-react'
import { tmdb, IMG } from '../lib/tmdb'
import { logger } from '../lib/logger'
import { STATUS_LABELS } from '../lib/constants'
import StarRating from './StarRating'
import EpisodeTracker from './EpisodeTracker'
import LogEntryModal from './LogEntryModal'
import CommentsSection from './CommentsSection'
import { useComments } from '../hooks/useComments'
import { useToast } from '../contexts/useToast'
import Button from './ui/Button'
import Card from './ui/Card'
import Modal from './ui/Modal'
import PosterTile from './ui/PosterTile'
import ProgressBar from './ui/ProgressBar'
import { PageTabBar } from './ui/Tab'
import styles from './DetailPanel.module.css'

const STATUS_ICON = { watched: CheckCircle2, watching: Play, watchlist: Bookmark }
const STATUS_ACTIVE_CLASS = {
  watched: styles.statusBtnActiveWatched,
  watching: styles.statusBtnActiveWatching,
  watchlist: styles.statusBtnActiveWatchlist,
}

const ProviderChips = ({ items, label }) => items.length ? (
  <div className={styles.providerGroup}>
    <div className={styles.providerLabel}>{label}</div>
    <div className={styles.providerScroll}>
      {items.map(p => (
        <div key={p.provider_id} className={styles.providerChip}>
          {p.logo_path && <img src={IMG(p.logo_path, 'w45')} alt="" className={styles.providerLogo} />}
          {p.provider_name}
        </div>
      ))}
    </div>
  </div>
) : null

export default function DetailPanel({ item, entry = {}, onBack, onSetStatus, onSetRating, episodeProps, lists = [], onAddToList, onLogDiary, diaryEntries = [], session, profile, onShowAuth }) {
  const { showToast } = useToast()
  const [details, setDetails] = useState(null)
  const [providers, setProviders] = useState({})
  const [recs, setRecs] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [epTab, setEpTab] = useState(false)
  const [showListPicker, setShowListPicker] = useState(false)
  const [addedToList, setAddedToList] = useState(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [isRewatchLog, setIsRewatchLog] = useState(false)
  const type = item.media_type || 'movie'
  const commentsHook = useComments(item.id, type, session, profile)
  const isTV = type === 'tv'

  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setDetails(null); setProviders({}); setRecs([]); setEpTab(false); setLoadError(false)
    Promise.all([
      isTV ? tmdb.tvDetails(item.id) : tmdb.movieDetails(item.id),
      tmdb.providers(type, item.id),
      tmdb.recommendations(type, item.id),
    ]).then(([d, p, r]) => {
      if (cancelled) return
      setDetails(d)
      setProviders(p.results || {})
      setRecs((r.results || []).slice(0, 8).map(x => ({ ...x, media_type: type })))
    }).catch(err => {
      // Previously unhandled — a TMDB failure left `details` null forever and
      // "Where to watch" showed "Loading..." with no way out.
      if (cancelled) return
      logger.error('Failed to load title details', err, { tmdbId: item.id, type })
      setLoadError(true)
    })
    return () => { cancelled = true }
  }, [item.id, type, retryTick])

  const title = item.title || item.name || ''
  const year = (item.release_date || item.first_air_date || '').slice(0, 4)
  const tmdbRating = item.vote_average ? item.vote_average.toFixed(1) : ''
  const poster = IMG(item.poster_path, 'w780')
  const genres = (details?.genres || []).map(g => g.name).join(', ')
  const extra = details?.runtime ? `${details.runtime} min`
    : details?.number_of_seasons ? `${details.number_of_seasons} season${details.number_of_seasons > 1 ? 's' : ''} · ${details.number_of_episodes} eps` : ''

  // Movie runtime, once details have loaded — passed along to onSetStatus so
  // the library row stores a real value instead of stats.js's flat average.
  // bingr_library.runtime_minutes only applies to movies: TV watch-time
  // comes entirely from summed bingr_episodes rows, not the library row.
  const itemForStatus = !isTV && details?.runtime ? { ...item, runtime_minutes: details.runtime } : item
  const episodeRuntime = isTV ? (details?.episode_run_time?.[0] || null) : null

  const regionData = providers.KE || providers.US || providers.GB || {}
  const flat = regionData.flatrate || []
  const rent = regionData.rent || []
  const buy = regionData.buy || []

  // Next episode up
  const nextEp = isTV && details?.seasons && episodeProps
    ? episodeProps.getNextEpisode(item.id, details.seasons)
    : null
  const showProgress = isTV && details?.seasons && episodeProps
    ? episodeProps.getShowProgress(item.id, details.seasons)
    : null

  return (
    <div>
      <Button variant="ghost" size="sm" className={styles.backBtn} onClick={() => onBack()}>
        <ArrowLeft size={16} /> Back
      </Button>

      {/* Hero — full-bleed poster art, per BINGR_DESIGN_SYSTEM.md §9 */}
      <div className={styles.hero}>
        {poster
          ? <img src={poster} alt={title} className={styles.heroImg} />
          : <div className={styles.heroFallback}>🎬</div>
        }
        <div className={styles.heroGradient} />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            {[year, isTV ? 'TV Series' : 'Movie', genres, extra].filter(Boolean).join(' · ')}
            {tmdbRating && ` · TMDB ★ ${tmdbRating}`}
          </div>

          <div className={styles.statusRow}>
            {['watched', 'watching', 'watchlist'].map(s => {
              const Icon = STATUS_ICON[s]
              const active = entry.status === s
              return (
                <button key={s} onClick={() => onSetStatus(itemForStatus, s)}
                  className={[styles.statusBtn, active ? STATUS_ACTIVE_CLASS[s] : ''].filter(Boolean).join(' ')}>
                  <Icon size={14} /> {STATUS_LABELS[s]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {loadError && (
          <div className={styles.errorBanner}>
            <span>Couldn't load full details. You can still rate and track this title.</span>
            <Button variant="ghost" size="sm" onClick={() => setRetryTick(t => t + 1)}>Retry</Button>
          </div>
        )}

        {/* Overall progress for TV */}
        {showProgress && showProgress.total > 0 && (
          <div>
            <div className={styles.progressLine}>
              {showProgress.watched}/{showProgress.total} episodes watched
              {nextEp && <span className={styles.progressNext}>▶ Next: S{String(nextEp.season).padStart(2, '0')}E{String(nextEp.episode).padStart(2, '0')}</span>}
              {!nextEp && showProgress.watched === showProgress.total && <span className={styles.progressDone}>All caught up ✓</span>}
            </div>
            <ProgressBar value={showProgress.watched} max={showProgress.total} />
          </div>
        )}

        {/* Diary logging / Add to list */}
        <div className={styles.actionsRow}>
          {onLogDiary && (
            <Button variant="secondary" size="sm" onClick={() => { setIsRewatchLog(diaryEntries.length > 0); setShowLogModal(true) }}>
              {diaryEntries.length > 0 ? <><Repeat2 size={14} /> Log rewatch ({diaryEntries.length})</> : <><BookOpen size={14} /> Log to diary</>}
            </Button>
          )}
          {lists.length > 0 && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowListPicker(true)}>
                <Layers size={14} /> Add to list
              </Button>
              {addedToList && <span className={styles.addedNotice}>✓ Added to {addedToList}</span>}
            </>
          )}
        </div>

        <p className={styles.overview}>{details?.overview || item.overview || ''}</p>

        {/* Sub-tabs for TV: Overview / Episodes */}
        {isTV && (
          <PageTabBar
            className={styles.subTabs}
            value={epTab ? 'episodes' : 'overview'}
            onChange={id => setEpTab(id === 'episodes')}
            items={[{ id: 'overview', label: 'Overview' }, { id: 'episodes', label: 'Episodes' }]}
          />
        )}

        {epTab && isTV && details ? (
          <Card>
            <EpisodeTracker
              show={details}
              isWatched={(sid, s, e) => episodeProps?.isWatched(sid, s, e)}
              toggleEpisode={(sid, s, e) => episodeProps?.toggleEpisode(sid, s, e, episodeRuntime)}
              markSeasonWatched={(sid, s, eps) => episodeProps?.markSeasonWatched(sid, s, eps, episodeRuntime)}
              getSeasonProgress={(sid, s, count) => episodeProps?.getSeasonProgress(sid, s, count)}
            />
          </Card>
        ) : (
          <>
            <Card>
              <div className={styles.sectionTitle}><MonitorPlay size={16} className={styles.sectionIcon} />Where to watch</div>
              {flat.length || rent.length || buy.length ? (
                <><ProviderChips items={flat} label="Stream" /><ProviderChips items={rent} label="Rent" /><ProviderChips items={buy} label="Buy" /></>
              ) : (
                <div className={styles.noProviders}>{loadError ? 'Streaming info unavailable right now.' : details ? 'No streaming info available for your region.' : 'Loading...'}</div>
              )}
            </Card>

            <Card>
              <div className={styles.sectionTitle}>Your rating</div>
              <StarRating value={entry.rating || 0} onChange={r => onSetRating(item, r)} />
            </Card>
          </>
        )}

        {/* Recommendations */}
        {!epTab && recs.length > 0 && (
          <div>
            <div className={styles.sectionTitle}>You might also like</div>
            <div className={styles.recsGrid}>
              {recs.map(r => (
                <div key={r.id} className={styles.recCard} onClick={() => onBack(r)}>
                  <PosterTile size="md" src={r.poster_path ? IMG(r.poster_path) : null} alt={r.title || r.name} />
                  <div className={styles.recTitle}>{r.title || r.name}</div>
                  <div className={styles.recYear}>{(r.release_date || r.first_air_date || '').slice(0, 4)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments — always visible regardless of episode tab */}
        {!epTab && (
          <CommentsSection
            commentsHook={commentsHook}
            session={session}
            profile={profile}
            onOpenProfile={(username) => { window.location.href = `/@${username}` }}
            onShowAuth={onShowAuth}
          />
        )}
      </div>

      {/* Add-to-list — bottom-sheet picker per BINGR_DESIGN_SYSTEM.md §9,
          resolving BINGR_UI_AUDIT.md CX9's inline-dropdown/sheet split */}
      <Modal open={showListPicker} onClose={() => setShowListPicker(false)} title="Add to list" size="compact">
        {lists.map(list => (
          <button key={list.id} className={styles.listOption} onClick={async () => {
            const ok = await onAddToList(list.id, item)
            if (ok) { setAddedToList(list.name); setTimeout(() => setAddedToList(null), 2000) }
            setShowListPicker(false)
          }}>
            {list.is_public ? <Globe size={14} className={styles.listIcon} /> : <Lock size={14} className={styles.listIcon} />}
            {list.name}
          </button>
        ))}
      </Modal>

      {showLogModal && (
        <LogEntryModal
          item={item}
          currentRating={entry.rating}
          isRewatch={isRewatchLog}
          onSave={async (opts) => {
            await onLogDiary(item, opts)
            // If a rating was given and it's a first watch, also set the overall rating
            if (opts.rating && !isRewatchLog) onSetRating(item, opts.rating)
            showToast(isRewatchLog ? 'Rewatch logged' : 'Logged to diary', { tone: 'success' })
          }}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </div>
  )
}
