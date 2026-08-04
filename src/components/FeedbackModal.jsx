import { useState } from 'react'
import { Bug, Lightbulb, Clapperboard, MessageCircle, HeartHandshake } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import { sanitise } from '../lib/errors'
import Modal from './ui/Modal'
import Button from './ui/Button'
import styles from './FeedbackModal.module.css'

const CATEGORIES = [
  { value: 'bug', label: 'Bug report', icon: Bug, desc: 'Something is broken or not working' },
  { value: 'feature', label: 'Feature request', icon: Lightbulb, desc: 'I have an idea for bingr' },
  { value: 'content', label: 'Missing content', icon: Clapperboard, desc: 'A title is missing or incorrect' },
  { value: 'general', label: 'General feedback', icon: MessageCircle, desc: 'Anything else on your mind' },
]

export default function FeedbackModal({ session, profile, page, onClose }) {
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
        message: sanitise(message, 2000),
        // Captured automatically, not asked of the user — extra debugging
        // context (what screen they were on, what browser/device) without
        // adding fields to an already-short form.
        page_context: page || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
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

  if (step === 'success') return (
    <Modal open onClose={onClose} size="compact">
      <div className={styles.successWrap}>
        <HeartHandshake size={40} className={styles.successIcon} />
        <div className={styles.successTitle}>Thanks for the feedback!</div>
        <p className={styles.successDesc}>
          I read every message personally, usually within a few days.
          {email.trim() ? " I'll reply if it needs one." : ' Most feedback doesn\'t need a reply, but leave an email next time if you want one.'}
        </p>
        <Button variant="primary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )

  return (
    <Modal open onClose={onClose} title="Send feedback" size="full">
      <p className={styles.intro}>Your message goes directly to the bingr developer. No middlemen.</p>

      <div className={styles.categoryGrid}>
        {CATEGORIES.map(c => (
          <div key={c.value} onClick={() => setCategory(c.value)}
            className={[styles.categoryCard, category === c.value ? styles.categoryCardActive : ''].filter(Boolean).join(' ')}>
            <div className={[styles.categoryLabel, category === c.value ? styles.categoryLabelActive : ''].filter(Boolean).join(' ')}>
              <c.icon size={14} /> {c.label}
            </div>
            <div className={styles.categoryDesc}>{c.desc}</div>
          </div>
        ))}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Message *</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Describe your feedback in detail…" rows={4} maxLength={2000}
          className={styles.textarea} />
        <div className={styles.charCount}>{message.length}/2000</div>
      </div>

      {!session && (
        <div className={styles.field}>
          <label className={styles.label}>Email (optional — if you want a reply)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={styles.dateInput} />
        </div>
      )}

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.actions}>
        <Button variant="secondary" className={styles.cancelBtn} onClick={onClose}>Cancel</Button>
        <Button variant="primary" className={styles.submitBtn} onClick={submit} disabled={!message.trim()} loading={loading}>Send feedback</Button>
      </div>
    </Modal>
  )
}
