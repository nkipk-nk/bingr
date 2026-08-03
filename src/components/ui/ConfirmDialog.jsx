import Modal from './Modal'
import Button from './Button'

// Built on Modal's compact shell — resolves BINGR_UI_AUDIT.md CX10's
// inconsistent delete-confirmation treatments into one component.
export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Are you sure?', message,
  confirmLabel = 'Delete', cancelLabel = 'Cancel',
  danger = true, loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="compact">
      {message && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body-md-size)', marginBottom: 'var(--space-6)' }}>{message}</p>}
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} confirming={danger} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
