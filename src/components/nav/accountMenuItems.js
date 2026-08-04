import { UserRound, SlidersHorizontal, Settings, MessageCircle, Sparkles, LogOut, AlertTriangle } from 'lucide-react'

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
// 'my-profile' goes straight to the real profile page (/@username) — not a
// separate settings form. 'account-settings' is a distinct destination for
// account-level controls (email, privacy, data export, delete account) that
// aren't part of your public identity. These used to be conflated under one
// "Edit profile" item that was actually a settings form, with the real
// profile page reachable only as a separate, redundant "View public
// profile" item (RD11).
export function accountMenuItems({ isAdmin }) {
  return [
    { id: 'my-profile', icon: UserRound, label: 'My Profile' },
    { id: 'account-settings', icon: SlidersHorizontal, label: 'Account Settings' },
    isAdmin
      ? { id: 'admin', icon: Settings, label: 'Admin panel' }
      : { id: 'feedback', icon: MessageCircle, label: 'Send feedback' },
    { id: 'supporters', icon: Sparkles, label: 'Supporters' },
    { id: 'sign-out', icon: LogOut, label: 'Sign out' },
    { id: 'delete-account', icon: AlertTriangle, label: 'Delete account', danger: true },
  ]
}
