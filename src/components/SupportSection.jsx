import { useState, useEffect } from 'react'
import { Coffee, Smartphone, Globe, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import Button from './ui/Button'
import styles from './SupportSection.module.css'

const AMOUNTS = [50, 150, 300]
const getNumber = () => ['07', '00', '231', '485'].join('')

// The floating ☕ button's content, extracted so it can render as a plain
// in-page section instead of a modal — the button itself is retired
// (BINGR_UI_AUDIT.md GP-nav / BINGR_DESIGN_SYSTEM.md's nav section: it
// occupied the same bottom-right thumb zone the bottom nav needs, and
// "support" isn't a primary-enough task to earn a persistent floating
// trigger). Same donation flow, now living in the You hub.
export default function SupportSection({ session, profile, onShowSupporters }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [supporters, setSupporters] = useState([])

  const countryCode = profile?.country_code || null
  const kenyan = countryCode === 'KE'

  useEffect(() => {
    supabase
      .from('bingr_donations')
      .select('username, amount_kes, donated_at')
      .eq('confirmed', true)
      .eq('show_on_wall', true)
      .order('donated_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (error) { logger.warn('Failed to load recent supporters', { message: error.message }); return }
        setSupporters(data || [])
      })
  }, [])

  const handleCopy = async () => {
    const num = getNumber()
    try { await navigator.clipboard.writeText(num) }
    catch {
      const el = document.createElement('textarea')
      el.value = num; document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    logger.info('M-Pesa number copied')
  }

  const number = getNumber()

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <Coffee size={36} className={styles.heroIcon} />
        <div className={styles.heroTitle}>Support bingr</div>
        <p className={styles.heroDesc}>
          bingr is free, ad-free, and built by one developer in Nairobi.
          If it saves you time or brings you joy, a small support means a lot 🙏
        </p>
      </div>

      <div className={styles.amounts}>
        {AMOUNTS.map(a => <div key={a} className={styles.amountChip}>KES {a}</div>)}
      </div>

      {!session ? (
        <div className={styles.notice}><div className={styles.noticeText}>Sign in to support bingr</div></div>
      ) : kenyan ? (
        !revealed ? (
          <Button variant="primary" className={styles.fullBtn} onClick={() => setRevealed(true)}>
            <Smartphone size={16} /> Show M-Pesa number
          </Button>
        ) : (
          <div className={styles.mpesaCard}>
            <div className={styles.mpesaLabel}>Send to this M-Pesa number:</div>
            <div className={styles.mpesaRow}>
              <div className={styles.mpesaNumber}>{number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</div>
              <Button variant="secondary" size="sm" onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy'}</Button>
            </div>
            <div className={styles.mpesaHint}>M-Pesa → Send Money → Enter number → Enter amount → PIN</div>
          </div>
        )
      ) : (
        <div className={styles.intlCard}>
          <Globe size={28} className={styles.intlIcon} />
          <div className={styles.intlTitle}>International support coming soon</div>
          <div className={styles.intlDesc}>We're working on international payment options. Sharing bingr with friends is equally valuable — thank you 💚</div>
        </div>
      )}

      <p className={styles.disclaimer}>No pressure — bingr is free forever 💚</p>

      {supporters.length > 0 && (
        <div className={styles.recentSupporters}>
          <div className={styles.recentHeader}>
            <div className={styles.recentTitle}><Sparkles size={14} /> Recent supporters</div>
            <button onClick={onShowSupporters} className={styles.recentViewAll}>View all →</button>
          </div>
          <div className={styles.recentList}>
            {supporters.map((s, i) => (
              <div key={i} className={styles.recentRow}>
                <div className={styles.recentName}>{s.username}</div>
                <div className={styles.recentAmount}>KES {s.amount_kes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
