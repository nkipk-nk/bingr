import { useState, useRef, useEffect } from 'react'
import { Download } from 'lucide-react'
import { exportTXT, exportCSV } from '../lib/export'
import { useToast } from '../contexts/useToast'
import Select from './ui/Select'
import Button from './ui/Button'
import styles from './ExportPanel.module.css'

// Status/type/sort used to be duplicated here and in LibraryTab — both
// hand-rolled their own selectors for the same three things. Now this
// panel just exports whatever LibraryPage.jsx currently has on screen
// (`items`, already filtered/sorted there), and only owns the one control
// genuinely specific to exporting: how many rows to include.
//
// Was a full-width card that took up a whole row whether collapsed or
// open — now a small button with an anchored dropdown, matching the same
// pattern as AccountMenu.jsx, so it sits inline with the other library
// toolbar controls instead of pushing everything below it down a row.
export default function ExportPanel({ items, status, mediaType }) {
  const { showToast } = useToast()
  const [limit, setLimit] = useState('all')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const preview = limit === 'all' ? items : items.slice(0, parseInt(limit))

  const handleExport = (format) => {
    const opts = { status, mediaType }
    if (format === 'txt') exportTXT(preview, opts)
    if (format === 'csv') exportCSV(preview, opts)
    showToast(`Library exported as ${format.toUpperCase()}`, { tone: 'success' })
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(v => !v)}>
        <Download size={14} /> Export
      </Button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.limitRow}>
            <div className={styles.limitLabel}>Limit</div>
            <Select value={limit} onChange={e => setLimit(e.target.value)}>
              <option value="all">All ({items.length})</option>
              <option value="10">Top 10</option>
              <option value="25">Top 25</option>
              <option value="50">Top 50</option>
            </Select>
          </div>

          <div className={styles.preview}>{preview.length} title{preview.length !== 1 ? 's' : ''} will be exported</div>

          <div className={styles.actions}>
            <Button variant="primary" size="sm" disabled={!preview.length} onClick={() => handleExport('txt')}>Download TXT</Button>
            <Button variant="secondary" size="sm" disabled={!preview.length} onClick={() => handleExport('csv')}>Download CSV</Button>
          </div>
        </div>
      )}
    </div>
  )
}
