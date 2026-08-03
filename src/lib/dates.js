const FORMATS = {
  full: { day: 'numeric', month: 'short', year: 'numeric' },
  short: { day: 'numeric', month: 'short' },
  month: { year: 'numeric', month: 'long' },
}

// CX6 (BINGR_UI_AUDIT.md) — ~14 call sites each wrote their own
// toLocaleDateString('en-KE', {...}) options object for what was
// conceptually 3 needs. One utility, three named formats.
export function formatDate(date, format = 'full') {
  return new Date(date).toLocaleDateString('en-KE', FORMATS[format])
}
