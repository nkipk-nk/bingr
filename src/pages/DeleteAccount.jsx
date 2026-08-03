import { useState } from 'react'
import { ArrowLeft, AlertTriangle, ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import styles from './DeleteAccount.module.css'

export default function DeleteAccount({ onBack, onDelete, userEmail }) {
  const [step, setStep] = useState(1) // 1 = warning, 2 = confirm, 3 = deleting, 4 = done, 5 = error
  const [confirmText, setConfirmText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const CONFIRM_PHRASE = 'delete my account'
  const canConfirm = confirmText.trim().toLowerCase() === CONFIRM_PHRASE

  const handleDelete = async () => {
    setStep(3)
    const { error } = await onDelete()
    if (error) {
      setErrorMsg(error)
      setStep(5)
    } else {
      setStep(4)
    }
  }

  return (
    <div className={styles.wrap}>
      <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </Button>

      <Card roomy>
        {step === 1 && (
          <>
            <AlertTriangle size={36} className={styles.icon} />
            <h2 className={styles.heading}>Delete your account</h2>
            <p className={styles.body}>
              This will permanently delete your bingr account and <strong className={styles.strong}>all associated data</strong>, including:
            </p>
            <ul className={styles.list}>
              {[
                'Your watchlist, watching, and watched lists',
                'All episode tracking progress',
                'All ratings, rankings, and diary entries',
                'Your custom lists and comments',
                'Your follows and followers',
                'Your account login',
              ].map(item => (
                <li key={item} className={styles.listItem}>{item}</li>
              ))}
            </ul>
            <p className={styles.bodySm}>
              Feedback and donation records tied to your account are kept for our support and
              accounting history, but are anonymised — your username and email are removed from them.
            </p>
            <p className={styles.warning}>This action is permanent and cannot be undone.</p>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onBack}>Cancel</Button>
              <Button variant="danger" confirming onClick={() => setStep(2)}>Continue</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <ShieldCheck size={36} className={styles.iconNeutral} />
            <h2 className={[styles.heading, styles.headingTight].join(' ')}>Confirm deletion</h2>
            <p className={styles.body}>
              You are about to permanently delete the account for <strong className={styles.strong}>{userEmail}</strong>.
              Type <strong className={styles.strong}>delete my account</strong> to confirm.
            </p>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete my account"
              autoFocus
              invalid={canConfirm}
              className={styles.inputMarginBottom}
            />
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button variant="danger" confirming={canConfirm} disabled={!canConfirm} onClick={handleDelete}>Delete permanently</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className={styles.centered}>
            <Loader2 size={36} className={`${styles.iconNeutral} ${styles.spin}`} />
            <p className={[styles.body, styles.bodyNoMargin].join(' ')}>Deleting your account and all data...</p>
          </div>
        )}

        {step === 4 && (
          <div className={styles.centered}>
            <CheckCircle2 size={36} className={styles.iconSuccess} />
            <h2 className={[styles.heading, styles.headingSm].join(' ')}>Account deleted</h2>
            <p className={[styles.body, styles.bodyNoMargin].join(' ')}>
              Your account and all data have been permanently deleted. You will be signed out shortly.
            </p>
          </div>
        )}

        {step === 5 && (
          <>
            <XCircle size={36} className={styles.icon} />
            <h2 className={[styles.heading, styles.headingSm].join(' ')}>Deletion failed</h2>
            <p className={styles.body}>{errorMsg}</p>
            <Button variant="secondary" onClick={() => setStep(1)}>Try again</Button>
          </>
        )}
      </Card>
    </div>
  )
}
