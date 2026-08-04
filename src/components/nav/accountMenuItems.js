import { UserRound, IdCard, Settings, MessageCircle, Sparkles, LogOut, AlertTriangle } from 'lucide-react'

// Single source of truth for what the account/profile menu contains —
// consumed by both AccountMenu.jsx (header dropdown) and YouHub.jsx's
// Account tab, the same actions reachable two ways per
// BINGR_DESIGN_SYSTEM.md's nav section. Previously each hand-typed its own
// copy of this list and could drift.
//
// Privacy Policy / Terms of Service are deliberately not items here — they're
// footer-only now (BINGR_UI_AUDIT.md RD10), not repeated in every menu that
// happens to also expose account actions.
export function accountMenuItems({ isAdmin }) {
  return [
    { id: 'edit-profile', icon: UserRound, label: 'Edit profile' },
    { id: 'view-public-profile', icon: IdCard, label: 'View public profile' },
    isAdmin
      ? { id: 'admin', icon: Settings, label: 'Admin panel' }
      : { id: 'feedback', icon: MessageCircle, label: 'Send feedback' },
    { id: 'supporters', icon: Sparkles, label: 'Supporters' },
    { id: 'sign-out', icon: LogOut, label: 'Sign out' },
    { id: 'delete-account', icon: AlertTriangle, label: 'Delete account', danger: true },
  ]
}
