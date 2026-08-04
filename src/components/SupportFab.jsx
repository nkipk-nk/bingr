import { useState } from 'react'
import { Coffee } from 'lucide-react'
import Modal from './ui/Modal'
import SupportSection from './SupportSection'
import styles from './SupportFab.module.css'

// The floating support button, brought back after living briefly as a tab
// on the profile page (RD13, BINGR_UI_AUDIT.md) — a donate action isn't
// "your data" the way Stats/Rankings/Lists are, so it read as buried there.
// The original floating button was retired because it sat in the exact
// bottom-right thumb zone BottomNav also needs on mobile (see
// BINGR_DESIGN_SYSTEM.md's nav section) — this one sits above BottomNav
// instead of on top of it (same breakpoint split as NavShell's
// .toastOffset), so it doesn't recreate that collision.
export default function SupportFab({ session, profile }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className={styles.fab} onClick={() => setOpen(true)} aria-label="Support bingr" title="Support bingr">
        <Coffee size={22} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Support bingr" size="full">
        <SupportSection session={session} profile={profile} />
      </Modal>
    </>
  )
}
