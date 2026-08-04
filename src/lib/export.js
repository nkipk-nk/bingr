/**
 * Bingr export utilities
 * Exports watchlist/library data as TXT or CSV
 */

import { EXPORT_STATUS_LABELS as STATUS_LABELS, RATING_LABELS } from './constants'
import { formatDate } from './dates'

/**
 * Download a text file in the browser
 */
function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download a full-account data export as a single JSON file.
 * Fulfils the Privacy Policy's data-portability promise ("receive your data
 * in a structured, machine-readable format") for real, rather than only via
 * a manual request to support — previously the only self-service export was
 * the library-only TXT/CSV above.
 */
export function downloadFullExport(bundle) {
  const payload = {
    exported_at: new Date().toISOString(),
    format_version: 1,
    ...bundle,
  }
  download(
    `bingr-full-export-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8',
  )
}

/**
 * Filter and sort library items for export
 * @param {object} library
 * @param {object} opts
 * @param {string} opts.status - 'all' | 'watchlist' | 'watching' | 'watched'
 * @param {string} opts.mediaType - 'all' | 'movie' | 'tv'
 * @param {string} opts.sortBy - 'added' | 'rating' | 'title' | 'year'
 * @param {number|null} opts.limit - null = all, number = top N
 */
export function filterLibrary(library, { status = 'all', mediaType = 'all', sortBy = 'added', limit = null } = {}) {
  let items = Object.values(library)
  // watchlisted is an independent flag, not a status value — see
  // useLibrary.js's setStatus comment.
  if (status === 'watchlist') items = items.filter(x => x.watchlisted)
  else if (status !== 'all') items = items.filter(x => x.status === status)
  if (mediaType !== 'all') items = items.filter(x => x.media_type === mediaType)

  items.sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
    if (sortBy === 'title') return (a.title || a.name || '').localeCompare(b.title || b.name || '')
    if (sortBy === 'year') {
      const ay = (a.release_date || '').slice(0, 4)
      const by = (b.release_date || '').slice(0, 4)
      return by.localeCompare(ay)
    }
    // default: added (updated_at desc)
    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
  })

  if (limit) items = items.slice(0, limit)
  return items
}

/**
 * Export as plain text — human readable, editable
 */
export function exportTXT(items, opts = {}) {
  const date = formatDate(new Date(), 'full')
  const statusLabel = opts.status && opts.status !== 'all' ? STATUS_LABELS[opts.status] || opts.status : 'All'
  const typeLabel = opts.mediaType && opts.mediaType !== 'all' ? (opts.mediaType === 'movie' ? 'Movies' : 'TV Shows') : 'Movies & TV'

  let txt = `BINGR EXPORT\n`
  txt += `${'─'.repeat(40)}\n`
  txt += `Generated: ${date}\n`
  txt += `Filter: ${statusLabel} · ${typeLabel}\n`
  txt += `Total: ${items.length} title${items.length !== 1 ? 's' : ''}\n`
  txt += `${'─'.repeat(40)}\n\n`

  if (!items.length) {
    txt += '(No items match the selected filters)\n'
  } else {
    items.forEach((item, i) => {
      const title = item.title || item.name || 'Unknown'
      const year = (item.release_date || item.first_air_date || '').slice(0, 4)
      const type = item.media_type === 'tv' ? 'TV Series' : 'Movie'
      const status = STATUS_LABELS[item.status] || ''
      const rating = item.rating ? `${item.rating}/10 (${RATING_LABELS[item.rating]})` : ''
      const tmdbR = item.vote_average ? `TMDB: ${Number(item.vote_average).toFixed(1)}` : ''

      txt += `${i + 1}. ${title}${year ? ` (${year})` : ''}\n`
      txt += `   Type: ${type}\n`
      if (status) txt += `   Status: ${status}\n`
      if (item.watchlisted) txt += `   On Watchlist: Yes\n`
      if (rating) txt += `   My Rating: ${rating}\n`
      if (tmdbR) txt += `   ${tmdbR}\n`
      txt += '\n'
    })
  }

  txt += `${'─'.repeat(40)}\n`
  txt += `Exported from bingr · Track your watch life\n`

  const slug = (opts.status || 'all').replace(/\s/g, '-')
  download(`bingr-${slug}-${Date.now()}.txt`, txt)
}

/**
 * Export as CSV — structured, opens in Excel / Google Sheets
 */
export function exportCSV(items, opts = {}) {
  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headers = ['Title', 'Year', 'Type', 'Status', 'On Watchlist', 'My Rating', 'Rating Label', 'TMDB Score', 'Added Date']
  const rows = items.map(item => [
    item.title || item.name || '',
    (item.release_date || item.first_air_date || '').slice(0, 4),
    item.media_type === 'tv' ? 'TV Series' : 'Movie',
    STATUS_LABELS[item.status] || '',
    item.watchlisted ? 'Yes' : '',
    item.rating || '',
    item.rating ? RATING_LABELS[item.rating] : '',
    item.vote_average ? Number(item.vote_average).toFixed(1) : '',
    item.updated_at ? formatDate(item.updated_at, 'full') : '',
  ])

  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
  const slug = (opts.status || 'all').replace(/\s/g, '-')
  download(`bingr-${slug}-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8')
}

/**
 * Export a List as TXT
 */
export function exportListTXT(listName, items) {
  const date = formatDate(new Date(), 'full')
  let txt = `BINGR LIST: ${listName.toUpperCase()}\n`
  txt += `${'─'.repeat(40)}\n`
  txt += `Generated: ${date}\n`
  txt += `Total: ${items.length} title${items.length !== 1 ? 's' : ''}\n`
  txt += `${'─'.repeat(40)}\n\n`
  items.forEach((item, i) => {
    const title = item.title || item.name || 'Unknown'
    const year = (item.release_date || '').slice(0, 4)
    const type = item.media_type === 'tv' ? 'TV' : 'Film'
    txt += `${i + 1}. ${title}${year ? ` (${year})` : ''} [${type}]\n`
  })
  txt += `\n${'─'.repeat(40)}\nExported from bingr\n`
  download(`bingr-list-${listName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.txt`, txt)
}

export function exportListCSV(listName, items) {
  const escape = (val) => {
    if (!val && val !== 0) return ''
    const str = String(val)
    return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
  }
  const headers = ['Title', 'Year', 'Type', 'TMDB Score']
  const rows = items.map(item => [
    item.title || item.name || '',
    (item.release_date || '').slice(0, 4),
    item.media_type === 'tv' ? 'TV Series' : 'Movie',
    item.vote_average ? Number(item.vote_average).toFixed(1) : '',
  ])
  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
  download(`bingr-list-${listName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8')
}
