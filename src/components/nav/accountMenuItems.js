import { SlidersHorizontal, Settings, MessageCircle, Sparkles, LogOut } from 'lucide-react'

// Single source of truth for what the account/profile menu contains,
// consumed by AccountMenu.jsx (the header dropdown — its only remaining
// consumer; the You-hub used to render an identical copy of this same list
// as its own "Account" tab, removed per RD13, BINGR_UI_AUDIT.md, rather
// than kept in sync).
//
// Privacy Policy / Terms of Service are deliberately not items here — they're
// footer-only now (BINGR_UI_AUDIT.md RD10), not repeated in every menu that
// happens to also expose account actions.
//
// No "My Profile" item either (RD14, BINGR_UI_AUDIT.md) — the primary nav's
// "You" item already navigates to /@username, and Header (with this dropdown)
// and the nav both render together at every viewport, so a second button to
// the identical destination was always on screen at the same time as the
// first, not a legitimate alternate-context entry point.
//
// No "Delete account" here either — it's account-settings' Danger Zone
// only. A quick dropdown one click from the avatar isn't where a
// permanently-destructive action should be that reachable; a deliberate
// trip to Account Settings first is the point, not friction to remove.
export function accountMenuItems({ isAdmin }) {
  return [
    { id: 'account-settings', icon: SlidersHorizontal, label: 'Account Settings' },
    isAdmin
      ? { id: 'admin', icon: Settings, label: 'Admin panel' }
      : { id: 'feedback', icon: MessageCircle, label: 'Send feedback' },
    { id: 'supporters', icon: Sparkles, label: 'Supporters' },
    { id: 'sign-out', icon: LogOut, label: 'Sign out' },
  ]
}
