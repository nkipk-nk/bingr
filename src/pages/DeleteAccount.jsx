import { useState } from 'react'

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
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, fontFamily: 'inherit', padding: 0 }}>← Back</button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem' }}>

        {step === 1 && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Delete your account</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 16 }}>
              This will permanently delete your bingr account and <strong style={{ color: 'var(--text)' }}>all associated data</strong>, including:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
              {['Your watchlist, watched list, and watchlist', 'All episode tracking progress', 'All ratings and rankings', 'Your account login'].map(item => (
                <li key={item} style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
            <p style={{ fontSize: 14, color: '#e24b4a', fontWeight: 500, marginBottom: 20 }}>
              This action is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onBack} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#e24b4a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Confirm deletion</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.7 }}>
              You are about to permanently delete the account for <strong style={{ color: 'var(--text)' }}>{userEmail}</strong>.
              Type <strong style={{ color: 'var(--text)' }}>delete my account</strong> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete my account"
              autoFocus
              style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: `1px solid ${canConfirm ? '#e24b4a' : 'var(--border)'}`, borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                Back
              </button>
              <button onClick={handleDelete} disabled={!canConfirm} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: canConfirm ? '#e24b4a' : 'var(--border)', color: canConfirm ? '#fff' : 'var(--text-muted)', cursor: canConfirm ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}>
                Delete permanently
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Deleting your account and all data...</p>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Account deleted</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Your account and all data have been permanently deleted. You will be signed out shortly.
            </p>
          </div>
        )}

        {step === 5 && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Deletion failed</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{errorMsg}</p>
            <button onClick={() => setStep(1)} style={{ padding: '9px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
