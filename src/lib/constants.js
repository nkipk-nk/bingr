// Shared display constants. Previously duplicated across up to 7 files —
// RATING_LABELS was copy-pasted verbatim into App.jsx, export.js,
// StarRating.jsx, LogEntryModal.jsx, ActivityFeed.jsx, UserProfilePage.jsx,
// and Rankings.jsx (as LABELS); STATUS_LABELS existed 4 times with
// genuinely different values in each ('Watched' vs 'Watched ✓' vs
// 'Want to Watch'), so the label a user saw depended on which screen they
// were looking at.

export const RATING_LABELS = [
  '', 'Terrible', 'Poor', 'Disappointing', 'Below average', 'Average',
  'Decent', 'Good', 'Great', 'Excellent', 'Masterpiece',
]

// The single canonical label set — plain, so it reads correctly in any
// context (section headers, confirm dialogs, badges). DetailPanel's old
// 'Watched ✓' had the checkmark baked into the label itself; that's really
// a "this is the currently active status" affordance specific to its status
// toggle buttons, so DetailPanel now appends it itself only when relevant,
// rather than every consumer of this constant inheriting a checkmark that
// only makes sense in one place. 'Want to Watch' (export.js's old value) is
// kept separately as EXPORT_STATUS_LABELS since exported text files read
// better with a full phrase than a short badge word.
export const STATUS_LABELS = { watched: 'Watched', watching: 'Watching', watchlist: 'Watchlist' }
export const EXPORT_STATUS_LABELS = { watchlist: 'Want to Watch', watching: 'Watching', watched: 'Watched' }
export const STATUS_COLORS = { watched: '#1d9e75', watching: '#ba7517', watchlist: '#378add' }
