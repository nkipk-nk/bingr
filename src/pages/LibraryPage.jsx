import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { filterLibrary } from '../lib/export'
import { STATUS_LABELS } from '../lib/constants'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import ExportPanel from '../components/ExportPanel'
import LibraryTab from './LibraryTab'
import styles from './LibraryPage.module.css'

const STATUSES = ['watchlist', 'watching', 'watched']

// GP4/GP5 (BINGR_UI_AUDIT.md) — adds the filter input and on-screen sort
// control the audit flagged as missing (sort previously only existed
// inside ExportPanel, affecting the exported file but not what you saw on
// screen). Owns the status/type/sort/filter state that ExportPanel and
// LibraryTab both used to duplicate independently.
export default function LibraryPage({ library, onOpen, onRemove, episodeProps }) {
  const [status, setStatus] = useState('all')
  const [mediaType, setMediaType] = useState('all')
  const [sortBy, setSortBy] = useState('added')
  const [filterText, setFilterText] = useState('')

  const all = Object.values(library).filter(x => STATUSES.includes(x.status))
  const statusCount = (s) => all.filter(x => x.status === s).length

  const filtered = filterLibrary(library, { status, mediaType, sortBy })
  const needle = filterText.trim().toLowerCase()
  const items = needle ? filtered.filter(x => (x.title || x.name || '').toLowerCase().includes(needle)) : filtered

  if (!all.length) return (
    <EmptyState icon={Bookmark} title="Your library is empty" description="Browse Discover to add titles" />
  )

  return (
    <div>
      <div className={styles.segmented}>
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={[styles.segmentBtn, status === s ? styles.segmentBtnActive : ''].filter(Boolean).join(' ')}>
            {s === 'all' ? `All (${all.length})` : `${STATUS_LABELS[s]} (${statusCount(s)})`}
          </button>
        ))}
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.filterInput}>
          <Input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Filter your library…" />
        </div>
        <Select className={styles.selectSm} value={mediaType} onChange={e => setMediaType(e.target.value)}>
          <option value="all">All types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </Select>
        <Select className={styles.selectSm} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="added">Date added</option>
          <option value="rating">My rating</option>
          <option value="title">Title A–Z</option>
          <option value="year">Year</option>
        </Select>
      </div>

      <ExportPanel items={items} status={status} mediaType={mediaType} />

      <LibraryTab items={items} status={status} onOpen={onOpen} onRemove={onRemove} episodeProps={episodeProps} />
    </div>
  )
}
