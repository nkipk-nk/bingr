import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'
import styles from './Modal.module.css'

// §8 Modal/Sheet spec: bottom sheet is the default shell everywhere
// (resolves BINGR_UI_AUDIT.md CX9's two-paradigm split). size: 'compact'
// (content-height, caps at 60vh) | 'full' (90vh, internal scroll).
export default function Modal({ open, onClose, title, size = 'compact', children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={[styles.sheet, styles[size]].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.handle} />
        {title && (
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <Button variant="icon" onClick={onClose} aria-label="Close"><X size={18} /></Button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
