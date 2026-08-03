import { useState } from 'react'
import {
  Button, Input, Select, Card, Modal, ConfirmDialog,
  NavTabBar, PageTabBar, Avatar, Badge, StatusPill, RatingBadge,
  Toast, Skeleton, PosterTile, EmptyState, FollowButton,
} from '../components/ui'
import { Compass, Rss, Bookmark, BookOpen, UserRound, Film } from 'lucide-react'

// Dev-only sandbox for the design-system primitives (Phase 0 of the
// implementation plan) — not part of the production route tree. Wired in
// main.jsx behind import.meta.env.DEV, at /_dev/components. Strip or ignore
// in production; it never ships (DEV-gated, and dead-code-eliminated by the
// build either way since main.jsx only imports it inside the DEV branch).
export default function ComponentPlayground() {
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark')
  const [navTab, setNavTab] = useState('discover')
  const [pageTab, setPageTab] = useState('top-rated')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [following, setFollowing] = useState(false)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    setTheme(next)
  }

  const section = (label, node) => (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {node}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', padding: 24, paddingBottom: 100 }}>
      <button onClick={toggleTheme} style={{ position: 'fixed', top: 16, right: 16, zIndex: 10, padding: '8px 16px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer' }}>
        Theme: {theme}
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Component playground</h1>

      {section('Button', (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="danger" confirming>Confirm delete</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" pill>Pill</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="icon" aria-label="More"><Film size={18} /></Button>
        </div>
      ))}

      {section('Input / Select', (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 480 }}>
          <Input placeholder="Search movies & TV shows…" style={{ flex: 1, minWidth: 200 }} />
          <Input placeholder="Error state" error="This field is required" style={{ flex: 1, minWidth: 200 }} />
          <Select style={{ minWidth: 140 }}>
            <option>All</option>
            <option>Movies</option>
            <option>TV Shows</option>
          </Select>
        </div>
      ))}

      {section('Card', (
        <Card style={{ maxWidth: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Card title</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Default container primitive — bg-surface, radius-md, hairline border.</div>
        </Card>
      ))}

      {section('Avatar', (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar size="sm" name="Claude Test" />
          <Avatar size="md" name="Claude Test" />
          <Avatar size="lg" name="Claude Test" />
        </div>
      ))}

      {section('Badge / StatusPill / RatingBadge', (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="warning">Warning</Badge>
          <StatusPill status="watched" />
          <StatusPill status="watching" />
          <StatusPill status="watchlist" />
          <RatingBadge rating={8} />
        </div>
      ))}

      {section('FollowButton', (
        <FollowButton following={following} onToggle={() => setFollowing(v => !v)} />
      ))}

      {section('Skeleton', (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton shape="circle" width={40} height={40} />
          <Skeleton shape="rect" width={120} height={16} />
          <Skeleton shape="poster" width={80} />
        </div>
      ))}

      {section('PosterTile', (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <PosterTile size="sm" src="https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg" onClick={() => {}} />
          <div style={{ width: 140 }}><PosterTile size="md" src="https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg" onClick={() => {}} /></div>
          <PosterTile size="lg" src="https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg" onClick={() => {}} />
        </div>
      ))}

      {section('NavTabBar (bottom nav)', (
        <div style={{ maxWidth: 420, background: 'var(--bg-surface)', borderRadius: 12 }}>
          <NavTabBar
            value={navTab}
            onChange={setNavTab}
            items={[
              { id: 'discover', label: 'Discover', icon: Compass },
              { id: 'feed', label: 'Feed', icon: Rss },
              { id: 'library', label: 'Library', icon: Bookmark },
              { id: 'diary', label: 'Diary', icon: BookOpen },
              { id: 'you', label: 'You', icon: UserRound },
            ]}
          />
        </div>
      ))}

      {section('PageTabBar (in-page)', (
        <div style={{ maxWidth: 420 }}>
          <PageTabBar
            value={pageTab}
            onChange={setPageTab}
            items={[
              { id: 'top-rated', label: 'Top Rated' },
              { id: 'stats', label: 'Stats' },
              { id: 'diary', label: 'Diary' },
              { id: 'lists', label: 'Lists' },
            ]}
          />
        </div>
      ))}

      {section('EmptyState', (
        <EmptyState
          icon={Film}
          title="Nothing here yet"
          description="Your watchlist is empty — add something to get started."
          actionLabel="Browse trending"
          onAction={() => {}}
        />
      ))}

      {section('Modal / ConfirmDialog / Toast', (
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Open confirm dialog</Button>
          <Button variant="secondary" onClick={() => setToastMsg(`Toast at ${new Date().toLocaleTimeString()}`)}>Show toast</Button>
        </div>
      ))}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add to list" size="compact">
        <div style={{ color: 'var(--text-secondary)' }}>Bottom-sheet modal content goes here.</div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title="Delete this entry?"
        message="This can't be undone."
      />

      <Toast message={toastMsg} tone="success" onDismiss={() => setToastMsg('')} action={{ label: 'Undo', onClick: () => setToastMsg('') }} />
    </div>
  )
}
