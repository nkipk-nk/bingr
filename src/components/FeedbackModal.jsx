import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug report', desc: 'Something is broken or not working' },
  { value: 'feature', label: '💡 Feature request', desc: 'I have an idea for bingr' },
  { value: 'content', label: '🎬 Missing content', desc: 'A title is missing or incorrect' },
  { value: 'general', label: '💬 General feedback', desc: 'Anything else on your mind' },
]

export default function FeedbackModal({ session, profile, onClose }) {
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [step, setStep] = useState('form') // form | success | error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!message.trim()) { setError('Please enter a message.'); return }
    if (message.trim().length < 10) { setError('Please write at least 10 characters.'); return }
    setLoading(true); setError('')
    try {
      const { error } = await supabase.from('bingr_feedback').insert({
        user_id: session?.user?.id || null,
        username: profile?.username || null,
        email: email.trim() || null,
        category,
        message: message.trim().slice(0, 2000),
      })
      if (error) throw error
      logger.info('Feedback submitted', { category })
      setStep('success')
    } catch (err) {
      logger.error('Feedback submission failed', err)
      setError('Failed to send. Please try again.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 800, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '1.75rem 1.5rem 2.5rem', width: '100%', maxWidth: 520, border: '1px solid var(--border)', borderBottom: 'none', animation: 'slideUp 0.25s ease', maxHeight: '90vh', overflowY: 'auto' }}>
        <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 1.5rem' }} />

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Thanks for the feedback!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Every message helps make bingr better. I read every single one.
            </p>
            <button onClick={onClose} style={BtnPrimary}>Close</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Send feedback</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Your message goes directly to the bingr developer. No middlemen.</p>

            {/* Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map(c => (
                <div key={c.value} onClick={() => setCategory(c.value)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${category === c.value ? 'var(--accent)' : 'var(--border)'}`, background: category === c.value ? 'rgba(232,57,42,0.06)' : 'var(--bg-input)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: category === c.value ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                </div>
              ))}
            </div>

            {/* Message */}
            <div style={{ marginBottom: 14 }}>
              <label style={Lbl}>Message *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe your feedback in detail…" rows={4} maxLength={2000}
                style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>{message.length}/2000</div>
            </div>

            {/* Email (for non-logged-in or to override) */}
            {!session && (
              <div style={{ marginBottom: 14 }}>
                <label style={Lbl}>Email (optional — if you want a reply)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            )}

            {error && <div style={{ fontSize: 13, color: '#e24b4a', padding: '8px 12px', background: 'rgba(226,75,74,0.08)', borderRadius: 8, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
              <button onClick={submit} disabled={!message.trim() || loading}
                style={{ ...BtnPrimary, flex: 2, opacity: !message.trim() || loading ? 0.7 : 1, cursor: !message.trim() || loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const Lbl = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }
const BtnPrimary = { padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }
