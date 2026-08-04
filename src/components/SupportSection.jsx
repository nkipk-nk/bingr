import { useState } from 'react'
import { Coffee, Smartphone, Globe } from 'lucide-react'
import { logger } from '../lib/logger'
import Button from './ui/Button'
import styles from './SupportSection.module.css'

const AMOUNTS = [50, 150, 300]
const getNumber = () => ['07', '00', '231', '485'].join('')

// The donate flow only — no "recent supporters" preview here. That data
// already has its own full destination (SupportersPage.jsx, reachable from
// the account dropdown), so showing a teaser of it inside this modal too
// was the same link/content in two places at once.
export default function SupportSection({ session, profile }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const countryCode = profile?.country_code || null
  const kenyan = countryCode === 'KE'

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
    </div>
  )
}
