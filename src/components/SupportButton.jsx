import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

const AMOUNTS = [50, 150, 300]
const getNumber = () => ['07', '00', '000', '000'].join('') // ← replace with your real number

export default function SupportButton({ session, profile, onShowSupporters }) {
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [supporters, setSupporters] = useState([])

  const countryCode = profile?.country_code || null
  const kenyan = countryCode === 'KE'

  useEffect(() => {
    if (!open) return
    supabase
      .from('bingr_donations')
      .select('username, amount_kes, donated_at')
      .eq('confirmed', true)
      .eq('show_on_wall', true)
      .order('donated_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setSupporters(data || []))
  }, [open])

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

  const close = () => {
    setOpen(false)
    setTimeout(() => { setRevealed(false); setCopied(false) }, 300)
  }

  const number = getNumber()

  return (
    <>
      <button onClick={() => setOpen(true)} title="Support bingr"
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500, width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(232,57,42,0.4)', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(232,57,42,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,57,42,0.4)' }}>
        ☕
      </button>

      {open && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '1.75rem 1.5rem 2.5rem', width: '100%', maxWidth: 480, border: '1px solid var(--border)', borderBottom: 'none', animation: 'slideUp 0.25s ease', maxHeight: '85vh', overflowY: 'auto' }}>
            <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 1.5rem' }} />

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>☕</div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Support bingr</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                bingr is free, ad-free, and built by one developer in Nairobi.
                If it saves you time or brings you joy, a small support means a lot 🙏
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {AMOUNTS.map(a => (
                <div key={a} style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--bg-input)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>KES {a}</div>
              ))}
            </div>

            {!session ? (
              <div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>🔒 Sign in to support bingr</div>
              </div>

            ) : kenyan ? (
              !revealed ? (
                <button onClick={() => setRevealed(true)}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  📱 Show M-Pesa number
                </button>
              ) : (
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Send to this M-Pesa number:</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: 2 }}>
                      {number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                    </div>
                    <button onClick={handleCopy} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: copied ? '#1d9e75' : 'var(--bg-card)', color: copied ? '#fff' : 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', flexShrink: 0 }}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                    M-Pesa → Send Money → Enter number → Enter amount → PIN
                  </div>
                </div>
              )

            ) : (
              <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🌍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>International support coming soon</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  We're working on international payment options. Sharing bingr with friends is equally valuable — thank you 💚
                </div>
              </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '10px 0' }}>
              No pressure — bingr is free forever 💚
            </p>

            {supporters.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>🌟 Recent supporters</div>
                  <button onClick={() => { close(); onShowSupporters() }} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View all →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {supporters.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--bg-input)', borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>KES {s.amount_kes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={close} style={{ display: 'block', margin: '16px auto 0', padding: '8px 24px', border: '1px solid var(--border)', borderRadius: 10, background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
