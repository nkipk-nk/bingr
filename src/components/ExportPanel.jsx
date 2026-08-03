import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { exportTXT, exportCSV } from '../lib/export'
import { useToast } from '../contexts/useToast'
import Card from './ui/Card'
import Select from './ui/Select'
import Button from './ui/Button'
import styles from './ExportPanel.module.css'

// Status/type/sort used to be duplicated here and in LibraryTab — both
// hand-rolled their own selectors for the same three things. Now this
// panel just exports whatever LibraryPage.jsx currently has on screen
// (`items`, already filtered/sorted there), and only owns the one control
// genuinely specific to exporting: how many rows to include.
export default function ExportPanel({ items, status, mediaType }) {
  const { showToast } = useToast()
  const [limit, setLimit] = useState('all')
  const [open, setOpen] = useState(false)

  const preview = limit === 'all' ? items : items.slice(0, parseInt(limit))

  const handleExport = (format) => {
    const opts = { status, mediaType }
    if (format === 'txt') exportTXT(preview, opts)
    if (format === 'csv') exportCSV(preview, opts)
    showToast(`Library exported as ${format.toUpperCase()}`, { tone: 'success' })
  }

  return (
    <Card className={styles.panel}>
      <div className={styles.header} onClick={() => setOpen(v => !v)}>
        <div className={styles.headerLeft}><Download size={16} /> Export my library</div>
        <ChevronDown size={16} className={[styles.chevron, open ? styles.chevronOpen : ''].filter(Boolean).join(' ')} />
      </div>

      {open && (
        <div className={styles.content}>
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
    </Card>
  )
}
