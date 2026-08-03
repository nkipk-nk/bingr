import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Coffee, PartyPopper, HeartHandshake } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'
import styles from './SupportersPage.module.css'

export default function SupportersPage({ onBack }) {
  const [supporters, setSupporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [total, setTotal] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    supabase
      .from('bingr_donations')
      .select('username, amount_kes, donated_at, note')
      .eq('confirmed', true)
      .eq('show_on_wall', true)
      .order('donated_at', { ascending: false })
      .then(({ data, error }) => {
        // Previously discarded `error` — a failed query rendered identically
        // to "no supporters yet" instead of a distinguishable error state.
        if (error) {
          logger.error('Failed to load supporters', error)
          setLoadError(true)
          setLoading(false)
          return
        }
        setSupporters(data || [])
        setTotal((data || []).reduce((s, d) => s + (d.amount_kes || 0), 0))
        setLoading(false)
      })
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className={styles.wrap}>
      <Button variant="ghost" size="sm" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </Button>

      <div className={styles.hero}>
        <div className={styles.heroIcon}><Coffee size={32} /></div>
        <h1 className={styles.title}>bingr supporters</h1>
        <p className={styles.description}>
          These amazing people have supported bingr with M-Pesa donations, keeping it free and ad-free for everyone.
          Every contribution goes directly to hosting, maintenance, and new features.
        </p>
        {total > 0 && (
          <div className={styles.raisedBadge}>
            <PartyPopper size={14} />
            KES {total.toLocaleString()} raised total
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.list}>
          {[0, 1, 2].map(i => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton shape="circle" width={40} height={40} />
              <Skeleton shape="rect" width="100%" height={40} />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className={styles.stateBox}>
          <p>Couldn't load supporters. Please try again.</p>
          <Button variant="primary" size="sm" onClick={load}>Retry</Button>
        </div>
      ) : supporters.length === 0 ? (
        <div className={styles.stateBox}>
          <p><HeartHandshake size={16} />No supporters yet — be the first!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {supporters.map((s, i) => (
            <Card key={i} className={styles.row}>
              <div className={styles.rowIcon}><Coffee size={18} /></div>
              <div className={styles.rowBody}>
                <div className={styles.rowName}>{s.username}</div>
                {s.note && <div className={styles.rowNote}>"{s.note}"</div>}
                <div className={styles.rowDate}>
                  {new Date(s.donated_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}
                </div>
              </div>
              <div className={styles.rowAmount}>KES {s.amount_kes}</div>
            </Card>
          ))}
        </div>
      )}

      <Card roomy className={styles.cta}>
        <p>Want to support bingr? Click the coffee icon anywhere in the app.</p>
        <Button variant="primary" onClick={onBack}>Back to bingr</Button>
      </Card>
    </div>
  )
}
