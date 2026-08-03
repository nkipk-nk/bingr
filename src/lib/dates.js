const FORMATS = {
  full: { day: 'numeric', month: 'short', year: 'numeric' },
  short: { day: 'numeric', month: 'short' },
  month: { year: 'numeric', month: 'long' },
  // Two more turned up in lib/stats.js's chart-label needs while wiring
  // this up — compact axis ticks and a bare "busiest month" summary
  // genuinely can't reuse the three UI-facing formats above without
  // breaking layout, so the scale grew from 3 to 5 rather than forcing
  // a wrong fit (see BINGR_UI_AUDIT.md CX6).
  monthShort: { month: 'short' },
  monthLong: { month: 'long' },
}

// CX6 (BINGR_UI_AUDIT.md) — ~14 call sites each wrote their own
// toLocaleDateString('en-KE', {...}) options object for a handful of
// distinct needs. One utility, named formats, every call site picks one.
export function formatDate(date, format = 'full') {
  return new Date(date).toLocaleDateString('en-KE', FORMATS[format])
}
